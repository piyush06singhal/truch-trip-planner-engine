import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import AppRouter from './router';
import { useUI } from './context/UIContext';
import AuthPage from './pages/AuthPage';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { currentUser, authLoading } = useUI();

  // If fetching current session token on mount, display full-screen spinner
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-semibold">Configuring driver HOS session...</p>
        </div>
      </div>
    );
  }

  // Force login page if user profile session token is missing
  if (!currentUser) {
    return (
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <DashboardLayout>
        <AppRouter />
      </DashboardLayout>
    </BrowserRouter>
  );
};

export default App;
