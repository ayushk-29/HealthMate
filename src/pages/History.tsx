import { Session } from '@supabase/supabase-js';
import { useHealthData } from '../hooks/useHealthData';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { 
  History as HistoryIcon, Scale, Heart, Activity, 
  Trash2, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HistoryProps {
  session: Session;
}

export default function History({ session }: HistoryProps) {
  const { history, loading, refetch } = useHealthData(session.user.id);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900 tracking-tight italic">Health Timeline / Detailed Logs</h1>
        <div className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-bold uppercase tracking-widest leading-none italic">
          Archive
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-slate-500 uppercase font-bold tracking-wider">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-center">Weight</th>
              <th className="px-4 py-3 text-center">BMI</th>
              <th className="px-4 py-3 text-center">BMR</th>
              <th className="px-4 py-3 text-center">Calories</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {history.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">No historical data available.</td>
              </tr>
            ) : (
              history.map((record, i) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 text-slate-500 font-bold uppercase">
                    {format(new Date(record.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-900 font-black">
                    {record.weight_kg} <span className="text-[9px] text-slate-400 font-bold uppercase">kg</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-slate-700 font-bold">{record.bmi}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 font-medium">
                    {record.bmr}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 font-medium">
                    {record.calorie_needs}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      record.bmi_category === 'Normal' ? 'bg-teal-50 text-teal-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {record.bmi_category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(record.id!)}
                      className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricPill({ icon: Icon, label, value, sub, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${colors[color]} whitespace-nowrap`}>
      <Icon className="h-4 w-4" />
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-tight opacity-70 mb-[-2px]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{value}</span>
          {sub && <span className="text-[10px] font-medium opacity-80">({sub})</span>}
        </div>
      </div>
    </div>
  );
}
