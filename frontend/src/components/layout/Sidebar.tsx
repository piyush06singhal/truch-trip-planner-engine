import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  MapPin, 
  Map, 
  Clock, 
  ClipboardList, 
  History, 
  Settings, 
  Info,
  ChevronLeft,
  ChevronRight,
  Truck
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const menuItems = [
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
    <motion.aside
      className="hidden md:flex flex-col border-r border-border bg-card/45 backdrop-blur-md sticky top-0 h-screen z-30 select-none overflow-x-hidden"
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <Truck className="h-6 w-6 text-primary shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-semibold text-base tracking-tight whitespace-nowrap bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent"
              >
                SpotterAI
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-secondary hover:text-secondary-foreground text-muted-foreground transition-all focus:outline-none"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative duration-200 outline-none ${
                isActive 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap"
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>
            
            {/* Tooltip for collapsed mode */}
            {collapsed && (
              <div className="absolute left-14 scale-0 group-hover:scale-100 bg-popover border border-border text-popover-foreground text-xs px-2 py-1.5 rounded-md shadow-lg z-50 pointer-events-none transition-all duration-150 whitespace-nowrap">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Toggle for collapsed state */}
      {collapsed && (
        <div className="p-3 border-t border-border flex justify-center">
          <button
            onClick={() => setCollapsed(false)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-secondary hover:text-secondary-foreground text-muted-foreground transition-all"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
