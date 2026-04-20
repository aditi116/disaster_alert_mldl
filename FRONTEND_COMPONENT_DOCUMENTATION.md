# Frontend Component Documentation

## Overview

Complete documentation of frontend React components with exact function signatures, state variables, and map integration details.

---

## 1. Dashboard.js

**File Location:** `frontend/src/pages/Dashboard.js`

### Imports

```javascript
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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
```

### Leaflet Configuration (Icon Fix)

```javascript
// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});
```

### Custom Icons

#### Alert Icon (Red)

```javascript
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
```

#### Resource Icon (Green)

```javascript
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
```

#### User Location Icon (Blue)

```javascript
// Dynamically created in the map marker, not pre-defined:
L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
```

### MapCenterController Component

**Type:** Helper component to handle map recentering

```javascript
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
```

**Purpose:** Watches the `center` prop and calls `map.setView()` with:

- `center` - [latitude, longitude] array
- `12` - zoom level
- `animate: true, duration: 1` - smooth animation over 1 second

**Usage in MapContainer:**

```javascript
<MapCenterController center={mapCenter} />
```

### Dashboard Component - State Variables

```javascript
const Dashboard = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  // Alert Management
  const [alerts, setAlerts] = useState([]); // Array of all fetched alerts
  const [filteredAlerts, setFilteredAlerts] = useState([]); // Alerts after search/severity filter

  // Resource Management
  const [resources, setResources] = useState([]); // Array of all fetched resources
  const [filteredResources, setFilteredResources] = useState([]); // Resources after search filter

  // UI State
  const [loading, setLoading] = useState(true); // Loading state for initial fetch
  const [showAlertModal, setShowAlertModal] = useState(false); // Control CreateAlertModal visibility
  const [showResourceModal, setShowResourceModal] = useState(false); // Control CreateResourceModal visibility
  const [selectedReputationUserId, setSelectedReputationUserId] =
    useState(null); // User ID for ReputationModal

  // Tabs & Selections
  const [activeTab, setActiveTab] = useState("alerts"); // 'alerts' or 'resources'
  const [selectedItem, setSelectedItem] = useState(null); // Currently selected alert/resource for detail view
  const [selectedItemType, setSelectedItemType] = useState(null); // 'alert' or 'resource'

  // Map State
  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]); // [lat, lng] - Default: New Delhi, India
  const [userLocation, setUserLocation] = useState(null); // { lat: number, lng: number } or null
  const [locationLoading, setLocationLoading] = useState(true); // Geolocation in progress

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState(""); // Search term for title/description
  const [severityFilter, setSeverityFilter] = useState("all"); // 'all' or string number '1'-'5'
  const [showFilters, setShowFilters] = useState(false); // Collapse/expand filters panel
  const [showStats, setShowStats] = useState(false); // Show/hide analytics stats panel

  // Nearest Resources Engine (ML-backed)
  const [nearestResources, setNearestResources] = useState([]); // Array of top 3 resources from KNN API
  const [loadingNearestResources, setLoadingNearestResources] = useState(false); // Loading for KNN request
};
```

### Dashboard Component - Functions

#### getCurrentLocation()

```javascript
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
        toast.error("Could not get your location. Using default map center.", {
          id: "location",
        });
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
```

**Purpose:** Fetches user's current GPS location using browser Geolocation API

- **Options:** `enableHighAccuracy: true`, `timeout: 5000ms`, `maximumAge: 0`
- **Side Effects:**
  - Updates `mapCenter` to [latitude, longitude]
  - Updates `userLocation` to { lat, lng }
  - Shows toast notifications
  - Sets `locationLoading` to false when done

#### handleRecenter()

```javascript
const handleRecenter = () => {
  if (locationLoading) return;
  getCurrentLocation();
};
```

**Purpose:** Guard wrapper to prevent second geolocation request while one is in flight

#### useEffect - Initial Data Load

```javascript
useEffect(() => {
  fetchAlerts();
  fetchResources();
  getCurrentLocation();
}, []);
```

**Purpose:** Runs on component mount to load all data

