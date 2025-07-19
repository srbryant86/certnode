import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Area, AreaChart 
} from 'recharts';
import { 
  Shield, CheckCircle, Clock, AlertTriangle, FileText, BarChart3, Settings, 
  LogOut, Key, Download, Upload, Users, CreditCard, Eye, EyeOff, Copy, 
  RefreshCw, Search, Filter, ChevronDown, ChevronUp, ExternalLink,
  Lock, Unlock, AlertCircle, Info, TrendingUp, Activity, Database,
  Server, Globe, Zap, Award, Star, Target, Layers, Code, Terminal
} from 'lucide-react';

// Production Configuration
const CONFIG = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'https://api.certnode.io',
  WS_URL: process.env.REACT_APP_WS_URL || 'wss://api.certnode.io/ws',
  ENVIRONMENT: process.env.NODE_ENV || 'production',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
  STRIPE_PUBLISHABLE_KEY: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log to monitoring service
    if (CONFIG.SENTRY_DSN) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">System Error</h1>
            </div>
            <p className="text-gray-600 mb-4">
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Authentication Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API Service
class APIService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.token = localStorage.getItem('certnode_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('certnode_token', token);
    } else {
      localStorage.removeItem('certnode_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.access_token);
    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(response.access_token);
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getProfile() {
    return this.request('/profile');
  }

  // Certification methods
  async createCertification(data) {
    return this.request('/certifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCertifications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/certifications?${queryString}`);
  }

  async getCertification(id) {
    return this.request(`/certifications/${id}`);
  }

  // Billing methods
  async getBillingInfo() {
    return this.request('/billing');
  }

  async createPaymentIntent(amount) {
    return this.request('/billing/payment-intent', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async updateSubscription(tier) {
    return this.request('/billing/subscription', {
      method: 'PUT',
      body: JSON.stringify({ tier }),
    });
  }
}

const apiService = new APIService();

// WebSocket Hook
const useWebSocket = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING);

  useEffect(() => {
    if (!url) return;

    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setReadyState(WebSocket.OPEN);
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      setLastMessage(JSON.parse(event.data));
    };

    ws.onclose = () => {
      setReadyState(WebSocket.CLOSED);
      setSocket(null);
    };

    ws.onerror = () => {
      setReadyState(WebSocket.CLOSED);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback((message) => {
    if (socket && readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket, readyState]);

  return { lastMessage, readyState, sendMessage };
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('certnode_token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await apiService.getProfile();
      setUser(userData);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setError(error.message);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await apiService.login(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await apiService.register(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshProfile: fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Loading Component
const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
};

// Toast Notification System
const ToastContext = createContext();

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value = { addToast, removeToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  return (
    <div className={`px-4 py-3 rounded-md shadow-lg max-w-sm ${typeStyles[toast.type]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{toast.message}</span>
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-3 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Login Component
const LoginForm = ({ onToggleMode }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(credentials);
      addToast('Login successful', 'success');
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            CertNode T17+
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Logic Governance Infrastructure
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Register Component
const RegisterForm = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    organization: '',
    tier: 'individual'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      addToast('Registration successful', 'success');
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const tierOptions = [
    { value: 'individual', label: 'Individual - $29/month', description: '50 certifications, 1K API calls' },
    { value: 'professional', label: 'Professional - $99/month', description: '250 certifications, 10K API calls' },
    { value: 'institutional', label: 'Institutional - $299/month', description: '1K certifications, 100K API calls' },
    { value: 'enterprise', label: 'Enterprise - $999/month', description: '5K certifications, 500K API calls' },
    { value: 'government', label: 'Government - $1,999/month', description: '25K certifications, 2.5M API calls' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Join CertNode T17+
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start certifying content with institutional-grade security
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                Organization (Optional)
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your organization"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="tier" className="block text-sm font-medium text-gray-700">
                Subscription Tier
              </label>
              <select
                id="tier"
                name="tier"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.tier}
                onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value }))}
              >
                {tierOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {tierOptions.find(t => t.value === formData.tier)?.description}
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum 12 characters with special characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Unlock className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const data = await apiService.getProfile();
      setProfileData(data);
    } catch (error) {
      addToast('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const usage = profileData?.usage || {};
  const userInfo = profileData?.user || user;

  const usageData = [
    {
      name: 'Certifications',
      used: usage.certifications?.used || 0,
      limit: usage.certifications?.limit || 0,
      percentage: usage.certifications?.percentage || 0,
      color: '#3B82F6'
    },
    {
      name: 'API Calls',
      used: usage.api_calls?.used || 0,
      limit: usage.api_calls?.limit || 0,
      percentage: usage.api_calls?.percentage || 0,
      color: '#10B981'
    },
    {
      name: 'Storage',
      used: Math.round(usage.storage?.used_mb || 0),
      limit: Math.round(usage.storage?.limit_mb || 0),
      percentage: usage.storage?.percentage || 0,
      color: '#F59E0B',
      unit: 'MB'
    }
  ];

  const tierBenefits = {
    individual: {
      name: 'Individual',
      price: '$29/month',
      features: ['50 certifications', '1K API calls', '1GB storage', 'Basic support'],
      color: 'bg-blue-500'
    },
    professional: {
      name: 'Professional',
      price: '$99/month',
      features: ['250 certifications', '10K API calls', '5GB storage', 'Priority support'],
      color: 'bg-green-500'
    },
    institutional: {
      name: 'Institutional',
      price: '$299/month',
      features: ['1K certifications', '100K API calls', '25GB storage', 'SLA guarantee'],
      color: 'bg-purple-500'
    },
    enterprise: {
      name: 'Enterprise',
      price: '$999/month',
      features: ['5K certifications', '500K API calls', '100GB storage', 'Dedicated support'],
      color: 'bg-indigo-500'
    },
    government: {
      name: 'Government',
      price: '$1,999/month',
      features: ['25K certifications', '2.5M API calls', '500GB storage', 'Security clearance'],
      color: 'bg-red-500'
    }
  };

  const currentTier = tierBenefits[userInfo?.tier] || tierBenefits.individual;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {userInfo?.full_name}
            </h1>
            <p className="text-gray-600">
              {userInfo?.organization && `${userInfo.organization} • `}
              {currentTier.name} Tier
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-white text-sm ${currentTier.color}`}>
              {currentTier.name}
            </div>
            {userInfo?.is_verified && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {usageData.map((item, index) => (
          <div key={index} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
              <div className="text-2xl font-bold" style={{ color: item.color }}>
                {item.used.toLocaleString()}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Used: {item.used.toLocaleString()}{item.unit || ''}</span>
                <span>Limit: {item.limit.toLocaleString()}{item.unit || ''}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              
              <div className="text-right text-sm text-gray-500">
                {item.percentage.toFixed(1)}% used
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Overview</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value.toLocaleString()}${name === 'Storage' ? ' MB' : ''}`,
                  'Used'
                ]}
              />
              <Bar dataKey="used" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tier Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
          <span className="text-2xl font-bold text-gray-900">{currentTier.price}</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentTier.features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">{feature}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Billing Amount: <span className="font-medium">${usage.billing?.total_amount || 0}</span>
              </p>
              {usage.billing?.overage_amount > 0 && (
                <p className="text-sm text-orange-600">
                  Overage: ${usage.billing.overage_amount}
                </p>
              )}
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium">New Certification</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium">View Analytics</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Key className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium">API Keys</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium">Export Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [authMode, setAuthMode] = useState('login');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading CertNode T17+...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <LoginForm onToggleMode={() => setAuthMode('register')} />
    ) : (
      <RegisterForm onToggleMode={() => setAuthMode('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard />
    </div>
  );
};

// Root App with Providers
const CertNodeApp = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default CertNodeApp;

