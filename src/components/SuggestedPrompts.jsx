export const SUGGESTED_PROMPTS = [
  { label: "What is the Greek word for 'love' in 1 Cor 13?", emoji: '🔤', category: 'word' },
  { label: 'Break down John 3:16 word by word', emoji: '📖', category: 'verse' },
  { label: 'Explain the Trinity using only scripture', emoji: '✝️', category: 'theology' },
  { label: 'All Bible verses on anxiety and fear', emoji: '🙏', category: 'topical' },
  { label: "What does 'Shalom' really mean in Hebrew?", emoji: '🔤', category: 'word' },
  { label: 'Is Isaiah 53 about Jesus?', emoji: '📖', category: 'verse' },
  { label: 'What does the Bible say about predestination?', emoji: '✝️', category: 'theology' },
  { label: 'Compare KJV vs ESV on Psalm 23', emoji: '🔍', category: 'compare' },
  { label: 'Give me an overview of the book of Job', emoji: '📚', category: 'book' },
  { label: "What did Jesus mean by 'born again'?", emoji: '✝️', category: 'theology' },
  { label: 'Explain grace (charis) in Greek', emoji: '🔤', category: 'word' },
  { label: 'What is Revelation really about?', emoji: '📚', category: 'book' },
];

const CATEGORY_COLORS = {
  word:     'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40',
  verse:    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40',
  theology: 'bg-mahogany-50 dark:bg-mahogany-900/20 border-mahogany-200 dark:border-mahogany-700/30 text-mahogany-700 dark:text-red-300 hover:bg-mahogany-100 dark:hover:bg-mahogany-900/40',
  topical:  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40',
  compare:  'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40',
  book:     'bg-gold-50 dark:bg-gold-900/20 border-gold-200 dark:border-gold-700/30 text-gold-700 dark:text-gold-300 hover:bg-gold-100 dark:hover:bg-gold-900/40',
};

export function SuggestedPrompts({ onSelect, limit = 6 }) {
  const shown = SUGGESTED_PROMPTS.slice(0, limit);

  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
      {shown.map((p, i) => (
        <button
          key={i}
          onClick={() => onSelect(p.label)}
          className={`flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-full border transition-all duration-150 cursor-pointer ${CATEGORY_COLORS[p.category]}`}
        >
          <span>{p.emoji}</span>
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  );
}
