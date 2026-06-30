import React, { useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { 
  X, 
  Truck,
  LayoutDashboard, 
  MapPin, 
  Map, 
  Clock, 
  ClipboardList, 
  History, 
  Settings, 
  Info 
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const mobileMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Trip Planner', path: '/planner', icon: MapPin },
    { name: 'Route Map', path: '/map', icon: Map },
    { name: 'Timeline', path: '/timeline', icon: Clock },
    { name: 'ELD Logs', path: '/eld', icon: ClipboardList },
    { name: 'Trip History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'About', path: '/about', icon: Info },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      
      {/* 1. Desktop Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* 2. Mobile Navigation Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 flex flex-col md:hidden select-none"
            >
              <div className="flex h-16 items-center justify-between px-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Truck className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-base tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    SpotterAI
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-secondary text-muted-foreground focus:outline-none"
                  aria-label="Close mobile navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                {mobileMenuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Display Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Navbar onMenuToggle={() => setMobileMenuOpen(true)} />
        
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* Subtle page fade transition wrapper */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="h-full flex flex-col"
          >
            {children}
          </motion.div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
