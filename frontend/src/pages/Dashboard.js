import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import {
  AlertTriangle,
  Plus,
  LogOut,
  Package,
  X,
  Trash2,
  Moon,
  Sun,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { alertAPI, resourceAPI, mlAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AlertCard, { CredibilityBadge } from "../components/AlertCard";
import CreateAlertModal from "../components/CreateAlertModal";
import CreateResourceModal from "../components/CreateResourceModal";
import ReputationModal from "../components/ReputationModal";
import AIChatbot from "../components/AIChatbot";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom icons for alerts and resources
const alertIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const resourceIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to handle map centering
const MapCenterController = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 12, {
        animate: true,
        duration: 1,
      });
    }
  }, [center, map]);

  return null;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedReputationUserId, setSelectedReputationUserId] =
    useState(null);
  const [activeTab, setActiveTab] = useState("alerts");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]); // Default: New Delhi, India
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Nearest Resources Engine state
  const [nearestResources, setNearestResources] = useState([]);
  const [loadingNearestResources, setLoadingNearestResources] = useState(false);

  // K-Means Hotspots state
  const [hotspots, setHotspots] = useState([]);

  useEffect(() => {
    fetchAlerts();
    fetchResources();
    fetchHotspots();
    getCurrentLocation();
  }, []);

  // Fetch Nearest Resources when an alert is selected
  useEffect(() => {
    if (selectedItem && selectedItemType === "alert") {
      const fetchNearest = async () => {
        setLoadingNearestResources(true);
        try {
          const res = await mlAPI.getNearestResources(
            selectedItem.latitude,
            selectedItem.longitude,
          );
          // Backend returns top available resources with distanceKm
          setNearestResources((res.data || []).slice(0, 3));
        } catch (err) {
          console.error("Failed to fetch nearest resources", err);
          setNearestResources([]);
        } finally {
          setLoadingNearestResources(false);
        }
      };

      fetchNearest();
    } else {
      setNearestResources([]);
    }
  }, [selectedItem, selectedItemType]);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if ("geolocation" in navigator) {
      toast.loading("Getting your location...", { id: "location" });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationLoading(false);
          toast.success("Location found! Map centered on your position.", {
            id: "location",
          });
          console.log("Location obtained:", latitude, longitude);
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          setLocationLoading(false);
          toast.error(
            "Could not get your location. Using default map center.",
            { id: "location" },
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    } else {
      setLocationLoading(false);
      console.warn("Geolocation not supported");
      toast.error("Geolocation not supported by your browser.", {
        id: "location",
      });
    }
  };

  // Guard wrapper: prevents a second geolocation request while one is in flight
  const handleRecenter = () => {
    if (locationLoading) return;
    getCurrentLocation();
  };

  useEffect(() => {
    filterAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, searchQuery, severityFilter]);

  useEffect(() => {
    filterResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources, searchQuery]);

  const fetchAlerts = async () => {
    try {
      const response = await alertAPI.getAll({ page: 0, size: 50 });
      setAlerts(response.data);
      toast.success("Alerts loaded successfully");
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    if (searchQuery) {
      filtered = filtered.filter(
        (alert) =>
          alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.alertType.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter(
        (alert) => alert.severity === parseInt(severityFilter),
      );
    }

    setFilteredAlerts(filtered);
  };

  const filterResources = () => {
    let filtered = [...resources];

    if (searchQuery) {
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredResources(filtered);
  };

  const fetchResources = async () => {
    try {
      const response = await resourceAPI.getAll({ page: 0, size: 50 });
      setResources(response.data);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to load resources");
    }
  };

  const fetchHotspots = async () => {
    try {
      const response = await mlAPI.getHotspots();
      setHotspots(response.data || []);
    } catch (error) {
      console.error("Error fetching hotspots:", error);
    }
  };

  const handleAlertCreated = () => {
    setShowAlertModal(false);
    fetchAlerts();
    toast.success("Alert created successfully!");
  };

  const handleResourceCreated = () => {
    setShowResourceModal(false);
    fetchResources();
    toast.success("Resource created successfully!");
  };

  const handleDeleteAlert = async (id) => {
    if (window.confirm("Are you sure you want to delete this alert?")) {
      try {
        await alertAPI.delete(id);
        setSelectedItem(null);
        setSelectedItemType(null);
        fetchAlerts();
        toast.success("Alert deleted successfully");
      } catch (error) {
        console.error("Error deleting alert:", error);
        toast.error("Failed to delete alert");
      }
    }
  };

  const handleDeleteResource = async (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await resourceAPI.delete(id);
        setSelectedItem(null);
        setSelectedItemType(null);
        fetchResources();
        toast.success("Resource deleted successfully");
      } catch (error) {
        console.error("Error deleting resource:", error);
        toast.error("Failed to delete resource");
      }
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      1: "bg-blue-500",
      2: "bg-yellow-500",
      3: "bg-orange-500",
      4: "bg-red-500",
      5: "bg-purple-500",
    };
    return colors[severity] || "bg-gray-500";
  };

  const getStats = () => {
    const criticalAlerts = alerts.filter((a) => a.severity >= 4).length;
    const activeAlerts = alerts.filter((a) => a.status === "ACTIVE").length;
    const totalVotes = alerts.reduce(
      (sum, a) => sum + (a.reliabilityScore || 0),
      0,
    );
    return {
      criticalAlerts,
      activeAlerts,
      totalVotes,
      totalResources: resources.length,
    };
  };

  const stats = getStats();

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      <Toaster position="top-right" />

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white dark:bg-slate-800 shadow-lg z-10 border-b border-gray-200 dark:border-slate-700"
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  ResQNet
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Real-time Emergency Platform
                </p>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="hidden lg:flex items-center space-x-3 pl-6 border-l border-gray-300 dark:border-slate-600">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowStats(!showStats)}
                className="flex items-center space-x-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  {stats.criticalAlerts}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Critical
                </span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
              >
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {stats.activeAlerts}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Active
                </span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/30 rounded-lg"
              >
                <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {stats.totalResources}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Resources
                </span>
              </motion.div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
              <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.username}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowStats(!showStats)}
              className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAlertModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Alert</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResourceModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg shadow-md transition-all"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Resource</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Analytics Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-b border-gray-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Quick Analytics</span>
                </h3>
                <button
                  onClick={() => setShowStats(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Alerts */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Alerts
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {alerts.length}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {filteredAlerts.length} filtered
                  </p>
                </motion.div>

                {/* Critical Alerts */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Critical
                      </p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {stats.criticalAlerts}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Severity ≥ 4
                  </p>
                </motion.div>

                {/* Active Alerts */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Active
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.activeAlerts}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Currently active
                  </p>
                </motion.div>

                {/* Total Resources */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Resources
                      </p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.totalResources}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {filteredResources.length} filtered
                  </p>
                </motion.div>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {/* Reliability Score */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Total Votes
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {stats.totalVotes}
                  </p>
                </div>

                {/* Average Severity */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Avg Severity
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {alerts.length > 0
                      ? (
                          alerts.reduce((sum, a) => sum + a.severity, 0) /
                          alerts.length
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>

                {/* Alert Types */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Alert Types
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {new Set(alerts.map((a) => a.alertType)).size}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Alert/Resource List */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="w-96 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col"
        >
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts & resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                  showFilters
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 space-y-2 overflow-hidden"
                >
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Severity Level
                  </label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="1">Low (1)</option>
                    <option value="2">Moderate (2)</option>
                    <option value="3">High (3)</option>
                    <option value="4">Critical (4)</option>
                    <option value="5">Extreme (5)</option>
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "alerts"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Alerts ({filteredAlerts.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("resources")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "resources"
                  ? "text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/30"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Resources ({filteredResources.length})</span>
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900">
            {activeTab === "alerts" ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Alerts
                </h2>
                {loading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading alerts...
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No alerts found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAlerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onUpdate={fetchAlerts}
                        onClick={() => {
                          setSelectedItem(alert);
                          setSelectedItemType("alert");
                        }}
                        onClickUser={(uid) => setSelectedReputationUserId(uid)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Available Resources
                </h2>
                {loading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading resources...
                  </div>
                ) : filteredResources.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No resources found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredResources.map((resource) => (
                      <motion.div
                        key={resource.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        onClick={() => {
                          setSelectedItem(resource);
                          setSelectedItemType("resource");
                        }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {resource.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded">
                            {resource.status}
                          </span>
                          {resource.contactInfo && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              📞 {resource.contactInfo}
                            </span>
                          )}
                        </div>
                        {/* Resource Provider -> triggers Reputation logic */}
                        {(resource.providerId || resource.userId) && (
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700/50 flex justify-end">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              provided by{" "}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReputationUserId(
                                    resource.providerId || resource.userId,
                                  );
                                }}
                                className="font-semibold text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 focus:outline-none hover:underline focus:underline cursor-pointer transition-colors"
                              >
                                {resource.providerName ||
                                  resource.username ||
                                  `User #${resource.providerId || resource.userId}`}
                              </button>
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Map View */}
        <div className="flex-1 relative">
          {/* ── Recenter FAB (glassmorphism) ── */}
          <motion.button
            id="recenter-map-btn"
            onClick={handleRecenter}
            disabled={locationLoading}
            title={
              locationLoading
                ? "Finding your location…"
                : "Recenter map on your location"
            }
            // entrance: slide in from the right
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 28,
              delay: 0.4,
            }}
            whileHover={locationLoading ? {} : { scale: 1.08, y: -2 }}
            whileTap={locationLoading ? {} : { scale: 0.94 }}
            className={`
              absolute top-4 right-4 z-[1000]
              flex items-center gap-2
              px-4 py-2.5 rounded-xl
              /* glassmorphism */
              bg-white/70 dark:bg-slate-800/70
              backdrop-blur-md
              border border-white/50 dark:border-slate-600/60
              shadow-[0_8px_32px_rgba(0,0,0,0.18)]
              text-slate-700 dark:text-slate-200
              font-medium text-sm
              transition-opacity duration-200
              ${locationLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-white/90 dark:hover:bg-slate-800/90 cursor-pointer"}
            `}
          >
            <AnimatePresence mode="wait" initial={false}>
              {locationLoading ? (
                <motion.span
                  key="spinner"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  {/* Spinner */}
                  <span className="relative flex h-4 w-4 shrink-0">
                    <span className="animate-spin absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent" />
                  </span>
                  <span>Locating…</span>
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  {/* Pulsing dot accent */}
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                  </span>
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>My Location</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
            <MapCenterController center={mapCenter} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* K-Means Hotspot Clusters - Translucent circles */}
            {hotspots.map((cluster, idx) => (
              <Circle
                key={`hotspot-${idx}`}
                center={[cluster.centroidLat, cluster.centroidLng]}
                radius={cluster.radiusMeters || 3000}
                pathOptions={{
                  fillColor: "#ef4444",
                  color: "#b91c1c",
                  weight: 4,
                  opacity: 0.3,
                  fillOpacity: 0.15,
                  dashArray: "6 4",
                }}
              >
                <Popup>
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-amber-700 font-semibold">
                        🎯 HOTSPOT CLUSTER
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      Cluster {cluster.clusterId + 1}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Alerts: {cluster.alertCount}
                    </p>
                    <p className="text-xs text-gray-600">
                      Type: {cluster.dominantAlertType}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Centroid: ({cluster.centroidLat.toFixed(4)},
                      {cluster.centroidLng.toFixed(4)})
                    </p>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Alert Markers - Red */}
            {alerts.map((alert) => (
              <Marker
                key={`alert-${alert.id}`}
                position={[alert.latitude, alert.longitude]}
                icon={alertIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedItem(alert);
                    setSelectedItemType("alert");
                  },
                }}
              >
                <Popup>
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-red-600 font-semibold">
                        🚨 ALERT
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {alert.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.description}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs text-white ${getSeverityColor(alert.severity)}`}
                      >
                        Severity: {alert.severity}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedItem(alert);
                        setSelectedItemType("alert");
                      }}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      View Details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Resource Markers - Green */}
            {resources
              .filter((r) => r.latitude && r.longitude)
              .map((resource) => (
                <Marker
                  key={`resource-${resource.id}`}
                  position={[resource.latitude, resource.longitude]}
                  icon={resourceIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedItem(resource);
                      setSelectedItemType("resource");
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-600 font-semibold">
                          📦 RESOURCE
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {resource.description}
                      </p>
                      <div className="mt-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                          {resource.status}
                        </span>
                      </div>
                      {resource.contactInfo && (
                        <p className="text-xs text-gray-500 mt-2">
                          📞 {resource.contactInfo}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setSelectedItem(resource);
                          setSelectedItemType("resource");
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        View Details →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* User Location Marker - Blue */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={L.icon({
                  iconUrl:
                    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
                  shadowUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                })}
              >
                <Popup>
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-blue-600 font-semibold">
                        📍 Your Location
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">You are here</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Lat: {userLocation.lat.toFixed(6)}
                      <br />
                      Lng: {userLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedReputationUserId && (
          <ReputationModal
            userId={selectedReputationUserId}
            onClose={() => setSelectedReputationUserId(null)}
          />
        )}
      </AnimatePresence>

      {showAlertModal && (
        <CreateAlertModal
          onClose={() => setShowAlertModal(false)}
          onSuccess={handleAlertCreated}
        />
      )}

      {showResourceModal && (
        <CreateResourceModal
          onClose={() => setShowResourceModal(false)}
          onSuccess={handleResourceCreated}
        />
      )}

      {/* Detail View Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedItemType === "alert"
                  ? "🚨 Alert Details"
                  : "📦 Resource Details"}
              </h2>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setSelectedItemType(null);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedItemType === "alert" ? (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedItem.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Created {new Date(selectedItem.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedItem.description || "No description provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <span className="inline-block px-3 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                        {selectedItem.alertType || selectedItem.resourceType || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Severity
                      </label>
                      <span className={`inline-block px-3 py-1 rounded text-white ${getSeverityColor(selectedItem.severity)}`}>
                        Level {selectedItem.severity}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <span className="inline-block px-3 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                        {selectedItem.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">
                      📍 {selectedItem.latitude.toFixed(6)}, {selectedItem.longitude.toFixed(6)}
                    </p>
                    <button
                      onClick={() => {
                        setMapCenter([selectedItem.latitude, selectedItem.longitude]);
                        setSelectedItem(null);
                        setSelectedItemType(null);
                      }}
                      className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Show on Map
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reliability Score
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedItem.reliabilityScore || 0} votes
                    </p>
                  </div>

                  {selectedItem.credibilityLabel && (
                    <div className="mt-6 pt-5 border-t border-gray-200 dark:border-slate-700">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                        ✓ Alert Verification
                      </h4>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Classification:
                          </span>
                          <CredibilityBadge
                            credibilityLabel={selectedItem.credibilityLabel}
                            credibilityConfidence={selectedItem.credibilityConfidence}
                          />
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <p className="mt-2">
                            {selectedItem.credibilityLabel === 'CREDIBLE' &&
                              'High credibility based on content analysis and reliability patterns.'}
                            {selectedItem.credibilityLabel === 'SUSPICIOUS' &&
                              'Mixed signals detected. Review source and content before taking action.'}
                            {selectedItem.credibilityLabel === 'SPAM' &&
                              'Likely spam or misinformation. Verify with official sources.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {nearestResources.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-gray-200 dark:border-slate-700">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                        📍 Related Alerts Nearby
                      </h4>
                      <div className="space-y-2">
                        {nearestResources.slice(0, 3).map((res, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-lg"
                          >
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {res.title || `Alert ${idx + 1}`}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {(res.distanceKm || res.distance || 0).toFixed(1)} km away
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedItem.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Created {new Date(selectedItem.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedItem.description || "No description provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <span className="inline-block px-3 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm">
                        {selectedItem.status || "Active"}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <span className="inline-block px-3 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm">
                        {selectedItem.resourceType || "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">
                      📍 {selectedItem.latitude.toFixed(6)}, {selectedItem.longitude.toFixed(6)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contact
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedItem.contactInfo || "No contact info"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

