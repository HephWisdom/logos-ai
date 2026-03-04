-- Enable pgvector if not already enabled.
create extension if not exists vector;

-- Atomic daily quota enforcement tied to profiles.plan.
create or replace function public.check_and_increment_daily_quota(p_user_id uuid)
returns table(
  allowed boolean,
  plan text,
  daily_limit integer,
  used_today integer,
  remaining integer,
  reset_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_used integer;
  v_last_date date;
  v_today date := current_date;
  v_limit integer;
  v_new_used integer;
begin
  select coalesce(plan, 'free'), coalesce(queries_used_today, 0), last_query_date
  into v_plan, v_used, v_last_date
  from public.profiles
  where id = p_user_id;

  if not found then
    return query select false, 'free'::text, 20, 0, 20, v_today;
    return;
  end if;

  v_limit := case
    when v_plan = 'free' then 20
    when v_plan = 'pro' then 999
    when v_plan = 'scholar' then 999
    else 20
  end;

  if v_last_date is distinct from v_today then
    v_used := 0;
  end if;

  if v_used >= v_limit then
    return query select false, v_plan, v_limit, v_used, greatest(v_limit - v_used, 0), v_today;
    return;
  end if;

  v_new_used := v_used + 1;

  update public.profiles
  set queries_used_today = v_new_used,
      last_query_date = v_today,
      updated_at = now()
  where id = p_user_id;

  return query select true, v_plan, v_limit, v_new_used, greatest(v_limit - v_new_used, 0), v_today;
end;
$$;

revoke all on function public.check_and_increment_daily_quota(uuid) from public;
grant execute on function public.check_and_increment_daily_quota(uuid) to authenticated;
grant execute on function public.check_and_increment_daily_quota(uuid) to service_role;

-- Semantic search RPC over verse embeddings.
create or replace function public.search_verse_embeddings(
  query_embedding vector,
  match_count integer default 8,
  translation_filter text default null
)
returns table(
  book text,
  chapter integer,
  verse integer,
  text text,
  translation text,
  similarity real
)
language sql
stable
as $$
  select
    v.book,
    v.chapter,
    v.verse,
    v.text,
    v.translation,
    (1 - (v.embedding <=> query_embedding))::real as similarity
  from public.verses v
  where v.embedding is not null
    and (translation_filter is null or v.translation = translation_filter)
  order by v.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

-- ANN index for cosine similarity over embeddings.
create index if not exists verses_embedding_ivfflat_idx
on public.verses
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
