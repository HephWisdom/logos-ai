import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export const PLAN_LIMITS = {
  free:    { dailyQueries: 20,  history: false, wordStudy: false, multiTranslation: false },
  pro:     { dailyQueries: 999, history: true,  wordStudy: true,  multiTranslation: false },
  scholar: { dailyQueries: 999, history: true,  wordStudy: true,  multiTranslation: true  },
};

export const PRICING = [
  {
    plan: 'free', price: '$0', priceMonthly: 0,
    label: 'Seeker', icon: '🕊️',
    features: ['20 questions/day', 'Verse lookup & Q&A', 'Basic theology questions', 'Standard response speed'],
    cta: 'Start Free',
    popular: false
  },
  {
    plan: 'pro', price: '$9', priceMonthly: 9,
    label: 'Disciple', icon: '✝️',
    features: ['Unlimited questions', 'Full Greek & Hebrew word studies', 'Complete conversation history', 'Notes & verse highlights', 'All reading plans', 'Priority responses'],
    cta: 'Begin Studying',
    popular: true
  },
  {
    plan: 'scholar', price: '$19', priceMonthly: 19,
    label: 'Scholar', icon: '📜',
    features: ['Everything in Disciple', 'Multi-translation comparison', 'Export study notes (PDF)', 'API access', 'Advanced Hebrew/Greek parsing', 'Earliest access to new features'],
    cta: 'Go Deep',
    popular: false
  },
];

export function usePlan(profile) {
  const plan = profile?.plan || 'free';
  const limits = PLAN_LIMITS[plan];
  const today = new Date().toISOString().split('T')[0];
  const quotaStorageKey = `logos-quota:${profile?.id || 'anon'}:${today}`;
  const [quota, setQuota] = useState({
    dailyLimit: limits.dailyQueries,
    usedToday: 0,
    remaining: limits.dailyQueries,
  });

  function persistQuota(next) {
    setQuota(next);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      quotaStorageKey,
      JSON.stringify({
        usedToday: next.usedToday,
        dailyLimit: next.dailyLimit,
      }),
    );
  }

  useEffect(() => {
    const profileUsed =
      profile?.last_query_date === today
        ? (profile?.queries_used_today || 0)
        : 0;

    let cachedUsed = 0;
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(quotaStorageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        cachedUsed = Number(parsed?.usedToday || 0);
      } catch {
        cachedUsed = 0;
      }
    }

    const usedToday = Math.max(profileUsed, cachedUsed);
    const dailyLimit = limits.dailyQueries;
    const remaining = Math.max(dailyLimit - usedToday, 0);
    persistQuota({ dailyLimit, usedToday, remaining });
  }, [profile?.id, profile?.last_query_date, profile?.queries_used_today, limits.dailyQueries, quotaStorageKey, today]);

  async function checkAndIncrementQuota() {
    if (plan !== 'free') {
      return { allowed: true, ...quota };
    }

    const { data, error } = await supabase.functions.invoke('check-quota', {
      body: {},
    });

    if (!error && data?.allowed === true) {
      const dailyLimit = Number(data.daily_limit ?? limits.dailyQueries);
      const usedToday = Number(data.used_today ?? 0);
      const remaining = Number(data.remaining ?? Math.max(dailyLimit - usedToday, 0));
      const next = { dailyLimit, usedToday, remaining };
      persistQuota(next);
      return { allowed: true, ...next };
    }

    if (!error && data?.allowed === false) {
      const dailyLimit = Number(data.daily_limit ?? limits.dailyQueries);
      const usedToday = Number(data.used_today ?? dailyLimit);
      const remaining = Number(data.remaining ?? Math.max(dailyLimit - usedToday, 0));
      const next = { dailyLimit, usedToday, remaining };
      persistQuota(next);
      return { allowed: false, ...next };
    }

    // Fallback so users are not hard-blocked when the quota function
    // is not deployed or function secrets are misconfigured.
    const dailyLimit = limits.dailyQueries;
    const usedToday = quota.usedToday;

    if (usedToday < dailyLimit) {
      const next = {
        dailyLimit,
        usedToday: usedToday + 1,
        remaining: Math.max(dailyLimit - (usedToday + 1), 0),
      };
      persistQuota(next);
      return { allowed: true, ...next };
    }

    const blocked = { dailyLimit, usedToday, remaining: 0 };
    persistQuota(blocked);
    return { allowed: false, ...blocked };
  }

  function canAccess(feature) {
    return limits[feature] === true || limits[feature] > 0;
  }

  return { plan, limits, quota, checkAndIncrementQuota, canAccess };
}
