import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Landing     from './pages/Landing';
import Auth        from './pages/Auth';
import Chat        from './pages/Chat';
import WordStudy   from './pages/WordStudy';
import VerseSearch from './pages/VerseSearch';
import ReadingPlan from './pages/ReadingPlan';
import Notes       from './pages/Notes';
import Settings    from './pages/Settings';
import { ThemeProvider } from './context/ThemeContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user)   return <Navigate to="/auth" replace />;
  return children;
}

function FullPageLoader() {
  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-ink-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
        <p className="font-serif text-ink-800/60 dark:text-parchment-300/60 italic">Opening the scroll...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/auth"      element={<Auth />} />
        <Route path="/chat"      element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/word-study" element={<ProtectedRoute><WordStudy /></ProtectedRoute>} />
        <Route path="/search"    element={<ProtectedRoute><VerseSearch /></ProtectedRoute>} />
        <Route path="/reading"   element={<ProtectedRoute><ReadingPlan /></ProtectedRoute>} />
        <Route path="/notes"     element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
