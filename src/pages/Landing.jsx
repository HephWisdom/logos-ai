import { Link } from 'react-router-dom';
import { BookOpen, Search, Globe, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { PRICING } from '../hooks/usePlan';

const FEATURES = [
  { icon: BookOpen, title: 'Greek & Hebrew Word Studies', desc: 'Full Strong\'s concordance with original language characters, semantic ranges, and usage across all 66 books.' },
  { icon: Search,   title: 'Semantic Verse Search',        desc: 'Find any verse by concept, not just keywords. Powered by vector embeddings across the entire Bible.' },
  { icon: Globe,    title: 'Multi-Translation Analysis',   desc: 'Compare KJV, ESV, NIV, NASB, NLT, and the original Greek/Hebrew side by side.' },
  { icon: Star,     title: 'Theological Depth',            desc: 'Answers that present Reformed, Catholic, Orthodox, and charismatic views fairly — never just one denomination.' },
];

const SAMPLE_QUERIES = [
  '"What is the Greek word for love in 1 Corinthians 13?"',
  '"Explain the context of Isaiah 53 from both Jewish and Christian perspectives"',
  '"How does Romans 3:23 connect to the theme of glory in Paul\'s letters?"',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-ink-900 font-serif">
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-md">
            <span className="font-bold text-mahogany-900">Λ</span>
          </div>
          <span className="font-display text-xl font-bold text-ink-800 dark:text-parchment-100 tracking-wide">Logos AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="btn-ghost text-sm dark:text-parchment-200">Sign in</Link>
          <Link to="/auth?mode=signup" className="btn-primary text-sm">Start Free</Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-gold-100 dark:bg-gold-900/30 border border-gold-300 dark:border-gold-600/40 text-gold-700 dark:text-gold-300 px-4 py-1.5 rounded-full text-sm font-sans mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
          Your seminary-trained Bible scholar, available 24/7
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-bold text-ink-800 dark:text-parchment-100 leading-tight mb-6 tracking-tight">
          Study Scripture with the<br />
          <span className="text-mahogany-700 dark:text-gold-400">depth it deserves</span>
        </h1>

        <p className="font-serif text-xl text-ink-800/70 dark:text-parchment-200/70 leading-relaxed mb-10 max-w-2xl mx-auto">
          Logos AI brings Hebrew and Greek scholarship, theological tradition, and 2,000 years of
          Biblical commentary to every question you ask — instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link to="/auth?mode=signup" className="btn-gold text-base px-8 py-3 inline-flex items-center gap-2">
            Start Studying Free <ArrowRight size={16}/>
          </Link>
          <Link to="/auth" className="btn-ghost text-base px-8 py-3 border border-parchment-300 dark:border-ink-700 rounded-lg">
            Sign In
          </Link>
        </div>

        <div className="space-y-2 text-left max-w-2xl mx-auto">
          {SAMPLE_QUERIES.map((q, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-white dark:bg-ink-800/60 rounded-xl border border-parchment-200 dark:border-ink-800 shadow-sm animate-fade-in">
              <BookOpen size={16} className="text-gold-500 flex-shrink-0 mt-0.5" />
              <p className="font-serif italic text-ink-800/80 dark:text-parchment-200/80 text-sm">{q}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="gold-rule max-w-6xl mx-auto" />

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl font-bold text-center text-ink-800 dark:text-parchment-100 mb-3">
          Not a chatbot with Bible verses.
        </h2>
        <p className="font-serif text-center text-ink-800/60 dark:text-parchment-300/60 mb-12 text-lg">
          A precision research instrument for serious students of the Word.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 bg-white dark:bg-ink-800/60 rounded-xl border border-parchment-200 dark:border-ink-800 hover:border-gold-300 dark:hover:border-gold-600/40 transition-all duration-200 hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center mb-4">
                <Icon size={20} className="text-gold-600 dark:text-gold-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink-800 dark:text-parchment-100 mb-2">{title}</h3>
              <p className="font-serif text-ink-800/70 dark:text-parchment-300/70 leading-relaxed text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="font-display text-3xl font-bold text-center text-ink-800 dark:text-parchment-100 mb-12">
          Choose your depth of study
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING.map(tier => (
            <div key={tier.plan} className={`p-6 rounded-2xl border-2 transition-all duration-200 relative ${tier.popular ? 'border-gold-400 bg-gradient-to-b from-gold-50 to-white dark:from-gold-900/20 dark:to-ink-800 shadow-lg shadow-gold-200/50 dark:shadow-gold-900/20' : 'border-parchment-200 dark:border-ink-700 bg-white dark:bg-ink-800/60'}`}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-mahogany-900 text-xs font-sans font-bold px-3 py-1 rounded-full">Most Popular</div>
              )}
              <div className="text-2xl mb-2">{tier.icon}</div>
              <div className="font-display text-xl font-bold text-ink-800 dark:text-parchment-100 mb-1">{tier.label}</div>
              <div className="font-sans text-3xl font-bold text-mahogany-700 dark:text-gold-400 mb-4">
                {tier.price}<span className="text-sm font-normal text-ink-800/50 dark:text-parchment-300/50">/mo</span>
              </div>
              <ul className="space-y-2 mb-6">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm font-serif text-ink-800/80 dark:text-parchment-200/80">
                    <CheckCircle size={14} className="text-gold-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth?mode=signup" className={`block text-center rounded-lg py-2.5 font-sans font-medium text-sm transition-all ${tier.popular ? 'btn-gold' : 'btn-primary opacity-80 hover:opacity-100'}`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-parchment-200 dark:border-ink-800 py-8 text-center">
        <p className="font-serif italic text-ink-800/40 dark:text-parchment-300/40 text-sm">
          "In the beginning was the Word" — John 1:1
        </p>
        <p className="font-sans text-xs text-ink-800/30 dark:text-parchment-300/30 mt-2">© {new Date().getFullYear()} Logos AI</p>
      </footer>
    </div>
  );
}
