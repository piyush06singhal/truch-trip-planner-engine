import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, ShieldAlert } from 'lucide-react';
import { loginUser, registerUser } from '../../api/auth';
import { useUI } from '../../context/UIContext';
import Button from '../ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, addNotification } = useUI();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Form values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Loading & error
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!username.trim() || !password) {
      setErrorMsg('Username and password are required.');
      return;
    }
    
    if (activeTab === 'register' && !email.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'login') {
        const res = await loginUser(username.trim(), password);
        login(res.token, res.user);
        onClose();
      } else {
        const res = await registerUser(username.trim(), email.trim(), password);
        login(res.token, res.user);
        addNotification('Account Registered', `Welcome aboard, driver ${res.user.username}!`, 'success');
        onClose();
      }
    } catch (err: any) {
      const msg = err.message || 'Authentication transaction failed.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md bg-card border border-border/80 shadow-2xl rounded-2xl overflow-hidden z-10"
          >
            {/* Header Tabs */}
            <div className="flex border-b border-border select-none">
              <button
                onClick={() => handleTabChange('login')}
                className={`flex-1 py-4 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'login' 
                    ? 'border-b-2 border-primary text-primary bg-primary/5' 
                    : 'text-muted-foreground hover:bg-secondary/40'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => handleTabChange('register')}
                className={`flex-1 py-4 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'register' 
                    ? 'border-b-2 border-primary text-primary bg-primary/5' 
                    : 'text-muted-foreground hover:bg-secondary/40'
                }`}
              >
                Register Driver
              </button>
              
              <button
                onClick={onClose}
                className="absolute top-3.5 right-3.5 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="text-center space-y-1.5 pb-2 select-none">
                <h3 className="text-base font-bold text-foreground">
                  {activeTab === 'login' ? 'Welcome Back Driver' : 'Create Carrier Profile'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {activeTab === 'login' 
                    ? 'Provide dispatcher credentials to sync active HOS logs.' 
                    : 'Register your USDOT log record securely on Supabase.'}
                </p>
              </div>

              {/* Error Callout */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {/* Username field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="piyush_kumar"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-secondary/30 border border-border text-sm rounded-lg pl-9 pr-3 py-2 text-zinc-100 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Email field (Register Only) */}
              {activeTab === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="driver@spotter.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-secondary/30 border border-border text-sm rounded-lg pl-9 pr-3 py-2 text-zinc-100 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-secondary/30 border border-border text-sm rounded-lg pl-9 pr-3 py-2 text-zinc-100 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center cursor-pointer"
                  disabled={loading}
                >
                  {loading 
                    ? 'Authenticating...' 
                    : activeTab === 'login' 
                    ? 'Sign In CDL Profile' 
                    : 'Register Driver Account'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