#### useEffect - Nearest Resources Fetching

```javascript
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
```

**Purpose:** Triggers KNN nearest resources lookup when an alert is selected

- **API Call:** `mlAPI.getNearestResources(latitude, longitude)`
- **Returns:** Top 3 available resources with `distanceKm` field
- **Side Effects:** Updates `nearestResources` and `loadingNearestResources`

#### useEffect - Alert Filtering

```javascript
useEffect(() => {
  filterAlerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [alerts, searchQuery, severityFilter]);
```

**Purpose:** Re-filters alerts when alerts list, search query, or severity filter changes

#### useEffect - Resource Filtering

```javascript
useEffect(() => {
  filterResources();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [resources, searchQuery]);
```

**Purpose:** Re-filters resources when resources list or search query changes

#### filterAlerts()

```javascript
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
```

**Purpose:** Filters alerts by:

- **searchQuery:** Matches against title, description, or alertType (case-insensitive)
- **severityFilter:** Matches exact severity level (converted from string to int)

#### filterResources()

```javascript
const filterResources = () => {
  let filtered = [...resources];

  if (searchQuery) {
    filtered = filtered.filter(
      (resource) =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  setFilteredResources(filtered);
};
```

**Purpose:** Filters resources by searchQuery (title or description)

#### fetchAlerts()

```javascript
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
```

**Purpose:** Fetches all alerts from backend API

- **API Call:** `alertAPI.getAll({ page: 0, size: 50 })`
- **Parameters:** Pagination (page 0, size 50)
- **Returns:** `response.data` = array of alerts

#### fetchResources()

```javascript
const fetchResources = async () => {
  try {
    const response = await resourceAPI.getAll({ page: 0, size: 50 });
    setResources(response.data);
  } catch (error) {
    console.error("Error fetching resources:", error);
    toast.error("Failed to load resources");
  }
};
```

**Purpose:** Fetches all resources from backend API

- **API Call:** `resourceAPI.getAll({ page: 0, size: 50 })`
- **Returns:** `response.data` = array of resources

#### handleAlertCreated()

```javascript
const handleAlertCreated = () => {
  setShowAlertModal(false);
  fetchAlerts();
  toast.success("Alert created successfully!");
};
```

**Purpose:** Callback when CreateAlertModal successfully creates alert

- Closes modal
- Refreshes alerts list
- Shows success toast

#### handleResourceCreated()

```javascript
const handleResourceCreated = () => {
  setShowResourceModal(false);
  fetchResources();
  toast.success("Resource created successfully!");
};
```

**Purpose:** Callback when CreateResourceModal successfully creates resource

#### handleDeleteAlert(id)

```javascript
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
```

**Purpose:** Deletes alert with confirmation

- **Parameters:** `id` - alert ID to delete
- **API Call:** `alertAPI.delete(id)`
- **Side Effects:** Clears selection, refreshes list, shows toast

#### handleDeleteResource(id)

```javascript
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
```

**Purpose:** Deletes resource with confirmation

#### getSeverityColor(severity)

```javascript
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
```

**Purpose:** Maps severity level (1-5) to Tailwind CSS color classes

#### getStats()

```javascript
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
```

**Purpose:** Calculates dashboard statistics

- **Returns Object:**
  - `criticalAlerts` - count where severity >= 4
  - `activeAlerts` - count where status === 'ACTIVE'
  - `totalVotes` - sum of all reliabilityScores
  - `totalResources` - total resource count

### Map Container Configuration

```javascript
<MapContainer center={mapCenter} zoom={12} className="h-full w-full">
  <MapCenterController center={mapCenter} />
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
  {/* Markers and popups below */}
</MapContainer>
```

**Library:** React-Leaflet + Leaflet

- **Center:** `mapCenter` state - [latitude, longitude]
- **Zoom Level:** 12
- **Tile Provider:** OpenStreetMap (free, no API key needed)
- **Container:** Full height/width flexbox container

### Alert Markers

```javascript
{
  alerts.map((alert) => (
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
            <span className="text-red-600 font-semibold">🚨 ALERT</span>
          </div>
          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
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
  ));
}
```

