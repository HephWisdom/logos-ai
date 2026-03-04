import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { BookMarked, Calendar } from 'lucide-react';

function widthClassFromPercent(percent) {
  const bucket = Math.max(0, Math.min(100, Math.round(percent / 5) * 5));
  const map = {
    0: 'w-0', 5: 'w-[5%]', 10: 'w-[10%]', 15: 'w-[15%]', 20: 'w-[20%]', 25: 'w-[25%]',
    30: 'w-[30%]', 35: 'w-[35%]', 40: 'w-[40%]', 45: 'w-[45%]', 50: 'w-[50%]', 55: 'w-[55%]',
    60: 'w-[60%]', 65: 'w-[65%]', 70: 'w-[70%]', 75: 'w-[75%]', 80: 'w-[80%]', 85: 'w-[85%]',
    90: 'w-[90%]', 95: 'w-[95%]', 100: 'w-full'
  };
  return map[bucket] || 'w-0';
}

export default function ReadingPlan() {
  const { user, profile } = useAuth();
  const [plans, setPlans] = useState([]);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    supabase.from('reading_plans').select('*').then(({ data }) => setPlans(data || []));
    if (user) {
      supabase.from('reading_progress').select('*, reading_plans(*)')
        .eq('user_id', user.id)
        .then(({ data }) => setProgress(data || []));
    }
  }, [user]);

  async function startPlan(planId) {
    if (!user) return;
    const { data } = await supabase.from('reading_progress').insert({
      user_id: user.id, plan_id: planId, current_day: 1
    }).select().single();
    if (data) setProgress(p => [...p, data]);
  }

  return (
    <div className="flex h-screen bg-parchment-50 dark:bg-ink-900">
      <Sidebar profile={profile} conversations={[]} activeId={null} onNew={() => {}} onSelect={() => {}} onDelete={() => {}} />
      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
        <h1 className="font-display text-3xl font-bold text-ink-800 dark:text-parchment-100 mb-2">Reading Plans</h1>
        <p className="font-serif italic text-ink-800/60 dark:text-parchment-300/60 mb-8 text-sm">Structured paths through Scripture</p>

        {progress.length > 0 && (
          <>
            <h2 className="font-display text-lg font-semibold text-ink-800 dark:text-parchment-100 mb-4">In Progress</h2>
            <div className="space-y-3 mb-8">
              {progress.map(p => {
                const pct = (p.current_day / (p.reading_plans?.duration_days || 1)) * 100;
                return (
                  <div key={p.id} className="p-5 bg-white dark:bg-ink-800/60 rounded-xl border border-gold-300 dark:border-gold-600/30 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-display font-semibold text-ink-800 dark:text-parchment-100">{p.reading_plans?.name || 'Reading Plan'}</span>
                      <span className="text-xs font-sans text-gold-600 dark:text-gold-400 flex items-center gap-1">
                        <Calendar size={12}/> Day {p.current_day} of {p.reading_plans?.duration_days}
                      </span>
                    </div>
                    <div className="w-full bg-parchment-200 dark:bg-ink-700 rounded-full h-1.5">
                      <div className={`bg-gradient-to-r from-gold-400 to-gold-500 h-1.5 rounded-full transition-all ${widthClassFromPercent(pct)}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <h2 className="font-display text-lg font-semibold text-ink-800 dark:text-parchment-100 mb-4">Available Plans</h2>
        {plans.length === 0 && (
          <div className="text-center py-12">
            <BookMarked size={40} className="text-parchment-300 dark:text-ink-700 mx-auto mb-4" />
            <p className="font-serif italic text-ink-800/40 dark:text-parchment-300/40">Reading plans will appear here once seeded in Supabase.</p>
          </div>
        )}
        <div className="grid gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="p-5 bg-white dark:bg-ink-800/60 rounded-xl border border-parchment-200 dark:border-ink-700 hover:border-gold-300 dark:hover:border-gold-600/40 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-ink-800 dark:text-parchment-100 mb-1">{plan.name}</h3>
                  <p className="font-serif text-sm text-ink-800/70 dark:text-parchment-300/70 mb-2">{plan.description}</p>
                  <span className="text-xs font-sans text-gold-600 dark:text-gold-400">{plan.duration_days} days</span>
                </div>
                <button onClick={() => startPlan(plan.id)} disabled={progress.some(p => p.plan_id === plan.id)} className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-4">
                  {progress.some(p => p.plan_id === plan.id) ? '✓ Started' : 'Begin Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
