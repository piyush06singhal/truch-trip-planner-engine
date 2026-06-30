import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import AppRouter from './router';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <AppRouter />
      </DashboardLayout>
    </BrowserRouter>
  );
};

export default App;
