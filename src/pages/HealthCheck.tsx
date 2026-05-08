import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { 
  PlusCircle, Ruler, Weight, User, Activity, Heart, Target, ArrowRight, Save
} from 'lucide-react';
import { 
  calculateBMI, 
  calculateBMR, 
  calculateDailyCalories, 
  calculateIdealWeightRange, 
  getHeartRateStatus, 
  getAge 
} from '../lib/wellness';

interface HealthCheckProps {
  session: Session;
}

export default function HealthCheck({ session }: HealthCheckProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(session.user.user_metadata.full_name || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [height, setHeight] = useState<number | string>('');
  const [weight, setWeight] = useState<number | string>('');
  const [activity, setActivity] = useState<string>('sedentary');
  const [heartRate, setHeartRate] = useState<number | undefined>(undefined);
  const [goal, setGoal] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (height < 50 || height > 250) {
      setError('Invalid height range (50-250cm)');
      setLoading(false);
      return;
    }
    if (weight < 20 || weight > 300) {
      setError('Invalid weight range (20-300kg)');
      setLoading(false);
      return;
    }

    const age = getAge(dob);
    const { bmi, category } = calculateBMI(Number(weight), Number(height));
    const bmr = calculateBMR(Number(weight), Number(height), age, gender);
    const calories = calculateDailyCalories(bmr, activity);
    const idealWeight = calculateIdealWeightRange(Number(height));
    const hrStatus = getHeartRateStatus(heartRate);

    try {
      const recordData = {
        user_id: session.user.id,
        full_name: fullName,
        date_of_birth: dob,
        gender: gender,
        height_cm: Number(height),
        weight_kg: Number(weight),
        activity_level: activity,
        heart_rate: heartRate,
        goal: goal,
        bmi: bmi,
        bmi_category: category,
        bmr: bmr,
        calorie_needs: calories,
        ideal_weight_min: idealWeight.min,
        ideal_weight_max: idealWeight.max,
        heart_rate_status: hrStatus,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from('health_records').insert([recordData]);
      if (insertError) throw insertError;

      const { error: profileError } = await supabase.from('user_profiles').upsert([{
        id: session.user.id,
        full_name: fullName,
        date_of_birth: dob,
        gender: gender,
      }]);
      if (profileError) throw profileError;
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'An unexpected error occurred during sync.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight italic">Biometric Entry / Physical Sync</h1>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Manual Update Protocol v1.4</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
        >
          Cancel Operation
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 flex gap-3 animate-shake text-xs font-bold items-center">
            <Activity className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Identity Block */}
          <div className="density-card space-y-4">
            <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <User className="h-3 w-3" /> Identity Configuration
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="density-label mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName || ''}
                  onChange={(e) => setFullName(e.target.value)}
                  className="density-input"
                  placeholder="System ID"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="density-label mb-1.5 block">Birth Date</label>
                  <input
                    type="date"
                    required
                    value={dob || ''}
                    onChange={(e) => setDob(e.target.value)}
                    className="density-input"
                  />
                </div>
                <div>
                  <label className="density-label mb-1.5 block">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="density-input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Physical Block */}
          <div className="density-card space-y-4">
            <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <Activity className="h-3 w-3" /> Core Biometrics
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="density-label mb-1.5 block">Height (cm)</label>
                  <input
                    type="number"
                    required
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    onFocus={(e) => height === 0 && setHeight('')}
                    className="density-input"
                    placeholder="Height"
                  />
                </div>
                <div>
                  <label className="density-label mb-1.5 block">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onFocus={(e) => weight === 0 && setWeight('')}
                    className="density-input"
                    placeholder="Weight"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Optional Block */}
          <div className="density-card space-y-4 md:col-span-2">
            <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <Heart className="h-3 w-3" /> Heart Rate Parameters
            </h2>

            <div>
              <label className="density-label mb-1.5 block">Resting Heart Rate (BPM)</label>
              <input
                type="number"
                value={heartRate || ''}
                onChange={(e) => setHeartRate(e.target.value ? Number(e.target.value) : undefined)}
                className="density-input"
                placeholder="Optional resting pulse"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-teal-600 text-white px-8 py-3 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-3 w-3" />
                Commit Metrics to Log
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