**Properties:**

- **position:** [alert.latitude, alert.longitude]
- **icon:** Red marker (alertIcon)
- **onClick Handler:** Sets selectedItem and selectedItemType, opens detail modal
- **Popup Content:**
  - Title, description
  - Severity badge with color
  - "View Details" button

### Resource Markers

```javascript
{
  resources
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
              <span className="text-green-600 font-semibold">📦 RESOURCE</span>
            </div>
            <h3 className="font-semibold text-gray-900">{resource.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
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
    ));
}
```

**Properties:**

- **Filter:** Only renders resources with lat/lng: `resources.filter(r => r.latitude && r.longitude)`
- **position:** [resource.latitude, resource.longitude]
- **icon:** Green marker (resourceIcon)
- **onClick Handler:** Sets selectedItem and selectedItemType
- **Popup Content:**
  - Title, description
  - Status badge
  - Contact info (if available)
  - "View Details" button

### User Location Marker

```javascript
{
  userLocation && (
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
  );
}
```

**Properties:**

- **Conditional Rendering:** Only renders if `userLocation` is not null
- **position:** [userLocation.lat, userLocation.lng]
- **icon:** Blue marker (dynamically created inline)
- **Popup Content:**
  - "Your Location" label
  - Latitude/Longitude coordinates (6 decimals)

### Detail View Modal

Triggered when `selectedItem` is not null. Modal renders different content based on `selectedItemType`:

#### For Alerts:

```javascript
{selectedItemType === 'alert' ? (
  <>
    {/* Header with Credibility Badge */}
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedItem.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Created {new Date(selectedItem.createdAt).toLocaleString()}
        </p>
      </div>
      {selectedItem.credibilityLabel && (
        <div className="shrink-0">
          <CredibilityBadge
            credibilityLabel={selectedItem.credibilityLabel}
            credibilityConfidence={selectedItem.credibilityConfidence}
          />
        </div>
      )}
    </div>

    {/* Description */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
      <p className="text-gray-900 dark:text-gray-100">{selectedItem.description || 'No description provided'}</p>
    </div>

    {/* Type, Severity, Status Grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
        <span className="inline-block px-3 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
          {selectedItem.alertType || selectedItem.resourceType || 'Unknown Type'}
        </span>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
        <span className={`inline-block px-3 py-1 rounded text-white ${getSeverityColor(selectedItem.severity)}`}>
          Level {selectedItem.severity}
        </span>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
        <span className="inline-block px-3 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
          {selectedItem.status}
        </span>
      </div>
    </div>

    {/* Location */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
      <p className="text-gray-900 dark:text-gray-100">
        📍 {selectedItem.latitude.toFixed(6)}, {selectedItem.longitude.toFixed(6)}
      </p>
    </div>

    {/* Reliability Score */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reliability Score</label>
      <p className="text-gray-900 dark:text-gray-100">{selectedItem.reliabilityScore || 0} votes</p>
    </div>

    {/* Nearest Resources Section (KNN Engine) */}
    <div className="mt-6 pt-5 border-t border-gray-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Nearby Resources</h3>
      {loadingNearestResources ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
          <span className="ml-2 text-sm text-gray-500">Finding nearby help...</span>
        </div>
      ) : nearestResources.length > 0 ? (
        <div className="space-y-3">
          {nearestResources.map(res => {
            const dist = res.distanceKm || res.distance;
            // Color coding by distance:
            let bgClass = "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
            let textClass = "text-green-700 dark:text-green-400";

            if (dist >= 5 && dist <= 15) {
              bgClass = "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
              textClass = "text-yellow-700 dark:text-yellow-400";
            } else if (dist > 15) {
              bgClass = "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
              textClass = "text-orange-700 dark:text-orange-400";
            }

            return (
              <div key={res.id} className={`p-4 border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${bgClass}`}>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{res.title}</h4>
                  <p className={`text-xs font-medium mt-1 ${textClass}`}>
                    {dist != null ? dist.toFixed(1) : '< 0.1'} km away
                  </p>
                </div>
                {res.contactInfo ? (
                  <button
                    className="shrink-0 px-4 py-2 bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-600 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-green-500 focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Contact: ${res.contactInfo}`);
                    }}
                  >
                    Contact: {res.contactInfo}
                  </button>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400 italic">No contact info</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl text-center border border-dashed border-gray-300 dark:border-slate-600">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 font-medium">No available resources found nearby.</p>
          <button
            onClick={() => {
               setSelectedItem(null);
               setSelectedItemType(null);
               setShowResourceModal(true);
            }}
            className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-green-700 hover:shadow transition-all focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Request Help / Create Resource
          </button>
        </div>
      )}
    </div>
  </>
)
```

**Nearest Resources Features:**

- **API Integration:** Calls `mlAPI.getNearestResources(lat, lng)` on alert selection
- **Distance Coloring:**
  - Green: < 5 km
  - Yellow: 5-15 km
  - Orange: > 15 km
- **Distance Display:** `res.distanceKm.toFixed(1) + ' km'`
- **Contact Button:** Displays `res.contactInfo` in alert dialog

#### For Resources:

```javascript
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
      <span className="inline-block px-3 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
        {selectedItem.status}
      </span>
    </div>
    {selectedItem.contactInfo && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Contact
        </label>
        <p className="text-gray-900 dark:text-gray-100">
          📞 {selectedItem.contactInfo}
        </p>
      </div>
    )}
  </div>

  {selectedItem.latitude && selectedItem.longitude && (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Location
      </label>
      <p className="text-gray-900 dark:text-gray-100">
        📍 {selectedItem.latitude.toFixed(6)},{" "}
        {selectedItem.longitude.toFixed(6)}
      </p>
    </div>
  )}
