import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ENV_PATH = path.join(__dirname, '..', '.env');
const PROJECT_ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');

const API_BASE = 'https://bible-api.com/data';
const CHUNK_SIZE = 500;
const DEFAULT_TRANSLATIONS = ['web', 'dra'];
const REQUEST_DELAY_MS = Number(process.env.BIBLE_API_DELAY_MS || 450);
const MAX_RETRIES = 6;

const CANONICAL_BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel',
  '1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs',
  'Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke',
  'John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians',
  '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter',
  '2 Peter','1 John','2 John','3 John','Jude','Revelation',
];
const BOOK_ORDER = Object.fromEntries(CANONICAL_BOOKS.map((book, idx) => [book, idx + 1]));
const OT_BOOKS = new Set(CANONICAL_BOOKS.slice(0, 39));

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
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) {
      return response.json();
    }

    const isRetryable = response.status === 429 || response.status >= 500;
    if (!isRetryable || attempt === MAX_RETRIES) {
      throw new Error(`Failed ${url}: ${response.status} ${response.statusText}`);
    }

    const retryAfterSeconds = Number(response.headers.get('retry-after') || 0);
    const waitMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : (attempt + 1) * 1500;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

function normalizeText(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

async function insertChunked(supabase, rows) {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('verses').insert(chunk);
    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }
  }
}

async function seedTranslation(supabase, translation) {
  const translationCode = translation.toUpperCase();
  const { count, error: countError } = await supabase
    .from('verses')
    .select('book', { head: true, count: 'exact' })
    .eq('translation', translationCode);

  if (countError) {
    throw new Error(`Could not check existing rows for ${translationCode}: ${countError.message}`);
  }

  if (count > 0 && process.env.FORCE_RESEED !== '1') {
    console.log(`Resuming ${translationCode}: ${count} rows already present.`);
  }

  if (count > 0 && process.env.FORCE_RESEED === '1') {
    const { error: deleteError } = await supabase.from('verses').delete().eq('translation', translationCode);
    if (deleteError) {
      throw new Error(`Could not clear existing ${translationCode} rows: ${deleteError.message}`);
    }
  }

  const indexPayload = await fetchJson(`${API_BASE}/${translation}`);
  const books = indexPayload.books ?? [];
  let inserted = 0;

  for (const book of books) {
    const chaptersPayload = await fetchJson(`${API_BASE}/${translation}/${book.id}`);
    const chapters = chaptersPayload.chapters ?? [];

    for (const chapterInfo of chapters) {
      const { count: chapterCount, error: chapterCountError } = await supabase
        .from('verses')
        .select('book', { head: true, count: 'exact' })
        .eq('translation', translationCode)
        .eq('book', book.name)
        .eq('chapter', chapterInfo.chapter);

      if (chapterCountError) {
        throw new Error(
          `Failed chapter checkpoint ${translationCode} ${book.name} ${chapterInfo.chapter}: ${chapterCountError.message}`,
        );
      }

      if ((chapterCount ?? 0) > 0 && process.env.FORCE_RESEED !== '1') {
        continue;
      }

      const chapterPayload = await fetchJson(`${API_BASE}/${translation}/${book.id}/${chapterInfo.chapter}`);
      const verses = chapterPayload.verses ?? [];
      if (!verses.length) {
        continue;
      }

      const rows = verses.map((v) => {
        const canonBook = v.book;
        return {
          book: canonBook,
          book_order: BOOK_ORDER[canonBook] ?? null,
          chapter: v.chapter,
          verse: v.verse,
          text: normalizeText(v.text),
          translation: translationCode,
          testament: OT_BOOKS.has(canonBook) ? 'OT' : 'NT',
        };
      });

      await insertChunked(supabase, rows);
      inserted += rows.length;
      console.log(`${translationCode}: ${book.name} ${chapterInfo.chapter} seeded (${inserted} total)`);
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  }

  console.log(`Completed ${translationCode}: inserted ${inserted} rows.`);
}

async function seedTranslations() {
  await loadDotEnvFile(PROJECT_ENV_PATH);
  await loadDotEnvFile(PROJECT_ENV_LOCAL_PATH);

  const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const supabaseServiceKey = getEnv('SUPABASE_SERVICE_KEY');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const list = (process.env.BIBLE_API_TRANSLATIONS || DEFAULT_TRANSLATIONS.join(','))
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  for (const translation of list) {
    await seedTranslation(supabase, translation);
  }

  console.log('Done seeding bible-api translations.');
}

seedTranslations().catch((error) => {
  console.error(error);
  process.exit(1);
});
