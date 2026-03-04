import { supabase } from './supabase';

export async function generateQueryEmbedding(query) {
  const { data, error } = await supabase.functions.invoke('embed-query', {
    body: { query },
  });

  if (error) {
    throw new Error(error.message || 'Failed to generate embedding.');
  }

  return data?.embedding ?? [];
}

export async function searchVerseEmbeddings(query, limit = 8) {
  const embedding = await generateQueryEmbedding(query);

  const { data, error } = await supabase.rpc('search_verse_embeddings', {
    query_embedding: embedding,
    match_count: limit,
  });

  if (error) {
    throw new Error(error.message || 'Failed to search embeddings.');
  }

  return data ?? [];
}
