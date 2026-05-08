import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Shield, Database, Bell, Moon, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface SettingsProps {
  session: Session;
}

export default function Settings({ session }: SettingsProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // States for toggles
  const [reminders, setReminders] = useState(true);
  const [alerts, setAlerts] = useState(false);

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email!);
    
    if (error) {
      if (error.message.includes('rate limit')) {
        setMessage({ 
          type: 'error', 
          text: 'Security system cooldown active. You can only request one reset per hour. Please wait before trying again.' 
        });
      } else {
        setMessage({ type: 'error', text: `Security System Error: ${error.message}` });
      }
    } else {
      setMessage({ type: 'success', text: 'Security override initiated: Recovery link dispatched to relay address.' });
    }
    setLoading(false);
  };

  const handleRemoveData = async () => {
    setLoading(true);
    setMessage(null);
    setShowConfirm(false);

    try {
      console.log('Initiating system data removal for user:', session.user.id);
      
      // Execute deletions and profile reset with individual error handling
      const healthProm = supabase.from('health_records').delete().eq('user_id', session.user.id);
      const chatProm = supabase.from('chat_messages').delete().eq('user_id', session.user.id);
      const profileProm = supabase.from('user_profiles').update({
        full_name: null,
        date_of_birth: null,
        gender: 'other'
      }).eq('id', session.user.id);

      const [healthResponse, chatResponse, profileResponse] = await Promise.all([
        healthProm,
        chatProm,
        profileProm
      ]);
      
      // Explicit error checking for each node
      const errors = [];
      
      // Check for real errors (excluding 404/not found errors for tables that aren't created yet)
      const isTableMissing = (err: any) => 
        err?.message?.includes('relation') && err?.message?.includes('does not exist');

      if (healthResponse.error && !isTableMissing(healthResponse.error)) {
        errors.push(`Biometrics Node Fail: ${healthResponse.error.message} (Code: ${healthResponse.error.code})`);
      }
      if (chatResponse.error && !isTableMissing(chatResponse.error)) {
        errors.push(`Chat Engine Fail: ${chatResponse.error.message} (Code: ${chatResponse.error.code})`);
      }
      if (profileResponse.error) {
        errors.push(`Identity Ref Fail: ${profileResponse.error.message} (Code: ${profileResponse.error.code})`);
      }

      if (errors.length > 0) {
        throw new Error(errors.join(' | '));
      }

      setMessage({ 
        type: 'success', 
        text: 'System Data Removal Complete: All biometric nodes, history, and identity baselines have been cleared.' 
      });
      
      // Clear session metadata/cache
      await supabase.auth.updateUser({ data: { full_name: '' } });
      
      // Force UI refresh after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
        // If not triggering a refresh, we can force a location sync
        window.scrollTo(0, 0);
      }, 2000);
      
    } catch (err: any) {
      console.error('Removal error details:', err);
      setMessage({ 
        type: 'error', 
        text: `Removal Failed: ${err.message}. If this is a permission error, please ensure you have applied the DELETE policies in Supabase.` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
      {/* Custom Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <Trash2 className="h-6 w-6" />
              <h3 className="font-black italic uppercase tracking-tight">Warning: Terminal Deletion</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              This operation will permanently purge all biometric logs, chat history, and identity preferences from the central database. <span className="text-red-600 font-bold underline">This action is irreversible.</span>
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="py-2.5 rounded border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                Abort
              </button>
              <button
                onClick={handleRemoveData}
                className="py-2.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900 tracking-tight italic">System Configuration / Global Settings</h1>
        <div className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-bold uppercase tracking-widest leading-none italic">
          v1.4.2-Config
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg border flex items-center gap-3 text-xs font-bold ${
          message.type === 'success' ? 'bg-teal-50 border-teal-100 text-teal-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="density-card space-y-6">
          <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
            <Shield className="h-3 w-3" /> Security Protocols
          </h2>
          
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-[11px] font-bold text-slate-700 mb-1">Authentication Credentials</p>
              <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                Current encryption layer active. Request a manual password refresh to update your entrance key.
              </p>
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full bg-white border border-slate-200 text-slate-900 font-bold text-[9px] uppercase tracking-widest py-2 rounded hover:border-teal-400 hover:text-teal-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Reset Account Password'}
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-[11px] font-bold text-red-900 mb-1">Terminal Deletion</p>
              <p className="text-[10px] text-red-700 leading-relaxed mb-3">
                Permanently remove all physical biometric records and identity nodes from the central database.
              </p>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="w-full bg-red-600 text-white font-bold text-[9px] uppercase tracking-widest py-2 rounded hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" /> Remove Instance Data
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="density-card space-y-6">
            <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <Database className="h-3 w-3" /> Data Management
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between italic">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Auto-Sync Status</span>
                <span className="text-[11px] font-black text-teal-600">ENABLED</span>
              </div>
              <div className="flex items-center justify-between italic">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Backup Frequency</span>
                <span className="text-[11px] font-black text-slate-900">REAL-TIME</span>
              </div>
              <div className="flex items-center justify-between italic">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Cloud Region</span>
                <span className="text-[11px] font-black text-slate-900">US-EAST-1</span>
              </div>
            </div>
          </div>

          <div className="density-card space-y-6">
            <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <Bell className="h-3 w-3" /> Notifications
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between italic">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Daily Health Reminder</span>
                <button 
                  onClick={() => setReminders(!reminders)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${reminders ? 'bg-teal-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${reminders ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between italic">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Abnormal Biometric Alerts</span>
                <button 
                  onClick={() => setAlerts(!alerts)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${alerts ? 'bg-teal-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${alerts ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
