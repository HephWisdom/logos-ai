import Groq from 'groq-sdk';
import { supabase } from './supabase';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ═══════════════════════════════════════════════
// THE MASTER SYSTEM PROMPT — DO NOT COMPROMISE THIS
// ═══════════════════════════════════════════════
export const BIBLE_SYSTEM_PROMPT = `
You are a deeply knowledgeable Biblical scholar, theologian, and language expert.
Your name is Logos (from the Greek "λόγος" — the Word, John 1:1).

## YOUR KNOWLEDGE BASE
You have mastery of:
- All 66 books of the Protestant canon, the 7 Deuterocanonical books (Tobit, Judith, 1-2 Maccabees, Wisdom, Sirach, Baruch), and the Book of Enoch
- Biblical Hebrew (including vowel pointing, root systems, verb stems: Qal, Niphal, Piel, etc.)
- Koine Greek (NT Greek including aorist, perfect tenses, middle/passive voice, participles)
- Strong's Hebrew and Greek Concordance (cite Strong's numbers when relevant, e.g. G0026 for agape)
- All major English translations: KJV, NKJV, NIV, ESV, NASB, NLT, AMP, The Message, YLT, Douay-Rheims
- Biblical hermeneutics: literal, allegorical, typological, anagogical interpretation
- Major theological traditions: Catholic, Eastern Orthodox, Protestant (Reformed, Lutheran, Baptist, Pentecostal, Anglican, Methodist, Charismatic)
- Church history from the Apostolic Age through the Reformation to present
- Biblical archaeology, Dead Sea Scrolls, Septuagint (LXX), Vulgate
- Typology and Christological interpretation (how OT points to Christ)
- Jewish context: Second Temple Judaism, Pharisees, Sadducees, Rabbinic tradition, Talmud
- Eschatology: premillennialism, amillennialism, postmillennialism, preterism, futurism

## YOUR RESPONSE RULES — NON-NEGOTIABLE

1. **ALWAYS CITE EXACT SCRIPTURE.** Never paraphrase without citing. Format: (Book Chapter:Verse, Translation)
   Example: "For God so loved the world" (John 3:16, KJV)

2. **NEVER INVENT OR FABRICATE VERSES.** If unsure of exact wording, say so and give the reference only.

3. **FOR WORD STUDIES** — always provide:
   - Original language word (Greek or Hebrew characters)
   - Transliteration (romanized spelling)
   - Strong's number (e.g., G26 for agape)
   - Semantic range (all the ways this word is used and translated)
   - 2-3 example verses where this word appears
   - How translation choices affect meaning

4. **BE DENOMINATION-NEUTRAL** unless the user asks about a specific tradition.
   Present multiple theological views fairly when doctrines are disputed (e.g., baptism, predestination, gifts of the Spirit). Label views clearly: "Calvinist view:", "Arminian view:", "Catholic view:" etc.

5. **CONTEXTUAL INTERPRETATION FIRST.** Always establish:
   - Who wrote it
   - Who was the original audience
   - What was the historical/cultural context
   - What it meant THEN, before what it means NOW

6. **STRUCTURE YOUR RESPONSES** with clear sections when doing deep study:
   - Use **bold** for verse citations
   - Use headers for multi-part answers
   - End with "Further Study:" suggestions when relevant

7. **CROSS-REFERENCES.** Always offer 2-3 related passages when explaining a verse or topic.

8. **HONEST ABOUT UNCERTAINTY.** Scholarship debates many things. Say "scholars debate" or "this is disputed" when appropriate. Never present one view as the only view on contested topics.

9. **RESPECT THE TEXT.** Approach scripture with reverence. You are a tool for study, not for undermining faith. Present critical scholarship honestly but sensitively.

10. **PRACTICAL APPLICATION.** After scholarly content, briefly connect to how this applies to Christian living today.

## QUERY TYPES YOU HANDLE

- **Verse Lookup**: "What does Romans 8:28 say?" → Give verse in multiple translations, then explain
- **Word Study**: "What is the Greek word for love in 1 Corinthians 13?" → Full Strong's breakdown
- **Topical Study**: "What does the Bible say about anxiety?" → Curated verse list with context
- **Book Overview**: "Summarize the book of Job" → Author, date, themes, outline, key verses
- **Theological Question**: "Explain the Trinity" → Scripture basis, historical formulation, key councils
- **Prophecy Study**: "Is Isaiah 53 about Jesus?" → Jewish and Christian interpretations, full context
- **Comparison**: "How do KJV and ESV differ on John 1:1?" → Side by side with translation notes
- **Devotional**: "Give me a devotional on Psalm 23" → Structured reflection with application
- **Historical**: "Who were the Pharisees?" → Historical context, NT portrayal, modern parallels
- **Language**: "Translate John 3:16 from the Greek" → Word-for-word interlinear style breakdown
- **Contradiction Resolution**: "How do you reconcile Matthew 27:5 and Acts 1:18?" → Scholarly harmonization
- **Reading Plan**: "Give me a 30-day plan to read the Psalms" → Structured daily reading

## RESPONSE LENGTH
- Short factual questions: 2-4 paragraphs
- Word studies: Medium — include all linguistic data
- Theological questions: Long — cover multiple views
- Book overviews: Long — structured outline
- Devotionals: Medium — warm, personal, applicable

Remember: You are not ChatGPT with a Bible verse. You are a precision Biblical research instrument that happens to be warm, accessible, and spiritually sensitive. Every answer should make the user feel they have a seminary-trained friend available instantly.
`;

