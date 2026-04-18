import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MapPin, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { alertAPI } from '../services/api';

const AlertCard = ({ alert, onUpdate, onClick }) => {
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
      1: { text: 'Low', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      2: { text: 'Moderate', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      3: { text: 'High', bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      4: { text: 'Critical', bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      5: { text: 'Extreme', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    };
    return badges[severity] || badges[1];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const severityBadge = getSeverityBadge(alert.severity);
  const isHighPriority = alert.severity >= 4;

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
      
      {/* High priority indicator */}
      {isHighPriority && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute top-3 right-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </motion.div>
      )}

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
      
      {/* Metadata */}
      <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span className={`badge ${severityBadge.bg} font-semibold`}>
          {severityBadge.text}
        </span>
        <div className="flex items-center bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
          <MapPin className="w-3 h-3 mr-1" />
          <span className="font-medium">{alert.alertType}</span>
        </div>
        <div className="flex items-center bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3 mr-1" />
          <span>{formatDate(alert.createdAt)}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleVote(true, e)}
            disabled={voting}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 transition-all disabled:opacity-50 group"
          >
            <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold">{alert.reliabilityScore > 0 ? alert.reliabilityScore : 0}</span>
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
            by <span className="font-semibold text-gray-700 dark:text-gray-300">{alert.username}</span>
          </span>
        </div>
      </div>

      {/* Hover effect overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.05 : 0 }}
        className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 pointer-events-none"
      />
    </motion.div>
  );
};

export default AlertCard;
