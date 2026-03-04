import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ENV_PATH = path.join(__dirname, "..", ".env");
const PROJECT_ENV_LOCAL_PATH = path.join(__dirname, "..", ".env.local");
const GREEK_JSON_PATH = path.join(__dirname, "strongs-greek.json");
const HEBREW_JSON_PATH = path.join(__dirname, "strongs-hebrew.json");
const INSERT_CHUNK_SIZE = 500;

async function loadDotEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
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
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

function getEnv(name, fallback) {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : undefined);
  if (!value) {
    throw new Error(
      `Missing env var: ${name}${fallback ? ` (or ${fallback})` : ""}`,
    );
  }
  return value;
}

async function loadJsonObject(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(
      `Invalid JSON format at ${path.basename(filePath)}. Expected an object.`,
    );
  }

  return parsed;
}

function cleanValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
}

function pickField(entry, keys) {
  for (const key of keys) {
    if (entry[key] !== undefined && entry[key] !== null) {
      return cleanValue(entry[key]);
    }
  }
  return null;
}

function buildRows(lexiconObject, prefix, language) {
  return Object.entries(lexiconObject).map(([rawNum, data]) => {
    const numberPart = String(rawNum).replace(/^[A-Za-z]/, "");
    const entry = data ?? {};

    return {
      strongs_number: `${prefix}${numberPart}`,
      language,
      original_word: pickField(entry, ["lemma", "word"]),
      transliteration: pickField(entry, ["translit", "xlit", "transliteration"]),
      pronunciation: pickField(entry, ["pronounce", "pron", "pronunciation"]),
      definition: pickField(entry, ["strongs_def", "definition"]),
      usage: pickField(entry, ["kjv_def", "usage"]),
      outline_of_biblical_usage: pickField(entry, [
        "outline_of_biblical_usage",
        "outline",
      ]),
    };
  });
}

async function insertInChunks(supabase, rows, label) {
  let inserted = 0;

  for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + INSERT_CHUNK_SIZE);
    const { error } = await supabase.from("strongs").insert(chunk);

    if (error) {
      throw new Error(
        `Insert failed for ${label} chunk ${i / INSERT_CHUNK_SIZE + 1}: ${error.message}`,
      );
    }

    inserted += chunk.length;
    console.log(
      `Seeded ${label} ${inserted}/${rows.length} entries`,
    );
  }
}

async function seedStrongs() {
  await loadDotEnvFile(PROJECT_ENV_PATH);
  await loadDotEnvFile(PROJECT_ENV_LOCAL_PATH);

  const supabaseUrl = getEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
  const supabaseServiceKey = getEnv("SUPABASE_SERVICE_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const [strongsGreek, strongsHebrew] = await Promise.all([
    loadJsonObject(GREEK_JSON_PATH),
    loadJsonObject(HEBREW_JSON_PATH),
  ]);

  const greekRows = buildRows(strongsGreek, "G", "greek");
  const hebrewRows = buildRows(strongsHebrew, "H", "hebrew");

  await insertInChunks(supabase, greekRows, "Greek");
  await insertInChunks(supabase, hebrewRows, "Hebrew");

  console.log(
    `Done. Inserted ${greekRows.length + hebrewRows.length} Strong's entries.`,
  );
}

seedStrongs().catch((error) => {
  console.error(error);
  process.exit(1);
});
