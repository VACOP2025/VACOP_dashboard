import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ConnectionStatus from '../components/ConnectionStatus';
import LogsPanel from '../components/LogsPanel';
import VideoFeed from '../components/VideoFeed';
import ObstacleDisplay from '../components/ObstacleDisplay';
import StaticMap from '../components/StaticMap';
import './TeleoperationPage.css'; // Import component-specific styles
import { useGamepadStatus } from "../hooks/useGamepadStatus";
import { useGamepadDebug } from "../hooks/useGamepadDebug";
import { useGamepadTransmit } from "../hooks/useGamepadTransmit";
import { useRobotConnection } from '../state/robotConnection';

/**
 * Renders the dashboard page for "Teleoperation" mode.
 *
 * This component displays a UI similar to the autonomous dashboard
 * (logs, video feeds, sensors) but is contextually for manual
 * remote control.
 *
 * @returns {React.ReactElement} The rendered teleoperation page.
 */
const TeleoperationPage: React.FC = () => {
  const navigate = useNavigate();

  // --- Component State (Simulation) ---

  // Manages the gamepad connection state (placeholder).
  // Set to 'true' to match the mockup "Manette connectée".
  const { isConnected: isGamepadConnected } = useGamepadStatus(true);  
  useGamepadDebug(isGamepadConnected, 20);
  useGamepadTransmit(isGamepadConnected, {
  endpointUrl: "http://localhost:5000/command/gamepad",
  enableDebugLogs: true,
  pollHz: 20,
});
  // Manages the robot connection state (placeholder).

const { isRobotConnected, setRobotConnected } = useRobotConnection();

  
  /**
   * Handles stopping the teleoperation session.
   * This function is triggered by both "Changer de mode" and
   * "Abandon mission" buttons. It confirms with the user
   * before navigating back to the planner page ('/').
   */
  const handleStopTeleop = () => {
    // Get user confirmation before proceeding.
    if (window.confirm('Stop teleoperation and return to planner?')) {
      console.log('Teleoperation stopped!');
      // Navigate back to the planner, replacing history
      // to prevent using the browser's "back" button.
      navigate('/', { replace: true });
    }
  };

  // --- JSX Render ---

  return (
    <div className="page-container teleop-page">
      {/* Page Header */}
      <header className="app-header">
        {/* Left Group: Gamepad Status & Mode Change */}
        <div className="header-group">
          <ConnectionStatus 
            label={isGamepadConnected ? "Manette connectée" : "Manette déconnecté"}
            isConnected={isGamepadConnected} 
            type="gamepad" 
          />
          <button 
            className="btn btn-primary"
            onClick={handleStopTeleop} // Stops the current session
          >
            Changer de mode
          </button>
        </div>
        
        {/* Page Title */}
        <h1>Téléopération</h1>
        
        {/* Right Group: Status, Logs & Abandon */}
        <div className="header-group">
<ConnectionStatus
  label="Robot"
  type="robot"
  isConnected={isRobotConnected}
  onStatusChange={setRobotConnected}
/>


          <Link to="/logs" target="_blank" className="btn btn-secondary">
            Logs
          </Link>
          <button 
            onClick={handleStopTeleop} // Stops the current session
            className="btn btn-danger"
          >
            Abandon mission
          </button>
        </div>
      </header>

      {/* Main Content Grid (Identical to Dashboard) */}
      <main className="teleop-grid">
        <div className="grid-col-left">
          <LogsPanel />
        </div>
        <div className="grid-col-center">
          <VideoFeed title="Caméra RGB" />
          <VideoFeed title="Caméra RGBD" />
        </div>
        <div className="grid-col-right">
          <ObstacleDisplay />
          <StaticMap />
        </div>
      </main>
    </div>
  );
};

export default TeleoperationPage;