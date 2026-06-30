import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  Sun, 
  Moon, 
  Bell, 
  Settings, 
  Menu, 
  User
} from 'lucide-react';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  
  // Create breadcrumb label from route path
  const getBreadcrumb = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
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
          {/* Notifications Trigger */}
          <button
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border hover:bg-secondary text-muted-foreground relative transition-colors focus:outline-none"
            aria-label="View notifications list"
          >
            <Bell className="h-[1.1rem] w-[1.1rem]" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </button>

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
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border bg-background text-sm font-medium transition-all hover:bg-secondary hover:text-secondary-foreground focus:outline-none"
            aria-label="Toggle theme mode"
          >
            <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          {/* Divider */}
          <div className="h-6 w-[1px] bg-border mx-1" />

          {/* Profile Circle Placeholder */}
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs select-none">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
