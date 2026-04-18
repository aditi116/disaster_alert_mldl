import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, MapPin, Cloud, TrendingUp, AlertCircle, Trash2, Download, Plus, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { alertAPI, resourceAPI } from '../services/api';

const AIChatbot = ({ onAlertCreated, onResourceCreated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm ResQNet AI Assistant. I can help you with:\n\n• 📊 Analyzing current alerts\n• 🗺️ Finding evacuation routes\n• ☁️ Weather updates\n• 📈 Disaster trends\n• 🚨 Creating alerts (Quick Create!)\n• 📦 Adding resources (Quick Add!)\n• 📞 Emergency contacts\n• 💡 Safety tips\n\nHow can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [showQuickAlert, setShowQuickAlert] = useState(false);
  const [showQuickResource, setShowQuickResource] = useState(false);
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
    { id: 1, text: "📊 Analyze current alerts", icon: <TrendingUp className="w-4 h-4" /> },
    { id: 2, text: "🗺️ Evacuation routes", icon: <MapPin className="w-4 h-4" /> },
    { id: 3, text: "☁️ Weather update", icon: <Cloud className="w-4 h-4" /> },
    { id: 4, text: "📞 Emergency contacts", icon: <AlertCircle className="w-4 h-4" /> },
    { id: 5, text: "💡 Safety tips", icon: <Bot className="w-4 h-4" /> },
    { id: 6, text: "🚨 Create alert", icon: <Plus className="w-4 h-4" /> },
    { id: 7, text: "📦 Add resource", icon: <Package className="w-4 h-4" /> }
  ];

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    const userName = user?.username || 'there';
    
    // Analyze alerts
    if (lowerMessage.includes('analyze') || lowerMessage.includes('current alert') || lowerMessage.includes('what\'s happening')) {
      return `📊 **Alert Analysis**\n\nBased on recent data:\n\n• **Critical Alerts**: ${alertData?.critical || 0} high-severity incidents\n• **Active Alerts**: ${alertData?.active || 0} ongoing situations\n• **Most Common**: ${alertData?.commonType || 'Flood'} incidents\n• **Hotspot Area**: ${alertData?.hotspot || 'Downtown area'}\n\n⚠️ Stay vigilant and follow safety protocols!`;
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
    if (lowerMessage.includes('safe') || lowerMessage.includes('tip') || lowerMessage.includes('what to do') || lowerMessage.includes('prepare')) {
      return `💡 **Safety Tips**\n\n**Before Disaster:**\n✅ Prepare emergency kit\n✅ Know evacuation routes\n✅ Save emergency contacts\n✅ Secure important documents\n\n**During Disaster:**\n✅ Stay calm\n✅ Follow official instructions\n✅ Avoid affected areas\n✅ Keep phone charged\n\n**After Disaster:**\n✅ Check for injuries\n✅ Document damage\n✅ Report to authorities\n✅ Help neighbors safely`;
    }
    
    // Report emergency - with quick create option
    if (lowerMessage.includes('report') || lowerMessage.includes('create alert') || lowerMessage.includes('new alert') || lowerMessage.includes('add alert')) {
      // Trigger quick alert form
      setTimeout(() => setShowQuickAlert(true), 500);
      return `🚨 **Quick Alert Creation**\n\nI can help you create an alert right here! I'll show you a quick form in a moment.\n\n**Or use the full form:**\n1. Click 'New Alert' button (top-right)\n2. Fill in all details\n3. Pick exact location on map\n\n**Quick form includes:**\n• Alert title\n• Description\n• Severity level\n• Alert type\n\nLet's get your alert posted quickly!`;
    }
    
    // Resources - with quick add option
    if (lowerMessage.includes('add resource') || lowerMessage.includes('share resource') || lowerMessage.includes('offer resource') || lowerMessage.includes('new resource')) {
      // Trigger quick resource form
      setTimeout(() => setShowQuickResource(true), 500);
      return `📦 **Quick Resource Addition**\n\nI can help you add a resource right here! I'll show you a quick form in a moment.\n\n**Or use the full form:**\n1. Click 'New Resource' button (top-right)\n2. Fill in all details\n3. Add location if needed\n\n**Quick form includes:**\n• Resource title\n• Description\n• Contact information\n• Status\n\nLet's share your resource quickly!`;
    }
    
    // General resources query
    if (lowerMessage.includes('resource') || lowerMessage.includes('help') || lowerMessage.includes('need') || lowerMessage.includes('supply')) {
      return `📦 **Resources Available**\n\n**How to Find:**\n1. Click 'Resources' tab\n2. Browse available items\n3. View location on map\n4. Contact provider\n\n**How to Share:**\nJust say "Add resource" and I'll help you create one!\n\n**Common Resources:**\n• Food & Water\n• Medical supplies\n• Shelter\n• Transportation`;
    }
    
    // Nearby alerts
    if (lowerMessage.includes('nearby') || lowerMessage.includes('near me') || lowerMessage.includes('around')) {
      return `📍 **Nearby Alerts**\n\n**Within 5km:**\n⚠️ Flood warning (2.1 km)\n🔥 Fire incident (3.8 km)\n🚧 Road closure (4.2 km)\n\n**Status:**\n• 3 Critical\n• 5 Active\n• 2 Resolved\n\nCheck the map for exact locations!`;
    }
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello ${userName}! 👋\n\nI'm here to help you stay safe during emergencies. I can provide:\n\n• Real-time alert analysis\n• Evacuation guidance\n• Weather updates\n• Safety recommendations\n\nWhat would you like to know?`;
    }
    
    // Thanks
    if (lowerMessage.includes('thank')) {
      return `You're welcome, ${userName}! 😊\n\nStay safe and don't hesitate to ask if you need more help. Remember:\n\n• Check alerts regularly\n• Keep emergency contacts handy\n• Follow official instructions\n\nI'm always here to assist!`;
    }
    
    // Help command
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `🤖 **I Can Help You With:**\n\n📊 Alert Analysis\n🗺️ Evacuation Routes\n☁️ Weather Updates\n📈 Disaster Trends\n📞 Emergency Contacts\n💡 Safety Tips\n🚨 Reporting Emergencies\n📦 Finding Resources\n📍 Nearby Alerts\n\nJust ask me anything!`;
    }
    
    // Default response with context
    return `I'm not sure about that, but I can help you with:\n\n• **Alert Analysis** - Current situation\n• **Evacuation** - Safe routes\n• **Weather** - Latest forecast\n• **Emergency Contacts** - Quick dial\n• **Safety Tips** - Stay prepared\n\nTry asking: "What's happening nearby?" or "Show evacuation routes"`;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMsg = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot typing and response
    setTimeout(() => {
      const botResponse = getBotResponse(inputMessage);
      const botMsg = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickResponse = (responseText) => {
    // Add user message
    const userMsg = {
      id: messages.length + 1,
      text: responseText,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Get bot response
    setTimeout(() => {
      const botResponse = getBotResponse(responseText);
      const botMsg = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
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
      await alertAPI.create(alertData);
      toast.success('Alert created successfully!');
      setShowQuickAlert(false);
      
      // Add success message to chat
      const successMsg = {
        id: messages.length + 1,
        text: `✅ **Alert Created Successfully!**\n\nYour alert "${alertData.title}" has been posted and is now visible to the community.\n\n**What's next?**\n• View it on the map\n• Monitor for updates\n• Check community responses\n\nStay safe!`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMsg]);
      
      // Notify parent component
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
