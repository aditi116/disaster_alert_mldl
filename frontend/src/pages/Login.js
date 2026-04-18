import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Shield, User, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Background gradient animation
const BackgroundDots = () => {
  const dots = Array(20).fill(0);
  return (
    <div className="fixed inset-0 overflow-hidden">
      {dots.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-blue-200 dark:bg-blue-900/30"
          style={{
            width: Math.random() * 100 + 100,
            height: Math.random() * 100 + 100,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.2,
            filter: 'blur(40px)'
          }}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

const InputField = ({ icon: Icon, label, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="relative"
  >
    <label 
      htmlFor={props.id} 
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        {...props}
        className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
      />
    </div>
  </motion.div>
);

const AnimatedButton = ({ children, loading, ...props }) => (
  <motion.button
    whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}
    whileTap={{ scale: 0.98 }}
    disabled={loading}
    className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    {...props}
  >
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.span
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center"
        >
          <Loader2 className="animate-spin h-5 w-5 mr-2" />
          Signing in...
        </motion.span>
      ) : (
        <motion.span
          key="default"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center"
        >
          <Shield className="w-5 h-5 mr-2" />
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  </motion.button>
);

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);
    
    if (result.success) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (isMounted) {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <BackgroundDots />
      
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            ResQNet
          </h1>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Sign in to your disaster management dashboard
          </p>
        </motion.div>
        
        <motion.div 
          className={`rounded-2xl shadow-xl p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <AnimatePresence>
            {error && (
              <motion.div 
                className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 flex items-start"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <InputField
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                label="Username"
                icon={User}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <InputField
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                label="Password"
                icon={Lock}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <AnimatedButton loading={loading} type="submit">
                Sign In
              </AnimatedButton>
            </motion.div>
          </form>
          
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200"
>
                Register here
              </Link>
            </p>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1 }}
        >
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Secure access to your disaster management dashboard
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
