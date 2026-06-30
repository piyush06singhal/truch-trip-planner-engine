import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  Sun, 
  Moon, 
  Bell, 
  Settings, 
  Menu, 
  User,
  Check,
  Trash2,
  AlertTriangle,
  Info as InfoIcon,
  CheckCircle2,
  X,
  LogOut,
  LogIn,
  Building,
  Award
} from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  
  // Custom states from UIContext
  const { 
    notifications, 
    markAllAsRead, 
    clearNotifications,
    currentUser,
    logout,
    carrierProfile
  } = useUI();

  // Dropdown & Modal states
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Create breadcrumb label from route path
  const getBreadcrumb = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
      default:
        return <InfoIcon className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 select-none">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left Side: Mobile Menu Button & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md border border-border hover:bg-secondary text-muted-foreground focus:outline-none"
            aria-label="Toggle mobile layout menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">SpotterAI</Link>
            <span className="text-border">/</span>
            <span className="text-foreground font-semibold">{getBreadcrumb()}</span>
          </div>
          
          <span className="sm:hidden text-foreground font-semibold text-sm">{getBreadcrumb()}</span>
        </div>

        {/* Right Side: Tools, Theme & User Settings */}
        <div className="flex items-center gap-2">
          {/* Notifications Trigger & Dropdown Wrapper */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border hover:bg-secondary text-muted-foreground relative transition-colors focus:outline-none cursor-pointer"
              aria-label="View notifications list"
            >
              <Bell className="h-[1.1rem] w-[1.1rem]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu Panel */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">Compliance Alerts</span>
                    {unreadCount > 0 && (
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {notifications.length > 0 && (
                      <>
                        <button
                          onClick={markAllAsRead}
                          className="p-1 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded hover:bg-secondary cursor-pointer"
                          title="Mark all as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={clearNotifications}
                          className="p-1 text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 rounded hover:bg-secondary cursor-pointer"
                          title="Clear all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => setNotifOpen(false)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[350px] overflow-y-auto divide-y divide-border">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-4 flex gap-3 transition-colors ${notif.read ? 'bg-card' : 'bg-primary/5'}`}
                      >
                        {getNotifIcon(notif.type)}
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-semibold text-foreground truncate">{notif.title}</h4>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{notif.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-normal break-words">{notif.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center p-4">
                      <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <p className="text-xs font-medium text-foreground">All systems clear</p>
                      <p className="text-[10px] text-muted-foreground max-w-[200px] mt-1">No pending FMCSA compliance warnings or timeline alerts.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Shortcut Link */}
          <Link
            to="/settings"
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border hover:bg-secondary text-muted-foreground transition-colors"
            aria-label="Access settings screen"
          >
            <Settings className="h-[1.1rem] w-[1.1rem]" />
          </Link>

          {/* Light/Dark Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border bg-background text-sm font-medium transition-all hover:bg-secondary hover:text-secondary-foreground focus-none cursor-pointer"
            aria-label="Toggle theme mode"
          >
            <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          {/* Divider */}
          <div className="h-6 w-[1px] bg-border mx-1" />

          {/* Profile Circle Avatar Trigger & Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs select-none cursor-pointer hover:bg-primary/20 transition-all focus:outline-none"
              aria-label="Toggle user account profile settings menu"
            >
              {currentUser ? (
                <span className="uppercase text-sm font-semibold">{currentUser.username[0]}</span>
              ) : (
                <User className="h-4 w-4" />
              )}
            </button>

            {/* Profile Dropdown panel */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-card border border-border shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {currentUser ? (
                  <div className="p-4 space-y-4">
                    {/* User info details */}
                    <div className="space-y-1 pb-3 border-b border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active CDL Profile</p>
                      <h4 className="text-sm font-bold text-foreground truncate">{currentUser.username}</h4>
                      <p className="text-[11px] text-muted-foreground truncate">{currentUser.email || 'No email attached'}</p>
                    </div>

                    {/* Carrier Info display */}
                    <div className="space-y-2">
                      <div className="flex gap-2.5 items-start text-xs">
                        <Building className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-zinc-300">{carrierProfile.name}</p>
                          <p className="text-[10px] text-muted-foreground">DOT: {carrierProfile.dotNumber}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-1">
                        <Award className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                        <span className="font-medium text-zinc-400">Authenticated Driver</span>
                      </div>
                    </div>

                    {/* Action logout */}
                    <div className="pt-2 border-t border-border">
                      <button
                        onClick={async () => {
                          setProfileOpen(false);
                          await logout();
                        }}
                        className="w-full text-left inline-flex items-center gap-2 text-xs font-semibold text-red-400 hover:text-red-300 py-1 cursor-pointer transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out Session
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center space-y-3">
                    <User className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                    <div className="space-y-1 select-none">
                      <p className="text-xs font-bold text-foreground">Driver Profile Offline</p>
                      <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto leading-normal">
                        Sign in to sync your compliance trip logs and digital HOS sheets under your driver account.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <LogIn className="h-3.5 w-3.5" /> Sign In / Register
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal Overlay Popup */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
};

export default Navbar;