</>
```

### Recenter Button (FAB with Glassmorphism)

```javascript
<motion.button
  id="recenter-map-btn"
  onClick={handleRecenter}
  disabled={locationLoading}
  title={locationLoading ? 'Finding your location…' : 'Recenter map on your location'}
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.4 }}
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
    ${locationLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/90 dark:hover:bg-slate-800/90 cursor-pointer'}
  `}
>
```

**Features:**

- **Position:** Top-right corner with z-index 1000
- **Glassmorphism:** Semi-transparent with backdrop blur
- **States:**
  - Idle: Shows "My Location" with pulsing blue dot and MapPin icon
  - Loading: Shows "Locating…" with spinner
- **Animations:**
  - Entry: Slides in from right with spring physics
  - Hover: Scales up 1.08x, moves up 2px
  - Tap: Scales down to 0.94x
- **Disabled State:** 50% opacity when loading

### Recenter Animation Details

```javascript
{
  locationLoading ? (
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
  );
}
```

**Animation Details:**

- **Spinner State:**
  - Enter: Opacity 0→1, Rotate -90°→0°
  - Exit: Opacity 1→0, Rotate 0°→90°
  - Duration: 150ms
- **Idle State:**
  - Enter: Opacity 0→1, Rotate 90°→0°
  - Exit: Opacity 1→0, Rotate 0°→-90°
  - Shows pulsing dot with `animate-ping` class

### Modal Props Between Components

#### Dashboard → AlertCard

```javascript
<AlertCard
  key={alert.id}
  alert={alert} // Alert object with all properties
  onUpdate={fetchAlerts} // Function to refresh alerts
  onClick={() => {
    setSelectedItem(alert);
    setSelectedItemType("alert");
  }}
  onClickUser={(uid) => setSelectedReputationUserId(uid)} // Open reputation modal
/>
```

#### Dashboard → CreateAlertModal

```javascript
<CreateAlertModal
  onClose={() => setShowAlertModal(false)}
  onSuccess={handleAlertCreated}
/>
```

#### Dashboard → CreateResourceModal

```javascript
<CreateResourceModal
  onClose={() => setShowResourceModal(false)}
  onSuccess={handleResourceCreated}
/>
```

#### Dashboard → ReputationModal

```javascript
<ReputationModal
  userId={selectedReputationUserId}
  onClose={() => setSelectedReputationUserId(null)}
/>
```

#### Dashboard → AIChatbot

```javascript
<AIChatbot onAlertCreated={fetchAlerts} onResourceCreated={fetchResources} />
```

---

## 2. AlertCard.js

**File Location:** `frontend/src/components/AlertCard.js`

### Credibility Badge Configuration

```javascript
const CREDIBILITY_CONFIG = {
  CREDIBLE: {
    threshold: 0.7,
    icon: CheckCircle,
    label: "Credible",
    bg: "bg-emerald-100 dark:bg-emerald-900/50",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500/40",
    dot: "bg-emerald-500",
    tooltipBg: "bg-emerald-900",
    description:
      "ML classifier marked this alert as credible based on its content, posting history, and time of report.",
  },
  SUSPICIOUS: {
    threshold: 0.3,
    icon: ShieldAlert,
    label: "Suspicious",
    bg: "bg-amber-100 dark:bg-amber-900/50",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/40",
    dot: "bg-amber-500",
    tooltipBg: "bg-amber-900",
    description:
      "Classifier confidence is moderate. Verify before acting on this alert.",
  },
  SPAM: {
    threshold: 0.5,
    icon: ShieldX,
    label: "Spam",
    bg: "bg-rose-100 dark:bg-rose-900/50",
    text: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-500/40",
    dot: "bg-rose-500",
    tooltipBg: "bg-rose-900",
    description:
      "ML classifier flagged this as likely spam. Treat with high skepticism.",
  },
};
```

### resolveCredibility Function

```javascript
function resolveCredibility(label, confidence) {
  if (!label || confidence == null) return null;
  const cfg = CREDIBILITY_CONFIG[label.toUpperCase()];
  if (!cfg) return null;
  if (confidence < cfg.threshold) return null;
  return cfg;
}
```

**Purpose:** Determines if badge should display based on label and confidence threshold

- **Returns:** Config object if criteria met, null otherwise
- **Thresholds:**
  - CREDIBLE: confidence > 0.70
  - SUSPICIOUS: confidence >= 0.30
  - SPAM: confidence > 0.50

### CredibilityBadge Component

```javascript
export const CredibilityBadge = ({
  credibilityLabel,
  credibilityConfidence,
}) => {
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
      transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.1 }}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
      tabIndex={0}
      role="status"
      aria-label={`ML credibility: ${cfg.label} (${pct}% confidence)`}
    >
      {/* Badge pill with animated pulse dot, icon, label, percentage */}
      {/* Tooltip with description and confidence */}
    </motion.div>
  );
};
```

**Props:**

- `credibilityLabel` - String: 'CREDIBLE', 'SUSPICIOUS', or 'SPAM'
- `credibilityConfidence` - Number: 0-1 confidence score from ML classifier

**State:**

- `tooltipVisible` - Boolean: Show/hide tooltip on hover or focus

**Rendering:**

- Returns null if label is missing or confidence below threshold
- Animated badge with icon, label, and percentage
- Tooltip appears above badge with description and confidence details
- Spring entrance animation: opacity 0→1, scale 0.75→1 over 100ms

### AlertCard Component Props

```javascript
const AlertCard = ({ alert, onUpdate, onClick, onClickUser }) => {
```

**Props:**

- `alert` - Alert object with properties:
  - `id`, `title`, `description`
  - `alertType`, `severity`, `status`
  - `latitude`, `longitude`
  - `reliabilityScore`, `username`, `userId`
  - `credibilityLabel`, `credibilityConfidence` (ML fields)
  - `createdAt`, `updatedAt`
- `onUpdate` - Function callback to refresh alerts after vote
- `onClick` - Function callback when card is clicked (select for detail view)
- `onClickUser` - Function callback with user ID when username is clicked (open reputation modal)

### AlertCard Component State

```javascript
const [voting, setVoting] = useState(false); // Voting in progress
const [isHovered, setIsHovered] = useState(false); // Card hover state for overlay effect
```

### AlertCard Functions

#### handleVote(isUpvote, e)

```javascript
const handleVote = async (isUpvote, e) => {
  e.stopPropagation();
  if (voting) return;

  setVoting(true);
  try {
    await alertAPI.vote(alert.id, isUpvote);
    onUpdate();
  } catch (error) {
    console.error("Error voting:", error);
  } finally {
    setVoting(false);
  }
};
```

**Purpose:** Handle upvote/downvote on alert

- **Parameters:**
  - `isUpvote` - Boolean: true for upvote, false for downvote
  - `e` - Event object to stop propagation
- **Side Effects:**
  - Calls `alertAPI.vote(alertId, isUpvote)`
  - Calls `onUpdate()` callback to refresh
  - Sets voting state

#### getSeverityColor(severity)

```javascript
const getSeverityColor = (severity) => {
  const colors = {
    1: "from-blue-500 to-blue-600",
    2: "from-yellow-500 to-yellow-600",
    3: "from-orange-500 to-orange-600",
    4: "from-red-500 to-red-600",
    5: "from-purple-500 to-purple-600",
  };
  return colors[severity] || "from-gray-500 to-gray-600";
};
```

**Purpose:** Returns Tailwind gradient colors for severity level

#### getSeverityBadge(severity)

```javascript
const getSeverityBadge = (severity) => {
  const badges = {
    1: {
      text: "Low",
      bg: "bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-200",
    },
    2: {
      text: "Moderate",
      bg: "bg-yellow-100  text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
    3: {
      text: "High",
      bg: "bg-orange-100  text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    },
    4: {
      text: "Critical",
      bg: "bg-red-100     text-red-800    dark:bg-red-900    dark:text-red-200",
    },
    5: {
      text: "Extreme",
      bg: "bg-purple-100  text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    },
  };
  return badges[severity] || badges[1];
};
```

**Purpose:** Returns badge object with text and Tailwind classes for severity level

#### formatDate(dateString)

```javascript
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000 / 60);

  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};
```

**Purpose:** Format timestamp as relative time

- **Returns:**
  - "Just now" - less than 1 minute
  - "Xm ago" - less than 60 minutes
  - "Xh ago" - less than 1440 minutes (24 hours)
  - "Xd ago" - days

### AlertCard Rendering

**Card Container:**

```javascript
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
```

**Animations:**

- **Entry:** Fade in (opacity 0→1) + slide up (y: 20→0) over 300ms
- **Hover:** Move up 4px (y: -4)
- **Visual Feedback:** Red ring on high-priority alerts (severity >= 4)

**Severity Gradient Bar:**

```javascript
<div
  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getSeverityColor(alert.severity)}`}
