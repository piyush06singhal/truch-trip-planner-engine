import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TripResponse } from '../types/trip';

export type TabType = 'map' | 'timeline' | 'eld';
export type MapTheme = 'light' | 'dark';

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
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [activeEldDay, setActiveEldDay] = useState<number>(0);
  
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
      } else {
        localStorage.removeItem('spotter_planned_trip');
      }
    } catch (e) {
      // Storage save recovery
    }
  };

  const [selectedStopIdx, setSelectedStopIdx] = useState<number | null>(null);
  
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
