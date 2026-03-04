import { useState } from 'react';
import { Search } from 'lucide-react';
import { supabase }    from '../services/supabase';
import { VerseCard }   from '../components/VerseCard';
import { Sidebar }     from '../components/Sidebar';
import { useAuth }     from '../hooks/useAuth';
import { searchVerseEmbeddings } from '../services/embeddings';
import { usePlan } from '../hooks/usePlan';
import { PlanGate } from '../components/PlanGate';

const TRANSLATIONS = ['All', 'KJV', 'NIV', 'ESV', 'NASB', 'NLT'];
const BOOK_ALIASES = {
  gen: 'Genesis', genesis: 'Genesis',
  exod: 'Exodus', exodus: 'Exodus',
  lev: 'Leviticus', leviticus: 'Leviticus',
  num: 'Numbers', numbers: 'Numbers',
  deut: 'Deuteronomy', deuteronomy: 'Deuteronomy',
  josh: 'Joshua', joshua: 'Joshua',
  judges: 'Judges',
  ruth: 'Ruth',
  '1 sam': '1 Samuel', '1sam': '1 Samuel', 'i samuel': '1 Samuel', '1 samuel': '1 Samuel',
  '2 sam': '2 Samuel', '2sam': '2 Samuel', 'ii samuel': '2 Samuel', '2 samuel': '2 Samuel',
  '1 kings': '1 Kings', '1kings': '1 Kings', 'i kings': '1 Kings',
  '2 kings': '2 Kings', '2kings': '2 Kings', 'ii kings': '2 Kings',
  '1 chr': '1 Chronicles', '1chronicles': '1 Chronicles', '1 chronicles': '1 Chronicles',
  '2 chr': '2 Chronicles', '2chronicles': '2 Chronicles', '2 chronicles': '2 Chronicles',
  ezra: 'Ezra', nehemiah: 'Nehemiah', esther: 'Esther',
  job: 'Job', psalm: 'Psalms', psalms: 'Psalms', ps: 'Psalms', proverbs: 'Proverbs', prov: 'Proverbs',
  ecclesiastes: 'Ecclesiastes', song: 'Song of Solomon', songs: 'Song of Solomon', sos: 'Song of Solomon',
  isa: 'Isaiah', isaiah: 'Isaiah', jer: 'Jeremiah', jeremiah: 'Jeremiah', lam: 'Lamentations',
  ezek: 'Ezekiel', ezekiel: 'Ezekiel', dan: 'Daniel', daniel: 'Daniel',
  hosea: 'Hosea', joel: 'Joel', amos: 'Amos', obadiah: 'Obadiah', jonah: 'Jonah', micah: 'Micah',
  nahum: 'Nahum', habakkuk: 'Habakkuk', zephaniah: 'Zephaniah', haggai: 'Haggai', zechariah: 'Zechariah', malachi: 'Malachi',
  matt: 'Matthew', mt: 'Matthew', matthew: 'Matthew',
  mark: 'Mark', mrk: 'Mark',
  luke: 'Luke', lk: 'Luke',
  john: 'John', jn: 'John',
  acts: 'Acts',
  rom: 'Romans', romans: 'Romans',
  '1 cor': '1 Corinthians', '1cor': '1 Corinthians', '1 corinthians': '1 Corinthians',
  '2 cor': '2 Corinthians', '2cor': '2 Corinthians', '2 corinthians': '2 Corinthians',
  gal: 'Galatians', galatians: 'Galatians',
  eph: 'Ephesians', ephesians: 'Ephesians',
  phil: 'Philippians', philippians: 'Philippians',
  col: 'Colossians', colossians: 'Colossians',
  '1 thess': '1 Thessalonians', '1thess': '1 Thessalonians', '1 thessalonians': '1 Thessalonians',
  '2 thess': '2 Thessalonians', '2thess': '2 Thessalonians', '2 thessalonians': '2 Thessalonians',
  '1 tim': '1 Timothy', '1tim': '1 Timothy', '1 timothy': '1 Timothy',
  '2 tim': '2 Timothy', '2tim': '2 Timothy', '2 timothy': '2 Timothy',
  titus: 'Titus', philem: 'Philemon', philemon: 'Philemon',
  heb: 'Hebrews', hebrews: 'Hebrews',
  james: 'James',
  '1 pet': '1 Peter', '1pet': '1 Peter', '1 peter': '1 Peter',
  '2 pet': '2 Peter', '2pet': '2 Peter', '2 peter': '2 Peter',
  '1 john': '1 John', '1john': '1 John',
  '2 john': '2 John', '2john': '2 John',
  '3 john': '3 John', '3john': '3 John',
  jude: 'Jude',
  rev: 'Revelation', revelation: 'Revelation',
};

