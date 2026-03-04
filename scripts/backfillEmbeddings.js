import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ENV_PATH = path.join(__dirname, '..', '.env');
const PROJECT_ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');

const BATCH_SIZE = Number(process.env.EMBED_BACKFILL_BATCH_SIZE || 40);
const PAUSE_MS = Number(process.env.EMBED_BACKFILL_DELAY_MS || 150);

async function loadDotEnv(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx);
      const value = trimmed.slice(idx + 1);
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

function getEnv(name, fallback) {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : undefined);
  if (!value) throw new Error(`Missing env: ${name}${fallback ? ` (or ${fallback})` : ''}`);
  return value;
}

async function embedText(input) {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.EMBEDDING_API_KEY;
  const apiBase = process.env.EMBEDDING_API_BASE || 'http://127.0.0.1:11434/v1';
  const model = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
  const localHosts = ['localhost', '127.0.0.1', 'host.docker.internal'];
  const isLocalBase = localHosts.some((host) => apiBase.includes(host));

  if (!apiKey && !isLocalBase) {
    throw new Error('Missing GROQ_API_KEY / OPENAI_API_KEY / EMBEDDING_API_KEY');
  }

  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${apiBase}/embeddings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, input }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding API failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const embedding = payload?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error('Invalid embedding payload format');
  return embedding;
}

async function backfill() {
  await loadDotEnv(PROJECT_ENV_PATH);
  await loadDotEnv(PROJECT_ENV_LOCAL_PATH);

  const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_KEY');
  const supabase = createClient(supabaseUrl, serviceKey);

  const translationFilter = process.env.EMBED_TRANSLATION || null;

  let processed = 0;

  while (true) {
    let query = supabase
      .from('verses')
      .select('id, text, translation')
      .is('embedding', null)
      .limit(BATCH_SIZE);

    if (translationFilter) query = query.eq('translation', translationFilter.toUpperCase());

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    if (!rows?.length) break;

    for (const row of rows) {
      const embedding = await embedText(row.text);
      const { error: updateError } = await supabase
        .from('verses')
        .update({ embedding })
        .eq('id', row.id);

      if (updateError) throw new Error(`Update failed for verse id ${row.id}: ${updateError.message}`);
      processed += 1;

      if (processed % 25 === 0) {
        console.log(`Embedded ${processed} verses...`);
      }

      await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
    }
  }

  console.log(`Done. Embedded ${processed} verses.`);
}

backfill().catch((error) => {
  console.error(error);
  process.exit(1);
});
