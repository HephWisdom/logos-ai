import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ENV_PATH = path.join(__dirname, '..', '.env');
const PROJECT_ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');

const SOURCE_BASE =
  'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/sources/extras';
const FILE_INDEXES = [0, 1, 2, 3, 4, 5, 6];
const CHUNK_SIZE = 1000;

async function loadDotEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) {
        continue;
      }
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) {
        continue;
      }
      let value = rawValue.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

function getEnv(name, fallback) {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : undefined);
  if (!value) {
    throw new Error(`Missing env var: ${name}${fallback ? ` (or ${fallback})` : ''}`);
  }
  return value;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function flattenCrossReferencePayload(payload) {
  const rows = [];
  for (const item of payload.cross_references ?? []) {
    const fromVerse = item.from_verse;
    for (const target of item.to_verse ?? []) {
      const verseStart = Number(target.verse_start);
      const verseEnd = Number(target.verse_end);
      const end = Number.isFinite(verseEnd) && verseEnd >= verseStart ? verseEnd : verseStart;

      for (let verse = verseStart; verse <= end; verse += 1) {
        rows.push({
          from_book: fromVerse.book,
          from_chapter: fromVerse.chapter,
          from_verse: fromVerse.verse,
          to_book: target.book,
          to_chapter: target.chapter,
          to_verse: verse,
        });
      }
    }
  }
  return rows;
}

async function insertChunks(supabase, table, rows) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) {
      throw new Error(
        `Insert failed at chunk ${i / CHUNK_SIZE + 1} (${inserted}/${rows.length}): ${error.message}`,
      );
    }
    inserted += chunk.length;
    console.log(`Inserted ${inserted}/${rows.length} cross references`);
  }
}

async function seedCrossReferences() {
  await loadDotEnvFile(PROJECT_ENV_PATH);
  await loadDotEnvFile(PROJECT_ENV_LOCAL_PATH);

  const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const supabaseServiceKey = getEnv('SUPABASE_SERVICE_KEY');
  const targetTable = process.env.CROSS_REF_TABLE || 'cross_references';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const allRows = [];
  for (const idx of FILE_INDEXES) {
    const url = `${SOURCE_BASE}/cross_references_${idx}.json`;
    console.log(`Downloading ${url}`);
    const payload = await fetchJson(url);
    const rows = flattenCrossReferencePayload(payload);
    allRows.push(...rows);
    console.log(`Parsed file ${idx}: +${rows.length} rows`);
  }

  console.log(`Total parsed rows: ${allRows.length}`);
  await insertChunks(supabase, targetTable, allRows);
  console.log(`Done. Seeded ${allRows.length} rows into '${targetTable}'.`);
}

seedCrossReferences().catch((error) => {
  console.error(error);
  process.exit(1);
});
