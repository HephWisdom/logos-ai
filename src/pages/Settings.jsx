import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePlan, PRICING } from '../hooks/usePlan';
import { createCheckoutSession, createPortalSession } from '../services/stripe';
import { Sidebar } from '../components/Sidebar';
import { CheckCircle } from 'lucide-react';

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const { plan } = usePlan(profile);
  const [billing, setBilling] = useState(false);
  const displayName =
    profile?.full_name?.trim() ||
    user?.email?.split('@')[0] ||
    'User';

  async function handleUpgrade(targetPlan) {
    setBilling(true);
    await createCheckoutSession(targetPlan, user.id, user.email);
    setBilling(false);
  }

  async function handlePortal() {
    if (profile?.stripe_customer_id) {
      await createPortalSession(profile.stripe_customer_id);
    }
  }

  return (
    <div className="flex h-screen bg-parchment-50 dark:bg-ink-900">
      <Sidebar profile={profile} conversations={[]} activeId={null} onNew={() => {}} onSelect={() => {}} onDelete={() => {}} />
      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="bg-white dark:bg-ink-800 rounded-2xl border border-parchment-200 dark:border-ink-700 p-6 mb-6">
          <h2 className="font-display text-xl font-bold text-ink-800 dark:text-parchment-100 mb-4">Account</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mahogany-700 to-mahogany-900 flex items-center justify-center text-gold-300 font-display text-xl font-bold">
              {displayName[0].toUpperCase()}
            </div>
            <div>
              <p className="font-sans font-semibold text-ink-800 dark:text-parchment-100">{displayName}</p>
              <p className="font-sans text-sm text-ink-800/60 dark:text-parchment-300/60">{user?.email}</p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wide ${plan === 'free' ? 'bg-parchment-200 text-ink-800' : plan === 'pro' ? 'bg-gold-100 text-gold-700' : 'bg-mahogany-100 text-mahogany-700'}`}>
                {plan}
              </span>
            </div>
          </div>
          <div className="gold-rule my-4" />
          <button onClick={signOut} className="text-sm font-sans text-red-500 hover:text-red-600">Sign out</button>
        </div>

        {plan !== 'free' && (
          <div className="bg-white dark:bg-ink-800 rounded-2xl border border-parchment-200 dark:border-ink-700 p-6 mb-6">
            <h2 className="font-display text-xl font-bold text-ink-800 dark:text-parchment-100 mb-4">Billing</h2>
            <button onClick={handlePortal} className="btn-ghost border border-parchment-200 dark:border-ink-700 text-sm">Manage Subscription →</button>
          </div>
        )}

        <h2 className="font-display text-xl font-bold text-ink-800 dark:text-parchment-100 mb-4">Plans</h2>
        <div className="grid gap-4">
          {PRICING.map(tier => (
            <div key={tier.plan} className={`p-5 rounded-xl border-2 transition-all ${plan === tier.plan ? 'border-gold-400 bg-gold-50/50 dark:bg-gold-900/10' : 'border-parchment-200 dark:border-ink-700 bg-white dark:bg-ink-800/60'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tier.icon}</span>
                  <span className="font-display font-bold text-ink-800 dark:text-parchment-100">{tier.label}</span>
                  {plan === tier.plan && (
                    <span className="text-xs font-sans bg-gold-200 text-gold-800 px-2 py-0.5 rounded-full">Current</span>
                  )}
                </div>
                <span className="font-sans font-bold text-mahogany-700 dark:text-gold-400 text-xl">
                  {tier.price}<span className="text-sm font-normal text-ink-800/40 dark:text-parchment-300/40">/mo</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-4">
                {tier.features.map(f => (
                  <div key={f} className="flex items-start gap-1.5 text-xs font-serif text-ink-800/70 dark:text-parchment-200/70">
                    <CheckCircle size={11} className="text-gold-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>
              {plan !== tier.plan && tier.plan !== 'free' && (
                <button onClick={() => handleUpgrade(tier.plan)} disabled={billing} className="btn-gold text-sm disabled:opacity-60">
                  {billing ? 'Redirecting...' : `Upgrade to ${tier.label}`}
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
