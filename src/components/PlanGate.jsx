import { X, Crown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PlanGate({ feature, onClose }) {
  const messages = {
    wordStudy:        { title: 'Greek & Hebrew Word Studies', desc: 'Unlock full Strong\'s concordance lookups, original language analysis, and semantic ranges.' },
    history:          { title: 'Conversation History',         desc: 'Save and revisit all your study sessions across devices.' },
    multiTranslation: { title: 'Multi-Translation Comparison', desc: 'Compare KJV, ESV, NIV, NASB and more side-by-side.' },
    dailyLimit:       { title: 'Daily Limit Reached',          desc: 'You\'ve used your 20 free questions for today. Upgrade for unlimited access.' },
  };

  const msg = messages[feature] || messages.dailyLimit;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative border border-parchment-200 dark:border-ink-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-800/40 hover:text-ink-800 dark:text-parchment-300/40 dark:hover:text-parchment-100">
          <X size={18}/>
        </button>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-5 shadow-lg">
          <Crown size={24} className="text-mahogany-900" />
        </div>

        <h2 className="font-display text-2xl font-bold text-ink-800 dark:text-parchment-100 mb-2">{msg.title}</h2>
        <p className="font-serif text-ink-800/70 dark:text-parchment-200/70 leading-relaxed mb-6">{msg.desc}</p>

        <div className="space-y-2 mb-6">
          {[
            { label: 'Disciple', price: '$9/mo', plan: 'pro', tag: 'Popular' },
            { label: 'Scholar',  price: '$19/mo', plan: 'scholar', tag: null },
          ].map(p => (
            <Link key={p.plan} to="/settings" className="flex items-center justify-between p-3 rounded-xl border border-parchment-200 dark:border-ink-700 hover:border-gold-400 dark:hover:border-gold-600/50 transition-all duration-150 group">
              <div className="flex items-center gap-3">
                <span className="font-sans font-semibold text-ink-800 dark:text-parchment-100">{p.label}</span>
                {p.tag && (
                  <span className="text-xs bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 px-2 py-0.5 rounded-full font-sans">
                    {p.tag}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-mahogany-700 dark:text-gold-400">{p.price}</span>
                <ArrowRight size={14} className="text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>

        <Link to="/settings" className="btn-gold w-full block text-center">View All Plans</Link>
      </div>
    </div>
  );
}
