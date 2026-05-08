import { Session } from '@supabase/supabase-js';
import { useHealthData } from '../hooks/useHealthData';
import { motion } from 'motion/react';
import { 
  ArrowRight, TrendingDown, TrendingUp, Minus, 
  Dna, Ruler, Weight, User, Activity, Heart 
} from 'lucide-react';
import { format } from 'date-fns';

interface ComparisonProps {
  session: Session;
}

export default function Comparison({ session }: ComparisonProps) {
  const { history, loading } = useHealthData(session.user.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (history.length < 2) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
        <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="h-8 w-8 text-slate-300" />
        </div>
        <h2 className="text-xl font-bold">Not enough data</h2>
        <p className="text-slate-500 text-sm mt-2">
          You need at least two health check records to compare your progress.
        </p>
      </div>
    );
  }

  const current = history[0];
  const previous = history[1];

  const diff = (key: keyof typeof current) => {
    const newVal = current[key] as number;
    const oldVal = previous[key] as number;
    return newVal - oldVal;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Progress Analysis</h1>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">
            Comparing {format(new Date(previous.created_at), 'MMM d')} vs {format(new Date(current.created_at), 'MMM d')}
          </p>
        </div>
        <div className="bg-teal-50 px-3 py-1 rounded border border-teal-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest leading-none">Automated Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComparisonCard
          label="Weight Delta"
          current={`${current.weight_kg} kg`}
          diff={diff('weight_kg')}
          unit="kg"
          higherIsBetter={false}
          icon={Weight}
        />
        <ComparisonCard
          label="BMI Shift"
          current={current.bmi.toString()}
          diff={diff('bmi')}
          unit="pts"
          higherIsBetter={false}
          icon={Activity}
        />
        <ComparisonCard
          label="Daily Burn"
          current={`${current.calorie_needs} kcal`}
          diff={diff('calorie_needs')}
          unit="kcal"
          higherIsBetter={true}
          icon={TrendingUp}
        />
        <ComparisonCard
          label="Metabolic BMR"
          current={`${current.bmr} kcal`}
          diff={diff('bmr')}
          unit="kcal"
          higherIsBetter={true}
          icon={Heart}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="density-card bg-slate-900 text-white border-slate-800">
          <h3 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Technical Summary</h3>
          <div className="space-y-6">
            <SummaryItem label="Height Consistency" value={`${current.height_cm} cm`} prev={`${previous.height_cm} cm`} />
            <SummaryItem label="Activity Profile" value={current.activity_level.replace('_', ' ')} prev={previous.activity_level.replace('_', ' ')} />
            <SummaryItem label="Goal Configuration" value={current.goal || 'Stable'} prev={previous.goal || 'Stable'} />
            <div className="pt-4 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                Your basal metabolic rate has shifted by {Math.abs(diff('bmr'))} kcal. This suggests a change in overall body composition or activity levels between sync points.
              </p>
            </div>
          </div>
        </div>

        <div className="density-card">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Physiological Markers</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Heart Rate Resting</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900">{current.heart_rate || '--'} <span className="text-[10px] font-bold text-slate-400">bpm</span></span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  current.heart_rate_status === 'Normal' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'
                }`}>{current.heart_rate_status || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Weight Velocity</span>
                <span className={diff('weight_kg') > 0 ? 'text-red-500' : 'text-teal-500'}>
                  {diff('weight_kg') > 0 ? '+' : ''}{diff('weight_kg').toFixed(1)} kg/session
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${diff('weight_kg') > 0 ? 'bg-red-500' : 'bg-teal-500'}`}
                  style={{ width: `${Math.min(Math.abs(diff('weight_kg')) * 20, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({ label, current, diff, unit, higherIsBetter, icon: Icon }: any) {
  const isNeutral = diff === 0;
  const isPositive = diff > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="density-card group hover:border-teal-200"
    >
      <div className="flex justify-between items-start mb-4">
        <Icon className="h-4 w-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
        <span className={`text-[10px] font-black tracking-widest uppercase flex items-center gap-1 ${
          isNeutral ? 'text-slate-400' : (isGood ? 'text-teal-600' : 'text-red-600')
        }`}>
          {!isNeutral && (isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
          {isNeutral ? 'Stable' : `${Math.abs(Number(diff.toFixed(2)))} ${unit}`}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</p>
        <p className="text-xl font-black text-slate-900 tracking-tight">{current}</p>
      </div>
    </motion.div>
  );
}

function SummaryItem({ label, value, prev }: { label: string, value: string, prev: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500 uppercase text-[9px] font-bold tracking-widest">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-slate-600 line-through opacity-50">{prev}</span>
        <ArrowRight className="h-3 w-3 text-teal-400" />
        <span className="font-bold text-white">{value}</span>
      </div>
    </div>
  );
}
