import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ConnectionStatus from '../components/ConnectionStatus'; // Reusable component for status
import LogsPanel from '../components/LogsPanel';
import VideoFeed from '../components/VideoFeed';
import ObstacleDisplay from '../components/ObstacleDisplay';
import StaticMap from '../components/StaticMap';
import './DashboardPage.css'; // Component-specific styles

/**
 * Renders the main dashboard UI for monitoring an active autonomous mission.
 *
 * This page displays real-time data from the robot, including log messages,
 * video feeds, and sensor visualizations, organized in a 3-column layout.
 *
 * @returns {React.ReactElement} The rendered dashboard page.
 */
const DashboardPage: React.FC = () => {
  // React Router hook for programmatic navigation (e.g., changing modes).
  const navigate = useNavigate();

  // --- Component State ---

  // Manages the connection state of the gamepad (placeholder).
  const [isGamepadConnected, setGamepadConnected] = useState(false);
  
  // Manages the connection state of the robot (placeholder).
  // Hardcoded to 'true' to simulate the "Réseau 5G" (connected) state.
  const [isRobotConnected, setRobotConnected] = useState(true);

  // --- Event Handlers ---

  /**
   * Handles the 'Abandon Mission' button click.
   * Prompts the user for confirmation before navigating back to the
   * root (mission planner) page.
   */
  const handleAbandonMission = () => {
    if (window.confirm('Voulez-vous vraiment abandonner la mission ?')) {
      console.log('Mission abandonnée!');
      navigate('/'); // Return to the mission planner
    }
  };

  // --- Render ---

  return (
    <div className="page-container dashboard-page">
      {/* Page Header */}
      <header className="app-header">
        {/* Left Header Group */}
        <div className="header-group">
          <ConnectionStatus 
            label="Manette déconnecté" 
            isConnected={isGamepadConnected} 
            type="gamepad" 
          />
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/teleoperation')} // Navigates to Teleop page
          >
            Changer de mode
          </button>
        </div>
        
        {/* Page Title */}
        <h1>Mission automatique</h1>
        
        {/* Right Header Group */}
        <div className="header-group">
          
          {/* Robot connection status, links to the connection config page */}
          <Link 
            to="/connect" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{textDecoration: 'none'}}
          >
            <ConnectionStatus 
              // The label dynamically updates based on the connection state.
              label={isRobotConnected ? "Réseau 5G" : "Se connecter"} 
              isConnected={isRobotConnected} 
              type="robot" 
            />
          </Link>

          {/* Link to the detailed logs page (opens in new tab) */}
          <Link to="/logs" target="_blank" className="btn btn-secondary">
            Logs
          </Link>
          <button 
            onClick={handleAbandonMission} 
            className="btn btn-danger"
          >
            Abandon mission
          </button>
        </div>
      </header>

      {/* 3-Column Content Grid */}
      <main className="dashboard-grid">
        
        {/* Column 1: Important Logs */}
        <div className="grid-col-left">
          <LogsPanel />
        </div>
        
        {/* Column 2: Video Feeds */}
        <div className="grid-col-center">
          <VideoFeed title="Caméra RGB" />
          <VideoFeed title="Caméra RGBD" />
        </div>
        
        {/* Column 3: Sensor Visualizations */}
        <div className="grid-col-right">
          <ObstacleDisplay />
          <StaticMap />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;