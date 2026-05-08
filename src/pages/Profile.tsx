import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { User, Mail, Calendar, Activity, Save, Key } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileProps {
  session: Session;
}

export default function Profile({ session }: ProfileProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [fullName, setFullName] = useState(session.user.user_metadata.full_name || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('sedentary');

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setDob(data.date_of_birth || '');
        setGender(data.gender || 'male');
        setActivityLevel(data.activity_level || 'sedentary');
      }
    }
    fetchProfile();
  }, [session.user.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from('user_profiles')
      .upsert([{
        id: session.user.id,
        full_name: fullName,
        date_of_birth: dob,
        gender: gender,
        activity_level: activityLevel,
      }]);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Sync successful: Identity records updated.' });
      await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900 tracking-tight italic">Profile Control Panel / Node_{session.user.id.slice(0, 8)}</h1>
        <div className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded border border-teal-100 font-bold uppercase tracking-widest leading-none italic">
          Active Session
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpdateProfile} className="density-card space-y-6">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Core Identity</h2>

            {message && (
              <div className={`p-2 rounded text-[10px] font-bold border ${message.type === 'success' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="density-label mb-1 block">Account Email (Static)</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-400 font-mono text-[11px] overflow-hidden">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{session.user.email}</span>
                </div>
              </div>

              <div>
                <label className="density-label mb-1 block">System Display Name</label>
                <input
                  type="text"
                  value={fullName || ''}
                  onChange={(e) => setFullName(e.target.value)}
                  className="density-input"
                  placeholder="Full Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="density-label mb-1 block">Physiology Origin (DOB)</label>
                  <input
                    type="date"
                    value={dob || ''}
                    onChange={(e) => setDob(e.target.value)}
                    className="density-input"
                  />
                </div>
                <div>
                  <label className="density-label mb-1 block">Identity Baseline</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="density-input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="density-label mb-1 block">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="density-input"
                >
                  <option value="sedentary">Sedentary (Little or no exercise)</option>
                  <option value="light">Light (Exercise 1-3 days/week)</option>
                  <option value="moderate">Moderate (Exercise 3-5 days/week)</option>
                  <option value="active">Active (Exercise 6-7 days/week)</option>
                  <option value="very_active">Very Active (Intense exercise daily)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-lg w-full hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-3 w-3 text-teal-400" />
                  Commit Identity Updates
                </>
              )}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="density-card">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Instance Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2 uppercase italic">
                <span className="text-[9px] font-bold text-slate-400 tracking-widest">App Version</span>
                <span className="text-[11px] font-black text-slate-900">v1.4.2-STABLE</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2 uppercase italic">
                <span className="text-[9px] font-bold text-slate-400 tracking-widest">Last Sync</span>
                <span className="text-[11px] font-black text-slate-900">{format(new Date(), 'HH:MM:SS')}</span>
              </div>
              <div className="flex justify-between items-center uppercase italic">
                <span className="text-[9px] font-bold text-slate-400 tracking-widest">Cloud Relay</span>
                <span className="text-[11px] font-black text-teal-600">CONNECTED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
