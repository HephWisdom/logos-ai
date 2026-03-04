import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(authUser) {
    const { data: existing, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (selectError) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!existing) {
      const fallbackName =
        authUser.user_metadata?.full_name ??
        authUser.user_metadata?.name ??
        '';

      const { error: insertError } = await supabase.from('profiles').insert({
        id: authUser.id,
        email: authUser.email,
        full_name: fallbackName,
        plan: 'free',
      });

      if (insertError) {
        setProfile(null);
        setLoading(false);
        return;
      }
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    setProfile(profileData ?? null);
    setLoading(false);
  }

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, email, full_name: fullName, plan: 'free'
      });
    }
    return { data, error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/chat` }
    });
  }

  return { user, profile, loading, signIn, signUp, signOut, signInWithGoogle };
}
