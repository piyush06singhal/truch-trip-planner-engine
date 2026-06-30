import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Lock, Mail, User, ShieldAlert, ArrowLeft } from 'lucide-react';
import { loginUser, registerUser } from '../api/auth';
import { useUI } from '../context/UIContext';
import Button from '../components/ui/Button';

export const AuthPage: React.FC = () => {
  const { login, addNotification } = useUI();
  const [screen, setScreen] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot password email
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleScreenChange = (targetScreen: 'login' | 'register' | 'forgot') => {
    setScreen(targetScreen);
    setErrorMsg(null);
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (screen === 'forgot') {
      if (!resetEmail.trim()) {
        setErrorMsg('Please enter your registered email address.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setResetSent(true);
        setLoading(false);
        addNotification('Reset Request Simulated', `Password reset instructions sent to ${resetEmail}.`, 'info');
      }, 1000);
      return;
    }

    if (!username.trim() || !password) {
      setErrorMsg('Username and password are required.');
      return;
    }
    
    if (screen === 'register' && !email.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }

    setLoading(true);
    try {
      if (screen === 'login') {
        const res = await loginUser(username.trim(), password);
        login(res.token, res.user);
      } else {
        const res = await registerUser(username.trim(), email.trim(), password);
        login(res.token, res.user);
        addNotification('Account Registered', `Welcome aboard, driver ${res.user.username}!`, 'success');
      }
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Authentication failed. Please check details.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-foreground px-4 py-12 relative overflow-hidden select-none">
      {/* Background visual graphics */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950 z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8 z-10 space-y-6"
      >
        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              SpotterAI Portal
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              FMCSA Hours-of-Service Compliance Routing Gate
            </p>
          </div>
        </div>

        {/* Error Callout */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex gap-2.5"
          >
            <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </motion.div>
        )}

        {/* Forgot password success */}
        {resetSent && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex flex-col gap-1.5"
          >
            <div className="flex gap-2.5 items-center">
              <ShieldAlert className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="font-bold">Instructions Dispatched</span>
            </div>
            <p className="opacity-90 leading-relaxed pl-6">
              A temporary password reset token link has been compiled and simulation-dispatched to <strong>{resetEmail}</strong>.
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {screen === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Username</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="driver_piyush"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-secondary/20 border border-zinc-800 text-sm rounded-lg pl-9 pr-3 py-2.5 text-zinc-100 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-secondary/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-muted-foreground">Password</label>
                    <button
                      type="button"
                      onClick={() => handleScreenChange('forgot')}
                      className="text-xs text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
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
                      className="w-full bg-secondary/20 border border-zinc-800 text-sm rounded-lg pl-9 pr-3 py-2.5 text-zinc-100 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-secondary/40 transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {screen === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Username</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="driver_piyush"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-secondary/20 border border-zinc-800 text-sm rounded-lg pl-9 pr-3 py-2.5 text-zinc-100 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-secondary/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="piyush@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-secondary/20 border border-zinc-800 text-sm rounded-lg pl-9 pr-3 py-2.5 text-zinc-100 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-secondary/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
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
                      className="w-full bg-secondary/20 border border-zinc-800 text-sm rounded-lg pl-9 pr-3 py-2.5 text-zinc-100 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-secondary/40 transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {screen === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Back Link */}
                <button
                  type="button"
                  onClick={() => handleScreenChange('login')}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer pb-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </button>

                {/* Reset email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Registered Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="piyush@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-secondary/20 border border-zinc-800 text-sm rounded-lg pl-9 pr-3 py-2.5 text-zinc-100 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-secondary/40 transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 font-bold cursor-pointer"
              disabled={loading}
            >
              {loading 
                ? 'Processing...' 
                : screen === 'login' 
                ? 'Sign In CDL Profile' 
                : screen === 'register' 
                ? 'Register Driver Account' 
                : 'Send Reset Link'}
            </Button>
          </div>
        </form>

        {/* Footer controls */}
        {screen !== 'forgot' && (
          <div className="pt-4 border-t border-zinc-800 text-center text-xs text-muted-foreground select-none">
            {screen === 'login' ? (
              <p>
                First time logging dispatch?{' '}
                <button
                  onClick={() => handleScreenChange('register')}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Register Account
                </button>
              </p>
            ) : (
              <p>
                Already have a driver profile?{' '}
                <button
                  onClick={() => handleScreenChange('login')}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthPage;
