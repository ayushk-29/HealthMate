import { Link } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { motion } from 'motion/react';
import { Heart, Shield, Sparkles, TrendingUp, ArrowRight, Activity } from 'lucide-react';

interface HomeProps {
  session: Session | null;
}

export default function Home({ session }: HomeProps) {
  return (
    <div className="space-y-12 py-8 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 text-center space-y-8">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-teal-50 text-teal-700 text-[10px] font-black uppercase tracking-widest border border-teal-100 italic">
              <Sparkles className="h-3 w-3" />
              Advanced Wellness Engine 2.0
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 italic"
          >
            Precision <span className="text-teal-600 underline decoration-teal-100 underline-offset-8">Bio-Tracking</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-slate-500 max-w-lg mx-auto font-medium leading-relaxed"
          >
            A high-density performance tracking system for your physiological metrics. 
            Monitor BMI, TDEE, and BMR with integrated AI analysis.
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {session ? (
            <Link
              to="/dashboard"
              className="bg-slate-900 text-white px-8 py-3 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3"
            >
              Access Command Center
              <ArrowRight className="h-3 w-3 text-teal-400" />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="bg-teal-600 text-white px-8 py-3 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 flex items-center justify-center gap-3"
            >
              Initialize Profile Sync
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </motion.div>
      </section>

      {/* Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Heart, title: "Biometric Logs", desc: "Pulse, BMI, and Weight telemetry points sync." },
          { icon: TrendingUp, title: "Velocity Tracking", desc: "Comparative analysis of physical shifts over time." },
          { icon: Sparkles, title: "AI Consulting", desc: "Neural assistance for nutritional & safety guidance." }
        ].map((f, i) => (
          <motion.div
            key={i}
            className="density-card group hover:border-teal-200"
          >
            <div className="bg-slate-50 text-teal-600 w-10 h-10 rounded mb-4 flex items-center justify-center group-hover:bg-teal-50 transition-colors">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-tight mb-2 text-slate-800">{f.title}</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Footer Info */}
      <section className="density-card bg-slate-900 border-slate-800 p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 bg-teal-500/10 p-4 rounded-xl border border-teal-500/20">
            <Shield className="h-10 w-10 text-teal-400" />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-teal-400">System Disclaimer</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              HealthMate metrics are calculated using the Mifflin-St Jeor and WHO standards. 
              This is a digital tracking interface, not a medical device. Consult authorized 
              personnel for physiological diagnosis.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
