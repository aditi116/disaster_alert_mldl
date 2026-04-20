import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Crosshair, TrendingUp, ArrowRight, Play, Server, Zap, Award, Map } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const NoiseBackground = () => (
  <div 
    className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.025] dark:opacity-[0.04]"
    style={{ 
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
    }}
  />
);

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

export default function Home() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen relative font-[Inter] overflow-hidden bg-slate-50 dark:bg-[#090b10] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <NoiseBackground />

      {/* Decorative Gradients */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[600px] bg-amber-500/10 dark:bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
            <Zap className="w-5 h-5 text-white dark:text-slate-900" />
          </div>
          <span className="font-[Playfair_Display] font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Res<span className="text-amber-600 dark:text-amber-500">QNet</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={toggleTheme} className="text-sm font-medium hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <Link to="/login" className="text-sm font-medium hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white transition-all bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-white">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center max-w-7xl mx-auto px-6 pt-24 pb-32 text-center">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 text-amber-800 dark:text-amber-400 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
            <Server className="w-3.5 h-3.5" />
            <span>ML-Powered Crisis Infrastructure</span>
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-[Playfair_Display] font-bold leading-[1.1] tracking-tight mb-8 text-slate-900 dark:text-white">
            Intelligence in <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">Crisis.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-[Inter]">
            The next generation of disaster management. We leverage realtime machine learning engines to filter noise, predict severity, and dynamically connect those in need with critical resources.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto px-8 py-3.5 flex items-center justify-center gap-2 text-white font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Join the Network <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left"
        >
          {/* Feature 1 */}
          <div className="p-8 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <ShieldCheck strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-[Playfair_Display] font-bold text-slate-900 dark:text-white mb-3">ML Credibility</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-[Inter]">
              Our Naive Bayes engine acts as the frontline defense against spam—evaluating linguistic patterns to assign statistical confidence to global alerts instantly.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Crosshair strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-[Playfair_Display] font-bold text-slate-900 dark:text-white mb-3">Resource Matching</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-[Inter]">
              A K-Nearest Neighbors (KNN) algorithm calculates haversine distances in real-time, mapping isolated victims to their closest viable life-saving resources dynamically.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Map strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-[Playfair_Display] font-bold text-slate-900 dark:text-white mb-3">Active Hotspots</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-[Inter]">
              K-Means spatial clustering scans the regional alert density maps 24/7, pinpointing escalating disaster hubs to organize centralized admin deployments visually.
            </p>
          </div>
        </motion.div>

        {/* Reputation Ecosystem Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="mt-32 w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12 text-left"
        >
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-[Playfair_Display] font-bold text-slate-900 dark:text-white leading-tight">
              A Meritocratic Response Network
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-[Inter] leading-relaxed pb-4">
              Users progress through a rigorous verification pipeline. Start as a <strong className="font-semibold text-slate-900 dark:text-white">Bronze</strong> newcomer, confirm legitimate alerts, distribute resources, and ascend through <strong className="font-semibold text-slate-900 dark:text-white">Silver</strong> and <strong className="font-semibold text-slate-900 dark:text-white">Gold</strong> ranks. 
              Break the 100-point threshold to earn the absolute highest <strong className="font-semibold text-emerald-600 dark:text-emerald-500">Community Leader status.</strong>
            </p>
            <div className="flex items-center gap-4 text-sm font-semibold text-slate-900 dark:text-white">
              <div className="flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-600" /> Bronze</div>
              <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
              <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-slate-400" /> Silver</div>
              <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
              <div className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-yellow-500" /> Gold</div>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            {/* Abstract visual mockup */}
            <div className="relative aspect-[4/3] rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-white/50 dark:border-white/5 shadow-2xl overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTUwLCAxNTAsIDE1MCwgMC4xKSIvPjwvc3ZnPg==')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
              
              <div className="relative z-10 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-5 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">96 PTS</h4>
                    <span className="text-[10px] uppercase font-bold text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40 px-2 py-0.5 rounded-full">Gold Tier</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="w-[96%] h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                  </div>
                  <p className="text-xs text-right text-slate-500 font-medium">Path to Community Leader</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
