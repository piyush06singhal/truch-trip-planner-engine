import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Lock, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { confirmPasswordReset } from '../api/auth';
import Button from '../components/ui/Button';

export const ResetPassword: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password || !confirmPassword) {
      setErrorMsg('Please complete all password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!uid || !token) {
      setErrorMsg('Invalid password reset link parameters.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(uid, token, password);
      setSuccess(true);
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to reset password. Link may have expired.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-foreground px-4 py-12 relative overflow-hidden select-none">
      {/* Background graphics */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950 z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      {/* Card container */}
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
              Set New Password
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Verify security tokens and update CDL credentials.
            </p>
          </div>
        </div>

        {/* Success message */}
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5 py-4"
          >
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-foreground">Password Reset Successfully</h3>
              <p className="text-xs text-muted-foreground leading-normal max-w-[280px] mx-auto">
                Your driver credentials have been updated securely in the database.
              </p>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="primary"
              className="w-full justify-center gap-1.5 font-bold cursor-pointer"
            >
              Sign In to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex gap-2.5">
                <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">New Password</label>
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

            {/* Confirm Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-secondary/20 border border-zinc-800 text-sm rounded-lg pl-9 pr-3 py-2.5 text-zinc-100 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-secondary/40 transition-colors"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center py-2.5 font-bold cursor-pointer"
                disabled={loading}
              >
                {loading ? 'Updating Credentials...' : 'Save New Password'}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
