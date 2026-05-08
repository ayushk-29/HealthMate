import { Link, useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Activity, LogOut, MessageSquare, History as HistoryIcon, User, PlusCircle, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  session: Session | null;
}

export default function Navbar({ session }: NavbarProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-emerald-500 p-1.5 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">HealthMate</span>
            </Link>
            
            {session && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4 items-center">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  to="/history"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors gap-2"
                >
                  <HistoryIcon className="h-4 w-4" />
                  History
                </Link>
                <Link
                  to="/chat"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Wellness AI
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/check"
                  className="hidden md:flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  New Check
                </Link>
                <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                <Link
                  to="/profile"
                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
                  title="Profile"
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
