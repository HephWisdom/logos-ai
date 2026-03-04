import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [params]                  = useSearchParams();
  const [mode, setMode]           = useState(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [fullName, setFullName]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate                  = useNavigate();

  useEffect(() => { if (user) navigate('/chat'); }, [user, navigate]);

  async function handleSubmit() {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        navigate('/chat');
      } else {
        const { error: signUpError } = await signUp(email, password, fullName);
        if (signUpError) throw signUpError;
        setSuccess('Check your email to confirm your account!');
      }
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-ink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-mahogany-900">Λ</span>
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold text-ink-800 dark:text-parchment-100">
            {mode === 'login' ? 'Welcome back' : 'Begin your study'}
          </h1>
          <p className="font-serif text-ink-800/60 dark:text-parchment-300/60 mt-1 text-sm">
            {mode === 'login' ? 'Sign in to Logos AI' : 'Create your free Logos AI account'}
          </p>
        </div>

        <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-sm border border-parchment-200 dark:border-ink-700 p-8">
          <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-3 border border-parchment-200 dark:border-ink-700 hover:bg-parchment-50 dark:hover:bg-ink-700 rounded-xl py-2.5 font-sans text-sm text-ink-800 dark:text-parchment-100 transition-colors mb-5">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full gold-rule" /></div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-ink-800 px-3 text-xs font-sans text-ink-800/40 dark:text-parchment-300/40">
                or continue with email
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {mode === 'signup' && (
              <input className="input-field" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
            )}
            <input className="input-field" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
            <div className="relative">
              <input className="input-field pr-10" type={showPwd ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              <button onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-800/40 hover:text-ink-800/70">
                {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {error   && <p className="text-red-500 text-sm font-sans mt-3">{error}</p>}
          {success && <p className="text-green-600 text-sm font-sans mt-3">{success}</p>}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full mt-5 justify-center disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-sm font-sans text-ink-800/60 dark:text-parchment-300/60 mt-4">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')} className="text-mahogany-700 dark:text-gold-400 hover:underline font-medium">
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