function normalizeBookName(book) {
  const normalized = book
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return BOOK_ALIASES[normalized] || null;
}

function parseReference(input) {
  const match = input
    .trim()
    .match(/^([1-3]?\s*[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);

  if (!match) return null;

  const book = normalizeBookName(match[1]);
  if (!book) return null;

  return {
    book,
    chapter: Number(match[2]),
    verseStart: match[3] ? Number(match[3]) : null,
    verseEnd: match[4] ? Number(match[4]) : null,
  };
}

function normalizeText(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();
}

function toTrigrams(value) {
  const text = `  ${normalizeText(value)}  `;
  if (text.length < 3) return new Set();
  const grams = new Set();
  for (let i = 0; i < text.length - 2; i += 1) {
    grams.add(text.slice(i, i + 3));
  }
  return grams;
}

function diceSimilarity(a, b) {
  const aSet = toTrigrams(a);
  const bSet = toTrigrams(b);
  if (aSet.size === 0 || bSet.size === 0) return 0;

  let intersection = 0;
  for (const gram of aSet) {
    if (bSet.has(gram)) intersection += 1;
  }

  return (2 * intersection) / (aSet.size + bSet.size);
}

function extractBestPhrase(text, queryText) {
  const words = (text || '').split(/\s+/).filter(Boolean);
  if (!words.length) return '';

  const queryWordCount = Math.max(queryText.split(/\s+/).filter(Boolean).length, 1);
  const windowSize = Math.min(Math.max(queryWordCount + 4, 4), 18);
  let best = text;
  let bestScore = diceSimilarity(queryText, text);

  for (let i = 0; i <= Math.max(0, words.length - windowSize); i += 1) {
    const candidate = words.slice(i, i + windowSize).join(' ');
    const score = diceSimilarity(queryText, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  const trimmed = best.trim();
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
}

function scoreRow(row, queryText, terms) {
  const verseText = normalizeText(row.text);
  if (!verseText) return 0;

  let score = 0;
  const phraseSimilarity = diceSimilarity(queryText, verseText);

  if (verseText.includes(queryText)) score += 120;
  if (verseText.startsWith(queryText)) score += 25;

  let matchedTerms = 0;
  for (const term of terms) {
    if (term && verseText.includes(term)) matchedTerms += 1;
  }
  score += matchedTerms * 12;

  // Prefer rows matching all terms, then partials.
  if (matchedTerms === terms.length && terms.length > 1) score += 30;

  // Phrase-level fuzzy matching boost.
  score += Math.round(phraseSimilarity * 100);

  // Small bump for shorter concise matches.
  score += Math.max(0, 20 - Math.floor(verseText.length / 40));

  return { score, phraseSimilarity };
}

export default function VerseSearch() {
  const { profile } = useAuth();
  const { plan, quota, checkAndIncrementQuota } = usePlan(profile);
  const [query, setQuery] = useState('');
  const [translation, setTrans] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gate, setGate] = useState(null);

  function applyTranslationFilter(q) {
    return translation === 'All' ? q : q.eq('translation', translation);
  }

  function dedupe(rows) {
    const seen = new Set();
    return (rows || []).filter((row) => {
      const key = `${row.book}|${row.chapter}|${row.verse}|${row.translation}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setError('');
    setGate(null);

    const quotaResult = await checkAndIncrementQuota();
    if (!quotaResult.allowed) {
      setGate('dailyLimit');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const trimmed = query.trim();
      const reference = parseReference(trimmed);

      if (reference) {
        let refQuery = applyTranslationFilter(
          supabase
            .from('verses')
            .select('*')
            .eq('book', reference.book)
            .eq('chapter', reference.chapter),
        );

        if (reference.verseStart !== null) {
          refQuery = refQuery.gte('verse', reference.verseStart);
          if (reference.verseEnd !== null) refQuery = refQuery.lte('verse', reference.verseEnd);
          else refQuery = refQuery.lte('verse', reference.verseStart);
        }

        const { data: referenceRows, error: referenceError } = await refQuery
          .order('verse', { ascending: true })
          .limit(40);

        if (referenceError) throw new Error(referenceError.message);
        setResults(referenceRows || []);
        return;
      }

      // 1) Exact phrase first
      const { data: phraseRows, error: phraseError } = await applyTranslationFilter(
        supabase
          .from('verses')
          .select('*')
          .ilike('text', `%${trimmed}%`)
          .limit(20),
      );
      if (phraseError) throw new Error(phraseError.message);

      // 2) Full text relevance fallback
      const safeTerms = trimmed
        .split(/\s+/)
        .map((term) => term.replace(/[^a-zA-Z0-9']/g, ''))
        .filter(Boolean)
        .join(' ');

      let fullTextRows = [];
      if (safeTerms) {
        const { data: ftsRows, error: ftsError } = await applyTranslationFilter(
          supabase
            .from('verses')
            .select('*')
            .textSearch('text', safeTerms, { config: 'english', type: 'plain' })
            .limit(30),
        );
        if (ftsError) throw new Error(ftsError.message);
        fullTextRows = ftsRows || [];
      }

      // 3) Semantic fallback when available
      let semanticRows = [];
      if ((phraseRows?.length || 0) < 5 && (trimmed.split(/\s+/).length >= 3)) {
        try {
          semanticRows = await searchVerseEmbeddings(trimmed, 12);
          if (translation !== 'All') {
            semanticRows = semanticRows.filter((v) => v.translation === translation);
          }
        } catch {
          semanticRows = [];
        }
      }

      const merged = dedupe([...(phraseRows || []), ...fullTextRows, ...semanticRows]);

      const normalizedQuery = normalizeText(trimmed);
      const terms = normalizedQuery.split(' ').filter(Boolean);

      const ranked = merged
        .map((row) => {
          const rankedScore = scoreRow(row, normalizedQuery, terms);
          return {
            row: {
              ...row,
              _matchPreview: extractBestPhrase(row.text, trimmed),
              _phraseSimilarity: rankedScore.phraseSimilarity,
            },
            score: rankedScore.score,
          };
        })
        .filter((entry) => entry.row._phraseSimilarity > 0.15)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.row)
        .slice(0, 30);

      setResults(ranked);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Search failed.';
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-parchment-50 dark:bg-ink-900">
      <Sidebar profile={profile} conversations={[]} activeId={null} onNew={() => {}} onSelect={() => {}} onDelete={() => {}} />
      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
        <h1 className="font-display text-3xl font-bold text-ink-800 dark:text-parchment-100 mb-2">Verse Search</h1>
        <p className="font-serif italic text-ink-800/60 dark:text-parchment-300/60 mb-6 text-sm">Search across the entire Bible by keyword or phrase</p>

        <div className="flex gap-2 mb-4 flex-wrap">
          {TRANSLATIONS.map(t => (
            <button key={t} onClick={() => setTrans(t)} className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-colors ${translation === t ? 'bg-mahogany-700 text-parchment-100' : 'bg-white dark:bg-ink-800 border border-parchment-200 dark:border-ink-700 text-ink-800/70 dark:text-parchment-300/70 hover:border-gold-300'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-8">
          <input className="input-field flex-1" placeholder="e.g. 'peace that surpasses understanding' or 'do not be afraid'" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <button onClick={handleSearch} className="btn-primary px-5 flex items-center gap-2"><Search size={16}/>Search</button>
        </div>
        <p className="text-center text-xs font-sans text-ink-800/30 dark:text-parchment-300/30 -mt-4 mb-4">
          {plan === 'free'
            ? `${quota.remaining} free searches remaining today`
            : 'Unlimited searches'}
        </p>

        {loading && <p className="text-center font-serif italic text-ink-800/50 dark:text-parchment-300/50 py-8">Searching the scriptures...</p>}
        {error && <p className="text-center text-sm font-sans text-red-600 dark:text-red-400 py-2">{error}</p>}
        {results.map(v => (
          <div key={v.id ?? `${v.book}-${v.chapter}-${v.verse}-${v.translation}`}>
            <VerseCard {...v} />
            {v._matchPreview && (
              <div className="ml-4 mt-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/15 border-l-2 border-blue-300 dark:border-blue-700/40 text-xs font-serif text-ink-800/75 dark:text-parchment-200/75 rounded-r">
                Similar phrase: "{v._matchPreview}"
              </div>
            )}
          </div>
        ))}
        {results.length === 0 && !loading && query && (
          <p className="text-center font-serif italic text-ink-800/50 dark:text-parchment-300/50 py-8">No verses found. Try different keywords.</p>
        )}
      </main>
      {gate && <PlanGate feature={gate} onClose={() => setGate(null)} />}
    </div>
  );
}
