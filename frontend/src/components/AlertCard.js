import React, { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MapPin,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  ShieldX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { alertAPI } from '../services/api';

// ─────────────────────────────────────────────
// CredibilityBadge — resolves style from label
// and displays a Framer Motion animated badge
// with an inline tooltip on hover.
// ─────────────────────────────────────────────

const CREDIBILITY_CONFIG = {
  CREDIBLE: {
    // Confidence threshold to show: > 0.70
    threshold: 0.70,
    icon: CheckCircle,
    label: 'Credible',
    // Tailwind tonal colours  light / dark
    bg: 'bg-emerald-100 dark:bg-emerald-900/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-500/40',
    dot: 'bg-emerald-500',
    tooltipBg: 'bg-emerald-900',
    description: 'ML classifier marked this alert as credible based on its content, posting history, and time of report.',
  },
  SUSPICIOUS: {
    // Confidence threshold: 0.30 – 0.70
    threshold: 0.30,
    icon: ShieldAlert,
    label: 'Suspicious',
    bg: 'bg-amber-100 dark:bg-amber-900/50',
    text: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-500/40',
    dot: 'bg-amber-500',
    tooltipBg: 'bg-amber-900',
    description: 'Classifier confidence is moderate. Verify before acting on this alert.',
  },
  SPAM: {
    // Confidence threshold: > 0.50 (per spec)
    threshold: 0.50,
    icon: ShieldX,
    label: 'Spam',
    bg: 'bg-rose-100 dark:bg-rose-900/50',
    text: 'text-rose-700 dark:text-rose-300',
    ring: 'ring-rose-500/40',
    dot: 'bg-rose-500',
    tooltipBg: 'bg-rose-900',
    description: 'ML classifier flagged this as likely spam. Treat with high skepticism.',
  },
};

/**
 * Resolves whether to display the badge based on:
 *   - CREDIBLE  → confidence > 0.70
 *   - SUSPICIOUS → confidence in [0.30, 0.70]
 *   - SPAM      → confidence > 0.50
 * Returns null if label is missing or confidence is below its threshold.
 */
function resolveCredibility(label, confidence) {
  if (!label || confidence == null) return null;
  const cfg = CREDIBILITY_CONFIG[label.toUpperCase()];
  if (!cfg) return null;
  if (confidence < cfg.threshold) return null;
  return cfg;
}

export const CredibilityBadge = ({ credibilityLabel, credibilityConfidence }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const cfg = resolveCredibility(credibilityLabel, credibilityConfidence);
  if (!cfg) return null;

  const Icon = cfg.icon;
  const pct = Math.round((credibilityConfidence ?? 0) * 100);

  return (
    <motion.div
      className="relative inline-flex items-center"
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.1 }}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
      // keep tooltip accessible for keyboard users
      tabIndex={0}
      role="status"
      aria-label={`ML credibility: ${cfg.label} (${pct}% confidence)`}
    >
      {/* Badge pill */}
      <span
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1
          rounded-full text-xs font-semibold
          ring-1 ${cfg.ring}
          ${cfg.bg} ${cfg.text}
          select-none cursor-default
        `}
      >
        {/* Animated pulse dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-60`}
          />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
        </span>

        <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
        <span>{cfg.label}</span>
        <span className="opacity-70 font-normal">{pct}%</span>
      </span>

      {/* Tooltip — appears above the badge */}
      <AnimatePresence>
        {tooltipVisible && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            // Position: below on small screens, above on larger
            className={`
              absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2
              w-56 p-2.5 rounded-lg shadow-xl
              ${cfg.tooltipBg} text-white text-xs leading-relaxed
              pointer-events-none
            `}
          >
            {/* Caret */}
            <span
              className={`
                absolute top-full left-1/2 -translate-x-1/2
                border-4 border-transparent
                border-t-current
              `}
              style={{ color: 'inherit', borderTopColor: 'inherit' }}
              aria-hidden="true"
            />
            <p className="font-semibold mb-1">
              ML Credibility · {cfg.label}
            </p>
            <p className="opacity-85">{cfg.description}</p>
            <p className="mt-1 opacity-60">
              Confidence: <strong className="opacity-100">{pct}%</strong>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// AlertCard
// ─────────────────────────────────────────────

const AlertCard = ({ alert, onUpdate, onClick, onClickUser }) => {
  const [voting, setVoting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleVote = async (isUpvote, e) => {
    e.stopPropagation();
    if (voting) return;

    setVoting(true);
    try {
      await alertAPI.vote(alert.id, isUpvote);
      onUpdate();
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      1: 'from-blue-500 to-blue-600',
      2: 'from-yellow-500 to-yellow-600',
      3: 'from-orange-500 to-orange-600',
      4: 'from-red-500 to-red-600',
      5: 'from-purple-500 to-purple-600',
    };
    return colors[severity] || 'from-gray-500 to-gray-600';
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      1: { text: 'Low',      bg: 'bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-200'   },
      2: { text: 'Moderate', bg: 'bg-yellow-100  text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      3: { text: 'High',     bg: 'bg-orange-100  text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      4: { text: 'Critical', bg: 'bg-red-100     text-red-800    dark:bg-red-900    dark:text-red-200'    },
      5: { text: 'Extreme',  bg: 'bg-purple-100  text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    };
    return badges[severity] || badges[1];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);

    if (diff < 1)    return 'Just now';
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const severityBadge  = getSeverityBadge(alert.severity);
  const isHighPriority = alert.severity >= 4;

  // Destructure ML fields from the alert response
  const { credibilityLabel, credibilityConfidence } = alert;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-4 cursor-pointer overflow-hidden transition-all duration-300 ${
        isHighPriority ? 'ring-2 ring-red-500 ring-opacity-50' : ''
      }`}
    >
      {/* Severity gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getSeverityColor(alert.severity)}`} />

      {/* High priority pulse indicator — shifted left to leave space for badge */}
      {isHighPriority && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute top-3 right-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </motion.div>
      )}

      {/* ── Card Header ── */}
      <div className="flex items-start justify-between mb-3 mt-2">
        <div className="flex-1 pr-8">
          <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 leading-tight">
            {alert.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
            {alert.description}
          </p>
        </div>
      </div>

      {/* ── Metadata row ── */}
      <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
        {/* Severity */}
        <span className={`badge ${severityBadge.bg} font-semibold`}>
          {severityBadge.text}
        </span>

        {/* Alert type */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
          <MapPin className="w-3 h-3 mr-1" />
          <span className="font-medium">{alert.alertType}</span>
        </div>

        {/* Timestamp */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3 mr-1" />
          <span>{formatDate(alert.createdAt)}</span>
        </div>

        {/* ── ML Credibility Badge ── */}
        <CredibilityBadge
          credibilityLabel={credibilityLabel}
          credibilityConfidence={credibilityConfidence}
        />
      </div>

      {/* ── Actions row ── */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleVote(true, e)}
            disabled={voting}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 transition-all disabled:opacity-50 group"
          >
            <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold">
              {alert.reliabilityScore > 0 ? alert.reliabilityScore : 0}
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleVote(false, e)}
            disabled={voting}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-all disabled:opacity-50 group"
          >
            <ThumbsDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </motion.button>

          {alert.reliabilityScore > 5 && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Verified</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            by{' '}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onClickUser && alert.userId) onClickUser(alert.userId);
              }}
              className="font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none hover:underline focus:underline transition-colors cursor-pointer"
            >
              {alert.username}
            </button>
          </span>
        </div>
      </div>

      {/* Hover shimmer overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.05 : 0 }}
        className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 pointer-events-none"
      />
    </motion.div>
  );
};

export default AlertCard;