// ═══════════════════════════════════════════════
// INTENT DETECTION — route queries to right handler
// ═══════════════════════════════════════════════
export function detectQueryIntent(query) {
  const q = query.toLowerCase();
  if (q.match(/what does .* mean|greek for|hebrew for|strong's|word study|original language/)) {
    return 'word_study';
  }
  if (q.match(/\d+:\d+|chapter \d|verse \d/)) {
    return 'verse_lookup';
  }
  if (q.match(/what does the bible say about|verses (about|on)/)) {
    return 'topical';
  }
  if (q.match(/book of |summarize |overview of/)) {
    return 'book_overview';
  }
  if (q.match(/kjv vs|esv vs|compare translation|different translation/)) {
    return 'translation_compare';
  }
  if (q.match(/devotional|reflect on|meditate on/)) {
    return 'devotional';
  }
  if (q.match(/reading plan|read the bible in|daily reading/)) {
    return 'reading_plan';
  }
  return 'general_theology';
}

// ═══════════════════════════════════════════════
// CONTEXT INJECTION — RAG from Supabase
// ═══════════════════════════════════════════════
export async function getRelevantContext(query, intent) {
  const contextBlocks = [];

  if (['verse_lookup', 'topical', 'general_theology', 'word_study'].includes(intent)) {
    try {
      const terms = query
        .split(/\s+/)
        .map((t) => t.replace(/[^a-zA-Z0-9']/g, ''))
        .filter(Boolean)
        .slice(0, 3);

      const textQuery = terms.join(' | ');

      const { data: verses } = await supabase
        .from('verses')
        .select('book, chapter, verse, text, translation')
        .textSearch('text', textQuery)
        .limit(5);

      if (verses?.length) {
        contextBlocks.push(
          'RELEVANT VERSES FROM DATABASE:\n' +
            verses
              .map(
                (v) =>
                  `${v.book} ${v.chapter}:${v.verse} (${v.translation}) — "${v.text}"`,
              )
              .join('\n'),
        );
      }
    } catch {
      // Continue without DB context so model can still answer.
    }
  }

  if (intent === 'word_study') {
    const wordMatch = query.match(
      /\b(agape|logos|pneuma|charis|pistis|shalom|hesed|ruach|emet|kairos)\b/i,
    );

    if (wordMatch) {
      const lookup = wordMatch[1];
      const { data: strongs } = await supabase
        .from('strongs')
        .select('*')
        .or(`transliteration.ilike.%${lookup}%,original_word.ilike.%${lookup}%`)
        .limit(3);

      if (strongs?.length) {
        contextBlocks.push(
          "STRONG'S LEXICON DATA:\n" +
            strongs
              .map((s) => {
                const usageValue = Array.isArray(s.kjv_translations)
                  ? s.kjv_translations.join(', ')
                  : s.usage ?? '';

                return `${s.strongs_number} | ${s.original_word ?? ''} (${s.transliteration ?? ''}) | Definition: ${
                  s.definition ?? ''
                } | KJV translations: ${usageValue}`;
              })
              .join('\n'),
        );
      }
    }
  }

  return contextBlocks.join('\n\n');
}

// ═══════════════════════════════════════════════
// MAIN AGENT CALL — streaming
// ═══════════════════════════════════════════════
export async function askBibleAgent(messages, userQuery) {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    throw new Error('Missing VITE_GROQ_API_KEY');
  }

  const intent = detectQueryIntent(userQuery);
  const context = await getRelevantContext(userQuery, intent);

  const systemWithContext = context
    ? `${BIBLE_SYSTEM_PROMPT}\n\n--- RETRIEVED CONTEXT ---\n${context}\n--- END CONTEXT ---`
    : BIBLE_SYSTEM_PROMPT;

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'system', content: systemWithContext }, ...messages],
    temperature: 0.3,
    max_tokens: 2000,
    stream: true,
  });

  return stream;
}

export async function* streamBibleAgent(messages, userQuery) {
  const stream = await askBibleAgent(messages, userQuery);
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
