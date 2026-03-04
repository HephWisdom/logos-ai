-- Align embedding column with local free model output size.
-- nomic-embed-text returns 768-dimensional vectors.

drop index if exists public.verses_embedding_ivfflat_idx;

-- Existing vectors (if any) are cleared during type conversion.
alter table public.verses
  alter column embedding type vector(768)
  using null;

create index if not exists verses_embedding_ivfflat_idx
on public.verses
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
