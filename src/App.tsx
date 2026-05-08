import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import HealthCheck from './pages/HealthCheck';
import History from './pages/History';
import Comparison from './pages/Comparison';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Auth from './pages/Auth';

// Components
import Sidebar from './components/Sidebar';

function AppContent({ session }: { session: Session | null }) {
  const location = useLocation();

  const getBreadcrumb = (path: string) => {
    switch (path) {
      case '/dashboard': return 'System / Overview / Health Snapshot';
      case '/check': return 'System / Entry / Metric Sync';
      case '/history': return 'System / Archive / Historical Logs';
      case '/comparison': return 'System / Analysis / Progress Delta';
      case '/chat': return 'System / AI Engine / Wellness Consulting';
      case '/profile': return 'System / Identity / User Biometrics';
      case '/settings': return 'System / Config / Core Protocols';
      default: return 'System / HealthMate / Interface';
    }
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] text-slate-900 font-sans overflow-hidden">
      <Sidebar session={session} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-4 text-xs">
            <h2 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-slate-400">System</span> / {getBreadcrumb(location.pathname).replace('System / ', '')}
            </h2>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-100 font-bold uppercase tracking-wide">
              {session ? 'Active Session' : 'Guest Mode'}
            </span>
          </div>
          {session && (
            <Link
              to="/check"
              className="bg-teal-600 text-white text-[10px] px-3 py-1.5 rounded-md font-bold uppercase tracking-widest shadow-sm hover:bg-teal-700 transition-colors"
            >
              + New Health Check
            </Link>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <Routes>
            <Route path="/" element={<Home session={session} />} />
            <Route 
              path="/auth" 
              element={!session ? <Auth /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/dashboard" 
              element={session ? <Dashboard session={session} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/check" 
              element={session ? <HealthCheck session={session} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/history" 
              element={session ? <History session={session} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/comparison" 
              element={session ? <Comparison session={session} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/chat" 
              element={session ? <Chat session={session} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/profile" 
              element={session ? <Profile session={session} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/settings" 
              element={session ? <Settings session={session} /> : <Navigate to="/auth" />} 
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial session fetch
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (err) {
        console.error('Core Session Error:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false); // Ensure loading is false on any auth event
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f1f5f9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <AppContent session={session} />
    </Router>
  );
}