/>
```

**High Priority Pulse Indicator:**

```javascript
{
  isHighPriority && (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="absolute top-3 right-3"
    >
      <AlertTriangle className="w-5 h-5 text-red-500" />
    </motion.div>
  );
}
```

**Metadata Row:**

```javascript
<div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
  {/* Severity Badge */}
  <span className={`badge ${severityBadge.bg} font-semibold`}>
    {severityBadge.text}
  </span>

  {/* Alert Type */}
  <div className="flex items-center bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
    <MapPin className="w-3 h-3 mr-1" />
    <span className="font-medium">{alert.alertType}</span>
  </div>

  {/* Timestamp */}
  <div className="flex items-center bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
    <Clock className="w-3 h-3 mr-1" />
    <span>{formatDate(alert.createdAt)}</span>
  </div>

  {/* ML Credibility Badge */}
  <CredibilityBadge
    credibilityLabel={credibilityLabel}
    credibilityConfidence={credibilityConfidence}
  />
</div>
```

**Actions Row:**

```javascript
<div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
  <div className="flex items-center space-x-1">
    {/* Upvote Button */}
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

    {/* Downvote Button */}
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={(e) => handleVote(false, e)}
      disabled={voting}
      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-all disabled:opacity-50 group"
    >
      <ThumbsDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
    </motion.button>

    {/* Verified Badge */}
    {alert.reliabilityScore > 5 && (
      <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
          Verified
        </span>
      </div>
    )}
  </div>

  {/* Creator Info */}
  <div className="flex items-center space-x-2">
    <span className="text-xs text-gray-500 dark:text-gray-400">
      by{" "}
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
```

**Vote Buttons:**

- Upvote: Green button with ThumbsUp icon and score
- Downvote: Red button with ThumbsDown icon
- Both disabled during voting request
- Verified badge appears if reliabilityScore > 5

---

## 3. Map Implementation Summary

### Library Used

**React-Leaflet + Leaflet** (not Google Maps)

### Map Container

```javascript
<MapContainer
  center={mapCenter} // [latitude, longitude]
  zoom={12} // Zoom level
  className="h-full w-full"
