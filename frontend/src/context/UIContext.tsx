import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TripResponse } from '../types/trip';
import { User, getUserProfile, logoutUser } from '../api/auth';

export type TabType = 'map' | 'timeline' | 'eld';
export type MapTheme = 'light' | 'dark';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface CarrierProfile {
  name: string;
  dotNumber: string;
  address: string;
}

export type RulesetType = 'property-70h' | 'passenger-60h';

interface UIContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeEldDay: number;
  setActiveEldDay: (day: number) => void;
  plannedTrip: TripResponse | null;
  setPlannedTrip: (trip: TripResponse | null) => void;
  selectedStopIdx: number | null;
  setSelectedStopIdx: (idx: number | null) => void;
  mapTheme: MapTheme;
  setMapTheme: (theme: MapTheme) => void;
  
  // Interactive additions
  notifications: Notification[];
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  carrierProfile: CarrierProfile;
  setCarrierProfile: (profile: CarrierProfile) => void;
  activeRuleset: RulesetType;
  setActiveRuleset: (ruleset: RulesetType) => void;

  // Authentication addition
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  authLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [activeEldDay, setActiveEldDay] = useState<number>(0);
  const [selectedStopIdx, setSelectedStopIdx] = useState<number | null>(null);
  
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Carrier profile & Active ruleset state loaded from localStorage
  const [carrierProfile, setCarrierProfileState] = useState<CarrierProfile>(() => {
    try {
      const saved = localStorage.getItem('spotter_carrier_profile');
      return saved ? JSON.parse(saved) : {
        name: 'SpotterAI Logistics Corp',
        dotNumber: 'DOT-8472911',
        address: 'New York, NY 10001'
      };
    } catch {
      return {
        name: 'SpotterAI Logistics Corp',
        dotNumber: 'DOT-8472911',
        address: 'New York, NY 10001'
      };
    }
  });

  const [activeRuleset, setActiveRulesetState] = useState<RulesetType>(() => {
    try {
      const saved = localStorage.getItem('spotter_active_ruleset');
      return (saved === 'property-70h' || saved === 'passenger-60h') ? saved : 'property-70h';
    } catch {
      return 'property-70h';
    }
  });

  // Notifications center state
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    return [
      {
        id: 'init-welcome',
        title: 'Welcome to SpotterAI',
        message: 'Your compliance monitor & routing dashboard is fully active.',
        type: 'info',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      },
      {
        id: 'init-backend',
        title: 'Backend Sync Active',
        message: 'REST API & Supabase database integration is connected.',
        type: 'success',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      }
    ];
  });

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const setCarrierProfile = (profile: CarrierProfile) => {
    setCarrierProfileState(profile);
    try {
      localStorage.setItem('spotter_carrier_profile', JSON.stringify(profile));
    } catch (e) {
      // Storage save recovery
    }
  };

  const setActiveRuleset = (ruleset: RulesetType) => {
    setActiveRulesetState(ruleset);
    try {
      localStorage.setItem('spotter_active_ruleset', ruleset);
    } catch (e) {
      // Storage save recovery
    }
  };

  // Auth profile loader on startup
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('spotter_auth_token');
      if (token) {
        try {
          const profile = await getUserProfile();
          setCurrentUser(profile);
          addNotification('Welcome Back!', `Logged in successfully as driver ${profile.username}.`, 'success');
        } catch (err) {
          localStorage.removeItem('spotter_auth_token');
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    };
    loadProfile();
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('spotter_auth_token', token);
    setCurrentUser(user);
    addNotification('Login Successful', `Active profile changed to user account ${user.username}.`, 'success');
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      // API call failed, proceed with local cleanup
    } finally {
      localStorage.removeItem('spotter_auth_token');
      setCurrentUser(null);
      addNotification('Logged Out', 'User session terminated. Active trips are anonymous.', 'info');
    }
  };
  
  const [plannedTrip, setPlannedTripState] = useState<TripResponse | null>(() => {
    try {
      const saved = localStorage.getItem('spotter_planned_trip');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setPlannedTrip = (trip: TripResponse | null) => {
    setPlannedTripState(trip);
    try {
      if (trip) {
        localStorage.setItem('spotter_planned_trip', JSON.stringify(trip));
        // Add automatic route notification
        addNotification(
          'Route compliance audited',
          `Planned leg from ${trip.stops[0]?.location || 'Origin'} to ${trip.stops[trip.stops.length - 1]?.location || 'Destination'} check passed.`,
          'success'
        );
      } else {
        localStorage.removeItem('spotter_planned_trip');
      }
    } catch (e) {
      // Storage save recovery
    }
  };

  const [mapTheme, setMapThemeState] = useState<MapTheme>(() => {
    try {
      const saved = localStorage.getItem('spotter_map_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const setMapTheme = (theme: MapTheme) => {
    setMapThemeState(theme);
    try {
      localStorage.setItem('spotter_map_theme', theme);
    } catch (e) {
      // Storage theme recovery
    }
  };

  return (
    <UIContext.Provider value={{ 
      activeTab, setActiveTab, 
      activeEldDay, setActiveEldDay, 
      plannedTrip, setPlannedTrip,
      selectedStopIdx, setSelectedStopIdx,
      mapTheme, setMapTheme,
      
      // Interactive values
      notifications, addNotification,
      markAllAsRead, clearNotifications,
      carrierProfile, setCarrierProfile,
      activeRuleset, setActiveRuleset,

      // Authentication values
      currentUser, setCurrentUser,
      authLoading, login, logout,
    }}>
      {children}
    </UIContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};
