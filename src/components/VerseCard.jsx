export function VerseCard({ book, chapter, verse, text, translation, strongsNumbers = [], onSave }) {
  const translationColors = {
    KJV:  'bg-amber-100 text-amber-800',
    NIV:  'bg-blue-100 text-blue-800',
    ESV:  'bg-green-100 text-green-800',
    NASB: 'bg-purple-100 text-purple-800',
    NLT:  'bg-rose-100 text-rose-800',
  };

  return (
    <div className="group relative my-3 animate-fade-in">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-gold-300 via-gold-500 to-gold-300" />

      <div className="ml-4 bg-white dark:bg-ink-800/80 border border-parchment-200 dark:border-ink-800 rounded-r-lg px-5 py-4 shadow-sm hover:shadow-md transition-shadow duration-200 hover:border-gold-300 dark:hover:border-gold-600/40">
        <p className="verse-text text-base dark:text-parchment-100 leading-relaxed">
          "{text}"
        </p>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="font-display font-semibold text-mahogany-700 dark:text-gold-400 text-sm">
            {book} {chapter}:{verse}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-sans font-medium ${translationColors[translation] || 'bg-gray-100 text-gray-700'}`}>
            {translation}
          </span>
          {strongsNumbers.map(s => (
            <span key={s} className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700/40">
              {s}
            </span>
          ))}

          {onSave && (
            <button
              onClick={() => onSave({ book, chapter, verse, text, translation })}
              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gold-600 hover:text-gold-700 font-sans font-medium"
            >
              + Save note
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
