import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Lazy load pages for code splitting and optimized load speeds
const Dashboard = lazy(() => import('../pages/Dashboard'));
const TripPlanner = lazy(() => import('../pages/TripPlanner'));
const RouteMap = lazy(() => import('../pages/RouteMap'));
const Timeline = lazy(() => import('../pages/Timeline'));
const ELDLogs = lazy(() => import('../pages/ELDLogs'));
const History = lazy(() => import('../pages/History'));
const Settings = lazy(() => import('../pages/Settings'));
const About = lazy(() => import('../pages/About'));
const NotFound = lazy(() => import('../pages/NotFound'));

const PageLoader: React.FC = () => (
  <div className="flex h-[60vh] w-full items-center justify-center" aria-label="Loading page contents">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/planner" element={<TripPlanner />} />
        <Route path="/map" element={<RouteMap />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/eld" element={<ELDLogs />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
