import { useState } from 'react';
import { Search } from 'lucide-react';
import { supabase }      from '../services/supabase';
import { StrongsCard }   from '../components/StrongsCard';
import { useAuth }       from '../hooks/useAuth';
import { usePlan }       from '../hooks/usePlan';
import { PlanGate }      from '../components/PlanGate';
import { Sidebar }       from '../components/Sidebar';

const POPULAR_WORDS = [
  { word: 'agape', lang: 'Greek', number: 'G26', meaning: 'Unconditional love' },
  { word: 'logos', lang: 'Greek', number: 'G3056', meaning: 'Word / Reason' },
  { word: 'charis', lang: 'Greek', number: 'G5485', meaning: 'Grace / Favor' },
  { word: 'pistis', lang: 'Greek', number: 'G4102', meaning: 'Faith / Trust' },
  { word: 'shalom', lang: 'Hebrew', number: 'H7965', meaning: 'Peace / Wholeness' },
  { word: 'hesed', lang: 'Hebrew', number: 'H2617', meaning: 'Steadfast love / Mercy' },
  { word: 'ruach', lang: 'Hebrew', number: 'H7307', meaning: 'Spirit / Breath / Wind' },
  { word: 'emet', lang: 'Hebrew', number: 'H0571', meaning: 'Truth / Faithfulness' },
];

export default function WordStudy() {
  const { profile }    = useAuth();
  const { canAccess }  = usePlan(profile);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!canAccess('wordStudy')) {
    return (
      <div className="flex h-screen">
        <Sidebar profile={profile} conversations={[]} activeId={null} onNew={() => {}} onSelect={() => {}} onDelete={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <PlanGate feature="wordStudy" onClose={() => window.history.back()} />
        </div>
      </div>
    );
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from('strongs')
      .select('*')
      .or(`transliteration.ilike.%${query}%,strongs_number.ilike.%${query}%,original_word.ilike.%${query}%`)
      .limit(10);
    setResults(data || []);
    setLoading(false);
  }

  return (
    <div className="flex h-screen bg-parchment-50 dark:bg-ink-900">
      <Sidebar profile={profile} conversations={[]} activeId={null} onNew={() => {}} onSelect={() => {}} onDelete={() => {}} />
      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
        <h1 className="font-display text-3xl font-bold text-ink-800 dark:text-parchment-100 mb-2">Greek & Hebrew Word Study</h1>
        <p className="font-serif italic text-ink-800/60 dark:text-parchment-300/60 mb-8 text-sm">
          Search by English word, transliteration, or Strong's number (e.g. G26, agape, shalom)
        </p>

        <div className="flex gap-2 mb-8">
          <input className="input-field flex-1" placeholder="Search: agape, logos, shalom, G26, H7965..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <button onClick={handleSearch} className="btn-primary px-5 flex items-center gap-2"><Search size={16}/>Search</button>
        </div>

        {loading && <div className="text-center font-serif italic text-ink-800/50 dark:text-parchment-300/50 py-8">Searching the lexicon...</div>}
        {results.map(r => <StrongsCard key={r.id} data={r} />)}
        {results.length === 0 && !loading && query && (
          <p className="text-center font-serif italic text-ink-800/50 dark:text-parchment-300/50 py-8">No results found. Try a different spelling or Strong's number.</p>
        )}

        {results.length === 0 && !query && (
          <>
            <h2 className="font-display text-lg font-semibold text-ink-800 dark:text-parchment-100 mb-4">Popular Word Studies</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {POPULAR_WORDS.map(w => (
                <button key={w.word} onClick={() => { setQuery(w.word); }} className="p-4 bg-white dark:bg-ink-800/60 border border-parchment-200 dark:border-ink-700 rounded-xl hover:border-gold-300 dark:hover:border-gold-600/40 transition-all text-left group">
                  <p className="font-mono text-xs text-blue-600 dark:text-blue-400 mb-1">{w.number}</p>
                  <p className="font-serif font-semibold text-ink-800 dark:text-parchment-100 capitalize">{w.word}</p>
                  <p className="font-serif text-xs text-ink-800/50 dark:text-parchment-300/50 mt-0.5">{w.meaning}</p>
                  <p className="text-xs font-sans text-gold-600 dark:text-gold-400 mt-1">{w.lang}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
