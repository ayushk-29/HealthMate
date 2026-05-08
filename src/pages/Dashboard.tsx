import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { useHealthData } from '../hooks/useHealthData';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  PlusCircle, Heart, ArrowUpRight, TrendingUp,
  Scale, Zap, Target, AlertCircle, Activity, Download
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { generateProtocol, calculateDailyCalories } from '../lib/wellness';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  session: Session;
}

export default function Dashboard({ session }: DashboardProps) {
  const { latestRecord, history, loading, error } = useHealthData(session.user.id);
  const [profileActivityLevel, setProfileActivityLevel] = useState<string>('sedentary');

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('user_profiles')
        .select('activity_level')
        .eq('id', session.user.id)
        .single();
      if (data?.activity_level) {
        setProfileActivityLevel(data.activity_level);
      }
    }
    fetchProfile();
  }, [session.user.id]);

  const adjustedCalorieNeeds = latestRecord
    ? calculateDailyCalories(latestRecord.bmr, profileActivityLevel)
    : null;

  const protocol = latestRecord && adjustedCalorieNeeds
    ? generateProtocol({ ...latestRecord, calorie_needs: adjustedCalorieNeeds, activity_level: profileActivityLevel })
    : null;

  const handleExportPDF = () => {
    if (!latestRecord) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('HealthMate - Wellness Report', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy')}`, 14, 30);
    
    // User Details
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('User Profile', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Detail', 'Value']],
      body: [
        ['Name', latestRecord.full_name || 'N/A'],
        ['Date of Birth', latestRecord.date_of_birth ? format(new Date(latestRecord.date_of_birth), 'MMM d, yyyy') : 'N/A'],
        ['Gender', latestRecord.gender ? latestRecord.gender.charAt(0).toUpperCase() + latestRecord.gender.slice(1) : 'N/A'],
        ['Height', `${latestRecord.height_cm} cm`]
      ],
    });

    const metricsStartY = (doc as any).lastAutoTable.finalY + 15;

    // Basic Stats
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Current Metrics', 14, metricsStartY);
    
    autoTable(doc, {
      startY: metricsStartY + 5,
      head: [['Metric', 'Value', 'Details']],
      body: [
        ['Weight', `${latestRecord.weight_kg} kg`, ''],
        ['BMI', latestRecord.bmi.toString(), latestRecord.bmi_category],
        ['BMR', `${latestRecord.bmr} kcal/day`, 'Mifflin-St Jeor'],
        ['Daily Calorie Needs', `${adjustedCalorieNeeds ?? latestRecord.calorie_needs} kcal`, `Based on ${profileActivityLevel.replace('_', ' ')} activity`],
        ['Ideal Weight Range', `${latestRecord.ideal_weight_min} - ${latestRecord.ideal_weight_max} kg`, 'BMI 18.5 - 24.9 Reference']
      ],
    });

    // Protocol
    if (protocol) {
      const finalY = (doc as any).lastAutoTable.finalY || 50;
      
      doc.setFontSize(16);
      doc.text('Target Protocol', 14, finalY + 15);
      
      doc.setFontSize(12);
      doc.text('Nutritional Strategy:', 14, finalY + 25);
      
      autoTable(doc, {
        startY: finalY + 30,
        head: [['Type', 'Target Calories', 'Protein (%)', 'Carbs (%)', 'Fats (%)']],
        body: [
          [protocol.diet.type, `${protocol.diet.targetCalories} kcal`, protocol.diet.macros.p, protocol.diet.macros.c, protocol.diet.macros.f]
        ],
      });

      const suggestionsFinalY = (doc as any).lastAutoTable.finalY || finalY + 30;
      doc.text('Dietary Suggestions:', 14, suggestionsFinalY + 15);
      
      const dietBody = protocol.diet.suggestions.map((s: string) => [s]);
      autoTable(doc, {
        startY: suggestionsFinalY + 20,
        head: [['Suggestion']],
        body: dietBody,
      });

      const workoutFinalY = (doc as any).lastAutoTable.finalY || suggestionsFinalY + 20;
      doc.setFontSize(14);
      doc.text('Kinetic Protocol (Workout):', 14, workoutFinalY + 15);
      doc.setFontSize(12);
      doc.text(`Frequency: ${protocol.workout.frequency} | Focus: ${protocol.workout.focus}`, 14, workoutFinalY + 25);

      const workoutBody = protocol.workout.sessions.map((s: string, idx: number) => [`Session ${idx + 1}`, s]);
      autoTable(doc, {
        startY: workoutFinalY + 30,
        head: [['Session', 'Details']],
        body: workoutBody,
      });
    }

    // History
    if (history && history.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('History Log', 14, 22);

      const historyBody = history.map((h: any) => [
        format(new Date(h.created_at), 'MMM d, yyyy'),
        `${h.weight_kg} kg`,
        h.bmi.toString(),
        h.bmi_category,
        h.heart_rate ? `${h.heart_rate} bpm` : '--'
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Date', 'Weight', 'BMI', 'Category', 'Heart Rate']],
        body: historyBody,
      });
    }

    doc.save('HealthMate_Report.pdf');
  };

  // Process data for the chart: chronological order, format dates
  const chartData = history
    .slice() // copy
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(record => ({
      date: format(parseISO(record.created_at), 'MMM d'),
      weight: record.weight_kg,
      bmi: record.bmi,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!latestRecord ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-6 shadow-sm"
        >
          <div className="bg-teal-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-teal-600" />
          </div>
          <h2 className="text-xl font-bold">No health records yet</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Take your first health check to see your metrics and personalized wellness tips.
          </p>
          <Link
            to="/check"
            className="inline-flex bg-teal-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-teal-700 transition-colors"
          >
            Start First Check
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold text-slate-800">Your Dashboard</h1>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm hover:shadow-md"
            >
              <Download className="w-4 h-4" />
              Export Report (PDF)
            </button>
          </div>

          {/* Metrics Header Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Current BMI"
              value={latestRecord.bmi.toString()}
              subValue={latestRecord.bmi_category}
              progress={(latestRecord.bmi / 40) * 100}
              delay={0.1}
            />

            <StatCard
              label="BMR (Mifflin-St Jeor)"
              value={latestRecord.bmr.toLocaleString()}
              unit="kcal/day"
              subValue="Basal Metabolic Rate"
              delay={0.2}
            />

            <StatCard
              label="Daily Calorie Needs"
              value={adjustedCalorieNeeds?.toLocaleString() ?? latestRecord?.calorie_needs.toLocaleString() ?? '0'}
              unit="kcal"
              subValue={`Based on ${profileActivityLevel.replace('_', ' ')}`}
              delay={0.3}
            />

            <StatCard
              label="Ideal Weight Range"
              value={`${latestRecord.ideal_weight_min} - ${latestRecord.ideal_weight_max}`}
              unit="kg"
              subValue="BMI 18.5 – 24.9 Reference"
              delay={0.4}
            />
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Main Content Area */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Weight Progress Chart Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Weight Progress</h3>
                  <div className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase tracking-widest">Trend</div>
                </div>

                <div className="h-64 w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                          dy={10}
                        />
                        <YAxis 
                          domain={['dataMin - 2', 'dataMax + 2']} 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                          itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#14b8a6" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#14b8a6', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, fill: '#0f766e', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase">
                      Insufficient Data for Chart
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Ideal Balance Points</p>
                    <div className="flex gap-4 text-xs font-black text-slate-700">
                      <span>{latestRecord.ideal_weight_min} kg</span>
                      <span>{latestRecord.ideal_weight_max} kg</span>
                    </div>
                  </div>
                  <div className="bg-teal-50 px-4 py-2 rounded-lg border border-teal-100 text-right">
                    <div className="text-teal-900 font-black text-xl">{latestRecord.weight_kg} kg</div>
                    <div className="text-teal-600 text-[10px] font-bold uppercase tracking-tighter">Current Weight</div>
                  </div>
                </div>
              </div>

              {/* History Snippet Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Recent Activity</h3>
                  <Link to="/history" className="text-teal-600 text-[10px] font-bold uppercase tracking-widest hover:underline">Full Log &rarr;</Link>
                </div>
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-slate-500 uppercase font-bold tracking-wider">
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Weight</th>
                      <th className="px-4 py-2">BMI</th>
                      <th className="px-4 py-2">Heart Rate</th>
                      <th className="px-4 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.slice(0, 5).map((record, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 text-slate-700 font-medium">
                          {format(new Date(record.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-2 font-bold text-slate-900">{record.weight_kg} kg</td>
                        <td className="px-4 py-2">
                          <span className={`${record.bmi_category === 'Normal' ? 'text-teal-600' : 'text-orange-600'
                            } font-bold`}>{record.bmi}</span>
                        </td>
                        <td className="px-4 py-2 text-slate-500">
                          {record.heart_rate ? `${record.heart_rate} bpm` : '--'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${record.bmi_category === 'Normal' ? 'bg-teal-400' : 'bg-orange-400'
                            }`}></span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Wellness Card */}
              <div className="bg-slate-900 text-white rounded-xl shadow-lg p-5 flex flex-col gap-4 group">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-teal-400">Wellness Goal</h3>
                  <Target className="h-4 w-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-black capitalize text-white">
                    {latestRecord.goal ? latestRecord.goal : 'Not Set'}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Personalized strategy active. Visit the Wellness AI for refined advice on reaching your targets.
                  </p>
                </div>
                <Link
                  to="/chat"
                  className="mt-2 bg-slate-800 hover:bg-slate-700 text-teal-400 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg text-center transition-all border border-slate-700"
                >
                  Consult AI Assistant
                </Link>
              </div>

              {/* Tips Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Health Insights</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1 flex-shrink-0"></div>
                    <p className="text-slate-600 leading-tight">Maintain a 500 kcal deficit for safe weight reduction.</p>
                  </li>
                  <li className="flex gap-3 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1 flex-shrink-0"></div>
                    <p className="text-slate-600 leading-tight">Increase protein intake to preserve muscle during BMR shifts.</p>
                  </li>
                  {latestRecord.heart_rate_status === 'High' && (
                    <li className="flex gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0"></div>
                      <p className="text-slate-600 leading-tight font-bold">Monitor heart rate; consult a physician if sustained above 100 BPM at rest.</p>
                    </li>
                  )}
                </ul>
              </div>

              {/* Protocol Section - Workout & Diet */}
              {protocol && (
                <div className="density-card space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Target Protocol</h3>
                    <Zap className="h-3 w-3 text-amber-400" />
                  </div>

                  <div className="space-y-6">
                    {/* Diet Plan */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-900 uppercase">Nutritional Strategy</span>
                        <span className="text-[11px] font-bold text-teal-600">{protocol.diet.targetCalories} kcal</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 leading-none truncate">{protocol.diet.type}</p>

                      <div className="flex gap-2">
                        <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-100 text-center">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Protein</p>
                          <p className="text-[10px] font-black text-slate-700">{protocol.diet.macros.p}%</p>
                        </div>
                        <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-100 text-center">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Carbs</p>
                          <p className="text-[10px] font-black text-slate-700">{protocol.diet.macros.c}%</p>
                        </div>
                        <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-100 text-center">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Fats</p>
                          <p className="text-[10px] font-black text-slate-700">{protocol.diet.macros.f}%</p>
                        </div>
                      </div>

                      <ul className="space-y-2">
                        {protocol.diet.suggestions.map((tip, idx) => (
                          <li key={idx} className="text-[10px] text-slate-500 flex gap-2 leading-tight italic">
                            <span className="text-teal-400 font-bold">•</span> {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Workout Plan */}
                    <div className="space-y-3 border-t border-slate-50 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-900 uppercase">Kinetic Protocol</span>
                        <span className="text-[11px] font-bold text-teal-600">{protocol.workout.frequency}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 leading-none truncate">{protocol.workout.focus}</p>

                      <div className="space-y-2">
                        {protocol.workout.sessions.map((session, idx) => (
                          <div key={idx} className="p-2 bg-teal-50/30 border border-teal-100/50 rounded flex items-center gap-3">
                            <div className="w-4 h-4 bg-teal-600 text-white rounded text-[8px] flex items-center justify-center font-bold flex-shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-[10px] font-bold text-slate-700">{session}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, unit, subValue, progress, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24 group hover:border-teal-200 transition-colors"
    >
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-slate-800 tracking-tight">{value}</span>
        {unit && <span className="text-[10px] font-semibold text-slate-400 uppercase">{unit}</span>}
        {!unit && subValue && (
          <span className={`text-[10px] font-semibold px-1 rounded ${subValue === 'Normal' ? 'text-teal-600 bg-teal-50' : 'text-orange-600 bg-orange-50'
            }`}>{subValue}</span>
        )}
      </div>
      {progress !== undefined ? (
        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
          <div
            className="bg-teal-500 h-full transition-all duration-1000"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 font-medium truncate">{subValue}</p>
      )}
    </motion.div>
  );
}
