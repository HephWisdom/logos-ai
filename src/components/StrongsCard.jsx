import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export function StrongsCard({ data }) {
  const [expanded, setExpanded] = useState(false);
  if (!data) return null;

  const isGreek  = data.strongs_number?.startsWith('G');
  const langColor = isGreek
    ? 'from-blue-800 to-blue-900'
    : 'from-mahogany-700 to-mahogany-900';

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-parchment-200 dark:border-ink-800 animate-fade-in">
      <div className={`bg-gradient-to-r ${langColor} text-white px-5 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded">
            {data.strongs_number}
          </span>
          <span className="font-sans text-xl tracking-wide">
            {data.original_word}
          </span>
          <span className="text-sm opacity-80 italic">
            {data.transliteration}
          </span>
          <span className="text-xs opacity-60">
            {data.pronunciation}
          </span>
        </div>
        <span className="text-xs opacity-70 bg-white/10 px-2 py-0.5 rounded">
          {isGreek ? 'Koine Greek' : 'Biblical Hebrew'}
        </span>
      </div>

      <div className="bg-white dark:bg-ink-800 px-5 py-4">
        <p className="font-serif text-ink-800 dark:text-parchment-100 leading-relaxed">
          {data.definition}
        </p>

        {data.kjv_translations?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-xs font-sans text-ink-800/50 dark:text-parchment-300/50 mr-1">
              Translated as:
            </span>
            {data.kjv_translations.map(t => (
              <span key={t} className="text-xs bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-700/30 text-gold-800 dark:text-gold-300 px-2 py-0.5 rounded-full font-sans">
                {t}
              </span>
            ))}
          </div>
        )}

        {data.outline_of_biblical_usage && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs font-sans text-mahogany-700 dark:text-gold-400 hover:text-mahogany-800 dark:hover:text-gold-300 transition-colors"
            >
              {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              {expanded ? 'Hide' : 'Show'} full biblical usage outline
            </button>
            {expanded && (
              <div className="mt-2 pl-3 border-l-2 border-gold-300 dark:border-gold-600/40">
                <p className="text-sm font-serif text-ink-800/80 dark:text-parchment-200/80 whitespace-pre-line leading-relaxed">
                  {data.outline_of_biblical_usage}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
