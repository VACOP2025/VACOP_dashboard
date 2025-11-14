import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// --- Page Components ---
// These components represent full-page views.
import LoginPage from './pages/LoginPage';
import MissionPlannerPage from './pages/MissionPlannerPage';
import ConnectPage from './pages/ConnectPage';
import LogsDetailedPage from './pages/LogsDetailedPage';
import DashboardPage from './pages/DashboardPage';
import TeleoperationPage from './pages/TeleoperationPage';

// --- Layout Components ---
// These components control routing and layout.
import PrivateRoute from './components/layout/PrivateRoute';

/**
 * The main application component.
 *
 * This component is responsible for setting up the application's top-level
 * routing using React Router. It defines which components are rendered
 * for specific URL paths and differentiates between public and protected routes.
 *
 * @returns {React.ReactElement} The rendered application router.
 */
const App: React.FC = () => {
  return (
    // 'BrowserRouter' provides the routing context to the entire application.
    <BrowserRouter>
      {/* 'Routes' is a container for all individual 'Route' definitions. */}
      <Routes>
        {/*
          --- Public Route ---
          This route is accessible to all users, even if not authenticated.
        */}
        <Route path="/login" element={<LoginPage />} />

        {/*
          --- Protected Routes ---
          These routes are wrapped by the 'PrivateRoute' component.
          'PrivateRoute' will check for authentication and either render
          the nested route (via <Outlet />) or redirect to '/login'.
        */}
        <Route element={<PrivateRoute />}>
          {/* Default protected route (e.g., mission planner) */}
          <Route path="/" element={<MissionPlannerPage />} />
          
          {/* Other protected application pages */}
          <Route path="/connect" element={<ConnectPage />} />
          <Route path="/logs" element={<LogsDetailedPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/teleoperation" element={<TeleoperationPage />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
};

export default App;