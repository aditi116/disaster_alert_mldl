import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Award, Shield, Star, ShieldAlert, ArrowUpRight, ArrowDownRight, TrendingUp, History } from 'lucide-react';
import { mlAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TIER_CONFIG = {
  BRONZE: { color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/40', icon: Award, label: 'Bronze' },
  SILVER: { color: 'text-slate-400 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', icon: Shield, label: 'Silver' },
  GOLD: { color: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40', icon: Star, label: 'Gold' },
  PLATINUM: { color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: Star, label: 'Platinum' },
  DEFAULT: { color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Award, label: 'Unranked' },
};

export default function ReputationModal({ userId, onClose }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user && (user.id === userId || user.id === parseInt(userId, 10));

  useEffect(() => {
    const fetchRep = async () => {
      try {
        const res = await mlAPI.getUserReputation(userId);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load reputation for user:", userId, err);
        // Fallback default structure if missing so the modal doesn't crash
        setData({ totalPoints: 0, tier: 'BRONZE', history: [] });
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchRep();
  }, [userId]);

  if (!userId) return null;

  // Progress to 100 points
  const points = data?.totalPoints || data?.reputationScore || 0;
  const progressPct = Math.min(100, Math.max(0, (points / 100) * 100));

  let computedTier = 'BRONZE';
  if (points >= 100) computedTier = 'PLATINUM';
  else if (points >= 50) computedTier = 'GOLD';
  else if (points >= 20) computedTier = 'SILVER';

  const tierKey = data?.tier?.toUpperCase() || computedTier;
  const tierConfig = TIER_CONFIG[tierKey] || TIER_CONFIG.DEFAULT;
  const TierIcon = tierConfig.icon;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700"
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-blue-600 to-indigo-800 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-white drop-shadow-md">
              {isOwnProfile ? "Your Reputation Profile" : "User Reputation"}
            </h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="absolute -bottom-8 left-6">
            <div className={`p-4 rounded-xl shadow-lg border-4 border-white dark:border-slate-900 ${tierConfig.bg} ${tierConfig.color}`}>
              <TierIcon className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="relative flex h-8 w-8 shrink-0 mb-4">
                <span className="animate-spin absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent" />
              </span>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Fetching reputation data...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                    {points} <span className="text-sm font-medium text-gray-500 dark:text-gray-400">PTS</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold uppercase tracking-wider py-0.5 px-2 rounded-full ${tierConfig.bg} ${tierConfig.color}`}>
                      {tierConfig.label} TIER
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Path to Platinum (100)
                  </p>
                  <div className="w-32 h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                      className={`h-full rounded-full bg-gradient-to-r ${points >= 100 ? 'from-emerald-500 to-green-600' : 'from-indigo-500 to-blue-500'}`}
                    />
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <History className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Recent Activity</h4>
                </div>
                
                <div className="max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700 rounded-lg">
                  {!data?.history || data.history.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-gray-200 dark:border-slate-700">
                      No reputation events recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.history.slice(0, 10).map((event, idx) => {
                        const isPositive = event.pointsDelta > 0;
                        return (
                          <div
                            key={event.id || idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/50"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {event.eventType ? event.eventType.replace(/_/g, ' ') : 'Event Activity'}
                              </p>
                              {event.reason && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                  {event.reason}
                                </p>
                              )}
                            </div>
                            <div className={`flex items-center gap-1 font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              <span>{Math.abs(event.pointsDelta)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
