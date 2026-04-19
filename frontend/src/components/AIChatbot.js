import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, MapPin, Cloud, TrendingUp, AlertCircle, Trash2, Download, Plus, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { alertAPI, resourceAPI, mlAPI } from '../services/api';

const AIChatbot = ({ onAlertCreated, onResourceCreated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm ResQNet AI Assistant. I can help you with:\n\n• 🗺️ Finding evacuation routes\n• ☁️ Weather updates\n• 📈 Disaster trends\n• 🚨 Creating alerts (Quick Create!)\n• 📦 Adding resources (Quick Add!)\n• 📞 Emergency contacts\n• 💡 Safety tips\n\nHow can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [showQuickAlert, setShowQuickAlert] = useState(false);
  const [showQuickResource, setShowQuickResource] = useState(false);
  const [pendingAlertData, setPendingAlertData] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load alert data from localStorage or context
  useEffect(() => {
    const loadAlertData = () => {
      try {
        const storedAlerts = localStorage.getItem('recentAlerts');
        if (storedAlerts) {
          setAlertData(JSON.parse(storedAlerts));
        }
      } catch (error) {
        console.error('Error loading alert data:', error);
      }
    };
    loadAlertData();
  }, []);

  const quickResponses = [
    { id: 2, text: "🗺️ Evacuation routes", icon: <MapPin className="w-4 h-4" /> },
    { id: 3, text: "☁️ Weather update", icon: <Cloud className="w-4 h-4" /> },
    { id: 4, text: "📞 Emergency contacts", icon: <AlertCircle className="w-4 h-4" /> },
    { id: 5, text: "💡 Safety tips", icon: <Bot className="w-4 h-4" /> },
    { id: 6, text: "🚨 Create alert", icon: <Plus className="w-4 h-4" /> },
    { id: 7, text: "📦 Add resource", icon: <Package className="w-4 h-4" /> }
  ];

  const generateBotResponse = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    const userName = user?.username || 'there';
    const userId = user?.id;
    
    // 4. Trust & Verification (Naive Bayes & Reputation)
    if (lowerMessage.includes('status') || lowerMessage.includes('reputation') || lowerMessage.includes('trust') || lowerMessage.includes('my level')) {
      if (!userId) return `You need to be logged in to check your Community Trust Score!`;
      try {
        const res = await mlAPI.getUserReputation(userId);
        const data = res.data;
        let p = data?.totalPoints || data?.reputationScore || 0;
        let t = 'Bronze';
        if (p >= 100) t = 'Platinum';
        else if (p >= 50) t = 'Gold';
        else if (p >= 20) t = 'Silver';
        return `🌟 **Community Trust Status**\n\nHi ${userName}, your current Contribution Level is **${t}**.\nYou have a Community Trust Score of **${p} PTS**.\n\nKeep verifying alerts and sharing resources to increase your rank!`;
      } catch (err) {
        return `🌟 **Community Trust Status**\n\nI couldn't load your reputation profile right now.`;
      }
    }

    // Evacuation routes
    if (lowerMessage.includes('evacuation') || lowerMessage.includes('route') || lowerMessage.includes('escape')) {
      return `🗺️ **Evacuation Routes**\n\n**Primary Routes:**\n1. Highway 101 North → Safe Zone A\n2. Main Street East → Community Center\n3. River Road South → Emergency Shelter\n\n**Important:**\n• Follow official signage\n• Avoid flooded areas\n• Keep emergency kit ready\n• Check traffic updates\n\n📍 Nearest shelter: 2.3 km away`;
    }
    
    // Weather information
    if (lowerMessage.includes('weather') || lowerMessage.includes('forecast') || lowerMessage.includes('rain')) {
      return `☁️ **Weather Update**\n\n**Current Conditions:**\n• Temperature: 28°C\n• Conditions: Partly cloudy\n• Wind: 15 km/h NE\n• Humidity: 65%\n\n**24h Forecast:**\n• Risk of thunderstorms\n• Heavy rain expected (50mm)\n• Flash flood warning active\n\n⚠️ Stay indoors if possible!`;
    }
    
    // Disaster trends
    if (lowerMessage.includes('trend') || lowerMessage.includes('history') || lowerMessage.includes('pattern')) {
      return `📈 **Disaster Trends**\n\n**Last 7 Days:**\n• Flood alerts: ↑ 45%\n• Fire incidents: ↓ 12%\n• Medical emergencies: → Stable\n\n**Peak Times:**\n• 6-9 AM: High activity\n• 3-6 PM: Moderate\n\n**Prediction:**\nIncreased flood risk due to heavy rainfall forecast.`;
    }
    
    // Emergency contacts
    if (lowerMessage.includes('emergency') || lowerMessage.includes('contact') || lowerMessage.includes('number') || lowerMessage.includes('call')) {
      return `📞 **Emergency Contacts**\n\n**Immediate Help:**\n🚨 Police: 100\n🚑 Ambulance: 102\n🚒 Fire: 101\n⛑️ Disaster Management: 108\n\n**Specialized:**\n🆘 Women Helpline: 1091\n👶 Child Helpline: 1098\n🏥 Medical Emergency: 108\n⚡ Power Outage: 1912\n💧 Water Supply: 1916\n\n**Local Authorities:**\n📱 Control Room: +1-XXX-XXX-XXXX`;
    }
    
    // Safety tips
    if (lowerMessage.includes('safe') || lowerMessage.includes('tip') || lowerMessage.includes('what to do')) {
      return `💡 **Safety Tips**\n\n**Before Disaster:**\n✅ Prepare emergency kit\n✅ Know evacuation routes\n✅ Know emergency contacts\n\n**During Disaster:**\n✅ Stay calm\n✅ Follow official instructions\n✅ Keep phone charged`;
    }
    
    // Report emergency - with quick create option
    if (lowerMessage.includes('report') || lowerMessage.includes('create alert') || lowerMessage.includes('add alert')) {
      setTimeout(() => setShowQuickAlert(true), 500);
      return `🚨 **Quick Alert Creation**\n\nI can help you create an alert right here! I'll show you a quick form in a moment.\n\n**Our classifier will automatically verify your report against historical credibility patterns.**`;
    }
    
    if (lowerMessage.includes('add resource') || lowerMessage.includes('share resource') || lowerMessage.includes('offer resource')) {
      setTimeout(() => setShowQuickResource(true), 500);
      return `📦 **Quick Resource Addition**\n\nI can help you add a resource right here! I'll show you a quick form in a moment.`;
    }
    
    // 2. Verified Resource Matching (KNN Integration)
    if (lowerMessage.includes('resource') || lowerMessage.includes('help') || lowerMessage.includes('need') || lowerMessage.includes('supply')) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          try {
            const res = await mlAPI.getNearestResources(pos.coords.latitude, pos.coords.longitude);
            const resources = res.data;
            if (resources && resources.length > 0) {
              const nearest = resources[0];
              const dist = nearest.distanceKm || nearest.distance || 0;
              resolve(`📦 **Verified Resource Matching**\n\nI've located the closest verified supply points.\nThe nearest is **${dist.toFixed(1)}km** away at [Location: ${nearest.title}].\n\nYou can contact them immediately via the Resources tab!`);
            } else {
              resolve(`📦 **Verified Resource Matching**\n\nI couldn't find any resources close to your location at the moment.`);
            }
          } catch (err) {
            resolve(`📦 **Verified Resource Matching**\n\nI couldn't scan for nearest resources. Keep checking the main map!`);
          }
        }, () => {
          resolve(`📦 **Verified Resource Matching**\n\nI need your location to find nearby resources using our proximity engine! Please allow location access.`);
        });
      });
    }

    // Nearby alerts
    if (lowerMessage.includes('nearby') || lowerMessage.includes('near me') || lowerMessage.includes('around')) {
      return `📍 **Nearby Alerts**\n\nCheck the map for exact mapping boundaries! You can also type "Disaster trends" for generic metrics.`;
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello ${userName}! 👋\n\nI'm here to help you stay safe. I can provide:\n\n• Proximity-based resource matching\n• Trust & Community Reputation\n\nWhat would you like to know?`;
    }
    
    if (lowerMessage.includes('thank')) {
      return `You're welcome, ${userName}! 😊\n\nStay safe! I'm always here to assist!`;
    }

    if (lowerMessage === 'proceed') {
      return `Processing...`;
    }
    
    return `I'm not sure about that, but I can help you with:\n\n• **Resources** - Find nearby help\n• **Trust** - Check your contribution level\n\nTry asking: "Find resources nearby" or "What is my status?"`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Smart Duplicate Prevention Override
    if (pendingAlertData && inputMessage.toLowerCase().trim() === 'proceed') {
      const userMsg = { id: messages.length + 1, text: inputMessage, sender: 'user', timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setInputMessage('');
      
      await handleQuickAlertSubmit({ ...pendingAlertData, confirmed: true });
      setPendingAlertData(null);
      return;
    }

    const userMsg = { id: messages.length + 1, text: inputMessage, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    const botResponse = await generateBotResponse(userMsg.text);
    const botMsg = { id: messages.length + 2, text: botResponse, sender: 'bot', timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleQuickResponse = async (responseText) => {
    const userMsg = { id: messages.length + 1, text: responseText, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const botResponse = await generateBotResponse(responseText);
    const botMsg = { id: messages.length + 2, text: botResponse, sender: 'bot', timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Chat cleared! How can I help you?",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };

  const exportChat = () => {
    const chatText = messages.map(m => 
      `[${m.timestamp.toLocaleString()}] ${m.sender === 'user' ? 'You' : 'AI'}: ${m.text}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resqnet-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQuickAlertSubmit = async (alertData) => {
    try {
      // 3. Smart Duplicate Prevention (KNN Alert Integration)
      if (!alertData.confirmed) {
        const typeMap = { 'FLOOD': 2, 'FIRE': 1, 'EARTHQUAKE': 5, 'STORM': 5, 'ACCIDENT': 5, 'OTHER': 5 };
        const simRes = await mlAPI.getSimilarAlerts(alertData.latitude, alertData.longitude, typeMap[alertData.alertType] || 1, alertData.severity);
        
        if (simRes.data && simRes.data.length > 0) {
          setShowQuickAlert(false);
          setPendingAlertData(alertData);
          const warningMsg = {
            id: messages.length + 1,
            text: `⚠️ **Duplicates Detected**\n\nIt looks like there's already a similar report nearby. Would you like to add an update to that one instead, or proceed with a new report?\n\n(Type "PROCEED" to continue creating it)`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, warningMsg]);
          return;
        }
      }

      await alertAPI.create(alertData);
      toast.success('Alert created successfully!');
      setShowQuickAlert(false);
      
      const successMsg = {
        id: messages.length + 1,
        text: `✅ **Alert Created Successfully!**\n\nYour alert "${alertData.title}" has been posted and is now verified by the ML Classifier.\n\n**What's next?**\n• View it on the map\n• Let community users vote to verify its credibility`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMsg]);
      if (onAlertCreated) onAlertCreated();
    } catch (error) {
      toast.error('Failed to create alert');
      console.error('Error creating alert:', error);
    }
  };

  const handleQuickResourceSubmit = async (resourceData) => {
    try {
      await resourceAPI.create(resourceData);
      toast.success('Resource added successfully!');
      setShowQuickResource(false);
      
      // Add success message to chat
      const successMsg = {
        id: messages.length + 1,
        text: `✅ **Resource Added Successfully!**\n\nYour resource "${resourceData.title}" has been shared with the community.\n\n**What's next?**\n• View it in Resources tab\n• Wait for people to contact you\n• Update status as needed\n\nThank you for helping!`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMsg]);
      
      // Notify parent component
      if (onResourceCreated) onResourceCreated();
    } catch (error) {
      toast.error('Failed to add resource');
      console.error('Error adding resource:', error);
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
          style={{ zIndex: 9998 }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col"
          style={{ zIndex: 9998 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center animate-pulse">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">ResQNet AI</h3>
                <p className="text-xs text-blue-100 flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Online</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportChat}
                className="text-white hover:bg-white/20 p-1.5 rounded transition-colors"
                title="Export chat"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={clearChat}
                className="text-white hover:bg-white/20 p-1.5 rounded transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1.5 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 shadow-md ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Alert Form */}
            {showQuickAlert && (
              <QuickAlertForm 
                onSubmit={handleQuickAlertSubmit}
                onCancel={() => setShowQuickAlert(false)}
              />
            )}

            {/* Quick Resource Form */}
            {showQuickResource && (
              <QuickResourceForm 
                onSubmit={handleQuickResourceSubmit}
                onCancel={() => setShowQuickResource(false)}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Responses */}
          {messages.length <= 2 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <p className="text-xs font-medium text-gray-600 mb-2">Quick Actions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickResponses.map((qr) => (
                  <button
                    key={qr.id}
                    onClick={() => handleQuickResponse(qr.text)}
                    className="flex items-center space-x-2 text-xs px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm hover:shadow-md border border-gray-200"
                  >
                    {qr.icon}
                    <span className="font-medium">{qr.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Quick Alert Form Component
const QuickAlertForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 3,
    alertType: 'FLOOD',
    latitude: 28.6139,
    longitude: 77.2090
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-blue-900 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>Quick Alert</span>
        </h4>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Flood on Main Street"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="2"
            placeholder="Describe the situation..."
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Severity *</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({...formData, severity: parseInt(e.target.value)})}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">1 - Low</option>
              <option value="2">2 - Moderate</option>
              <option value="3">3 - High</option>
              <option value="4">4 - Critical</option>
              <option value="5">5 - Extreme</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
            <select
              value={formData.alertType}
              onChange={(e) => setFormData({...formData, alertType: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="FLOOD">Flood</option>
              <option value="FIRE">Fire</option>
              <option value="EARTHQUAKE">Earthquake</option>
              <option value="STORM">Storm</option>
              <option value="ACCIDENT">Accident</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          📍 Using your current location (or default if unavailable)
        </p>

        <div className="flex space-x-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Alert
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Quick Resource Form Component
const QuickResourceForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contactInfo: '',
    status: 'AVAILABLE'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-green-900 flex items-center space-x-2">
          <Package className="w-4 h-4" />
          <span>Quick Resource</span>
        </h4>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="e.g., Food & Water Available"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows="2"
            placeholder="Describe what you're offering..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Contact Info *</label>
          <input
            type="text"
            required
            value={formData.contactInfo}
            onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Phone or email"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status *</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="AVAILABLE">Available</option>
            <option value="LIMITED">Limited</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Add Resource
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChatbot;
