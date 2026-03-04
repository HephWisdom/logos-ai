import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KJV_JSON_PATH = path.join(__dirname, "kjv.json");
const BOOKS_JSON_PATH = path.join(__dirname, "Books.json");
const PROJECT_ENV_PATH = path.join(__dirname, "..", ".env");
const PROJECT_ENV_LOCAL_PATH = path.join(__dirname, "..", ".env.local");

const CANONICAL_BOOKS = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

const BOOK_ALIASES = new Map([
  ["Psalm", "Psalms"],
  ["Song of Songs", "Song of Solomon"],
  ["Canticles", "Song of Solomon"],
]);

const BOOK_ORDER = Object.fromEntries(
  CANONICAL_BOOKS.map((book, idx) => [book, idx + 1]),
);
const OT_BOOKS = new Set(CANONICAL_BOOKS.slice(0, 39));
const NT_BOOKS = new Set(CANONICAL_BOOKS.slice(39));

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

function normalizeBookName(bookName) {
  return BOOK_ALIASES.get(bookName) ?? bookName;
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

async function loadBibleJson() {
  try {
    const raw = await fs.readFile(KJV_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed?.books || !Array.isArray(parsed.books)) {
      throw new Error(
        "Invalid kjv.json format. Expected a top-level 'books' array.",
      );
    }

    return parsed;
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  const booksRaw = await fs.readFile(BOOKS_JSON_PATH, "utf8");
  const books = JSON.parse(booksRaw);

  if (!Array.isArray(books)) {
    throw new Error("Invalid Books.json format. Expected an array of book names.");
  }

  const allBooks = [];
  for (const bookName of books) {
    const fileName = `${bookName.replaceAll(" ", "")}.json`;
    const fullPath = path.join(__dirname, fileName);
    const bookRaw = await fs.readFile(fullPath, "utf8");
    const bookJson = JSON.parse(bookRaw);

    allBooks.push({
      name: bookJson.book,
      chapters: bookJson.chapters,
    });
  }

  return { books: allBooks };
}

async function seed() {
  await loadDotEnvFile(PROJECT_ENV_PATH);
  await loadDotEnvFile(PROJECT_ENV_LOCAL_PATH);

  const supabaseUrl = getEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
  const supabaseServiceKey = getEnv("SUPABASE_SERVICE_KEY");

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const bibleData = await loadBibleJson();

  let insertedCount = 0;

  for (const book of bibleData.books) {
    const normalizedBook = normalizeBookName(book.name);
    const order = BOOK_ORDER[normalizedBook];

    if (!order) {
      throw new Error(`Unknown book name in source JSON: '${book.name}'`);
    }

    for (const chapter of book.chapters ?? []) {
      const rows = (chapter.verses ?? []).map((v, i) => ({
        book: normalizedBook,
        book_order: order,
        chapter: chapter.chapter,
        verse: i + 1,
        text: v.text,
        translation: "KJV",
        testament: OT_BOOKS.has(normalizedBook)
          ? "OT"
          : NT_BOOKS.has(normalizedBook)
            ? "NT"
            : null,
      }));

      if (!rows.length) {
        continue;
      }

      const { error } = await supabase.from("verses").insert(rows);

      if (error) {
        throw new Error(
          `Insert failed for ${normalizedBook} ${chapter.chapter}: ${error.message}`,
        );
      }

      insertedCount += rows.length;
      console.log(
        `Seeded ${normalizedBook} ${chapter.chapter} (${rows.length} verses)`,
      );
    }
  }

  console.log(`Done. Inserted ${insertedCount} total verses.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
