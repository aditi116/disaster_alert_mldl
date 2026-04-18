import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { alertAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const ALERT_TYPES = [
  { id: 1, name: 'fire', label: 'Fire' },
  { id: 2, name: 'flood', label: 'Flood' },
  { id: 3, name: 'medical', label: 'Medical Emergency' },
  { id: 4, name: 'power', label: 'Power Outage' },
  { id: 5, name: 'other', label: 'Other' },
];

// Component to handle map clicks
const LocationSelector = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      console.log('Map clicked at:', e.latlng);
      const newPosition = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? <Marker position={position} /> : null;
};

const CreateAlertModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    alertTypeId: 1,
    severity: 3,
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'alertTypeId' || name === 'severity' ? parseInt(value) : 
              name === 'latitude' || name === 'longitude' ? parseFloat(value) : value
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }));
          setMapPosition([lat, lng]);
        },
        (error) => {
          setError('Unable to get your location. Please enter manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleMapPositionChange = (position) => {
    console.log('Position changed to:', position);
    setMapPosition(position);
    setFormData(prev => ({
      ...prev,
      latitude: position[0],
      longitude: position[1],
    }));
  };

  const toggleMap = () => {
    setShowMap(!showMap);
    if (!showMap && !mapPosition && formData.latitude && formData.longitude) {
      setMapPosition([formData.latitude, formData.longitude]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await alertAPI.create(formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Create New Alert</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the incident"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide more details about the incident"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Type *
              </label>
              <select
                name="alertTypeId"
                required
                value={formData.alertTypeId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {ALERT_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity (1-5) *
              </label>
              <input
                type="number"
                name="severity"
                required
                min="1"
                max="5"
                value={formData.severity}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Location *
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Use current location
                </button>
                <button
                  type="button"
                  onClick={toggleMap}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{showMap ? 'Hide map' : 'Pick on map'}</span>
                </button>
              </div>
            </div>
            
            {showMap && (
              <div className="mb-4">
                <div className="h-64 rounded-lg overflow-hidden border border-gray-300 relative z-0">
                  <MapContainer
                    key="alert-map"
                    center={mapPosition || [37.7749, -122.4194]}
                    zoom={13}
                    className="h-full w-full"
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationSelector position={mapPosition} setPosition={handleMapPositionChange} />
                  </MapContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💡 Click anywhere on the map to set the alert location
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                name="latitude"
                required
                step="any"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Latitude"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                name="longitude"
                required
                step="any"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Longitude"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlertModal;