>
  <MapCenterController center={mapCenter} />
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  {/* Markers and popups */}
</MapContainer>
```

### Map Control - setView Usage

```javascript
// In MapCenterController component
map.setView(center, 12, {
  animate: true,
  duration: 1,
});
```

**Method Signature:** `map.setView(latLng, zoom, options)`

- **Parameters:**
  - `center` - [latitude, longitude]
  - `12` - zoom level
  - `options` - `{ animate: true, duration: 1 }` - smooth 1-second animation

### Marker Click Handlers

```javascript
eventHandlers={{
  click: () => {
    setSelectedItem(alert);
    setSelectedItemType('alert');
  }
}}
```

**No Explicit flyTo/panTo:**

- Map recentering done via MapCenterController's `setView()`
- Not using flyTo (which would be for dramatic zoomed transitions)
- setView with animate=true provides smooth panning

### Map Reference

- **Via useMap Hook:** `const map = useMap();` in MapCenterController
- **Not stored in ref:** No useRef for map instance in main Dashboard component
- **Used for:** Calling `setView()` only, not for other operations

---

## 4. Component Hierarchy & Props Flow

```
Dashboard (main container)
├── Header with stats buttons
├── Sidebar (left)
│   ├── Search/Filter bar
│   ├── Tabs: Alerts | Resources
│   └── Content (scrollable)
│       ├── AlertCard[] (when activeTab === 'alerts')
│       │   └── Props: { alert, onUpdate, onClick, onClickUser }
│       └── Resource items[] (when activeTab === 'resources')
│
├── Map View (right)
│   ├── MapContainer (Leaflet)
│   │   ├── MapCenterController
│   │   ├── TileLayer (OpenStreetMap)
│   │   ├── Marker[] (alerts - red)
│   │   ├── Marker[] (resources - green)
│   │   └── Marker (user location - blue)
│   └── Recenter FAB button (top-right)
│
├── Detail Modal (overlay)
│   ├── Alert details view
│   │   └── Nearby Resources section (from KNN API)
│   └── Resource details view
│
└── Child Modals
    ├── CreateAlertModal
    ├── CreateResourceModal
    ├── ReputationModal
    └── AIChatbot
```

---

## 5. Resources NOT Found

- **ResourceCard.js** - Does NOT exist
  - Resources rendered inline in Dashboard.js as `<motion.div>` components
  - Not extracted into separate component
- **Separate map file** - Does NOT exist
  - Map entirely contained in Dashboard.js
  - Uses MapContainer directly

- **Google Maps** - NOT used
  - Using React-Leaflet + Leaflet (OpenStreetMap)
  - OpenStreetMap is free, no API key required

---

## 6. Key Integration Points

### ML Services Integration

- **getNearestResources(lat, lng)** - Fetches nearby resources when alert selected
  - Returns top 3 with `distanceKm` field
  - Color-coded display: green (<5km), yellow (5-15km), orange (>15km)

### State Management (Context API)

- **AuthContext** - `user`, `logout` functions
- **ThemeContext** - `darkMode`, `toggleTheme` functions

### API Services

- **alertAPI** - `getAll()`, `vote()`, `delete()`
- **resourceAPI** - `getAll()`, `delete()`
- **mlAPI** - `getNearestResources()`

### Notifications

- **react-hot-toast** - `toast.success()`, `toast.error()`, `toast.loading()`

### Animations

- **Framer Motion** - `motion.*`, `AnimatePresence`, spring animations
