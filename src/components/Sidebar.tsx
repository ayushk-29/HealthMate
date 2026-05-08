import { Link, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, History as HistoryIcon, 
  Dna, MessageSquare, User, Settings, LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  session: Session | null;
}

export default function Sidebar({ session }: SidebarProps) {
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: HistoryIcon },
    { name: 'Comparison', path: '/comparison', icon: Dna },
    { name: 'AI Wellness', path: '/chat', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  if (!session) {
    return (
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6">
          <Link to="/" className="block">
            <h1 className="text-xl font-bold tracking-tight text-teal-400">HealthMate</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-semibold">Wellness System</p>
          </Link>
        </div>
        <div className="mt-auto p-6 text-center text-xs text-slate-500 italic">
          Sign in to start tracking
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 shadow-2xl relative z-40">
      <div className="p-6">
        <Link to="/" className="block">
          <h1 className="text-xl font-bold tracking-tight text-teal-400">HealthMate</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-semibold">Wellness System</p>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                isActive 
                  ? 'bg-slate-800 text-teal-400' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-teal-400 scale-100' : 'bg-transparent scale-0'}`}></div>
                <item.icon className={`h-4 w-4 ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.name}
              </div>
              {isActive && <ChevronRight className="h-3 w-3" />}
            </Link>
          );
        })}
        
        <div className="pt-10">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group ${
              location.pathname === '/settings'
                ? 'bg-slate-800 text-teal-400'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className={`h-4 w-4 ${location.pathname === '/settings' ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            Settings
          </Link>
        </div>
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {session.user.user_metadata.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{session.user.user_metadata.full_name || 'User'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pro Member</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
