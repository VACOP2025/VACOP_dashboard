import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/layout/Header';
import ConnectionStatus from '../components/ConnectionStatus';
import LogsPanel from '../components/LogsPanel';
import MapComponent from '../components/MapComponent';
import type { MapCoordinates } from '../components/MapComponent';
import authService from '../services/authService';
import './MissionPlannerPage.css'; // Import page-specific styles
import { useRobotConnection } from '../state/robotConnection';

/**
 * Renders the main mission planning page ("Choose Mission").
 *
 * This page allows the operator to select a destination on a map,
 * schedule a mission (immediate or deferred), and navigate
 * to other modes (teleoperation, logs, connection).
 *
 * @returns {React.ReactElement} The rendered planner page component.
 */
const MissionPlannerPage: React.FC = () => {
  const navigate = useNavigate();

  // --- Component State ---

  /** Manages the coordinates of the destination selected on the map. */
  const [destination, setDestination] = useState<MapCoordinates | null>(null);
  /** Manages the coordinates of the initial pose selected on the map. */
  const [initialPose, setInitialPose] = useState<MapCoordinates | null>(null);

  /** Stores the selected date for a deferred mission. */
  const [selectedDate, setSelectedDate] = useState('');

  /** Stores the selected time for a deferred mission. */
  const [selectedTime, setSelectedTime] = useState('');

  /** Manages the gamepad connection state (placeholder). */
  const [isGamepadConnected, setGamepadConnected] = useState(false);

  /** Manages the robot connection state (placeholder). */
  const { isRobotConnected, setRobotConnected } = useRobotConnection();

  // --- Event Handlers ---

  /**
   * Handles user logout.
   */
  const handleLogout = () => {
    authService.logout();
  };

  /**
   * Callback for the MapComponent.
   * Updates the respective state when the operator interacts with the map.
   *
   * @param {MapCoordinates | null} goal - The goal coordinates.
   * @param {MapCoordinates | null} initial - The initial coordinates.
   */
  const handleMapClick = (goal: MapCoordinates | null, initial: MapCoordinates | null) => {
    // Only update if changed to avoid unnecessary re-renders if logic inside MapComponent is chatty
    if (goal) setDestination(goal);
    if (initial) setInitialPose(initial);
    console.log('Map update -> Goal:', goal, 'Initial:', initial);
  };

  /**
   * Handles immediate mission launch.
   * Verifies destination and initial pose are selected before navigating
   * to the dashboard, replacing the navigation history.
   */
  const handleLaunchNow = async () => {
    // Guard clause: check for destination and initial pose.
    if (!destination) {
      alert('Please select a destination (Goal) on the map (Left Click).');
      return;
    }
    if (!initialPose) {
      alert('Please select an initial position on the map (Right Click).');
      return;
    }

    console.log('Launching mission. Goal:', destination, 'Initial:', initialPose);

    // Construct the payload as requested
    const payload = {
      goal_pose: {
        header: { frame_id: 'map' },
        pose: {
          position: { x: destination.x, y: destination.y, z: 0.0 },
          orientation: destination.orientation || { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }
        }
      },
      initial_pose: {
        header: { frame_id: 'map' },
        pose: {
          position: { x: initialPose.x, y: initialPose.y, z: 0.0 },
          orientation: initialPose.orientation || { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }
        }
      },
      behavior_tree: ''
    };

    try {
      // Send to backend
      await axios.post('http://localhost:5000/vehicle/goal', payload, {
        headers: {
          // If auth is needed, usually we attach token. 
          // But existing code didn't show global axios interceptor.
          // authService has `getCurrentUserToken`.
          'Authorization': `Bearer ${authService.getCurrentUserToken()}`
        }
      });
      alert("Mission launched (Goal & Initial Pose published)!");
    } catch (err) {
      console.error("Failed to launch mission:", err);
      alert("Failed to launch mission. Check console.");
      return;
    }

    // Replace current page in history to prevent "back" navigation
    navigate('/dashboard', { replace: true });
  };

  /**
   * Handles deferred mission planning.
   * Verifies destination, date, and time before navigating
   * to the dashboard, replacing the navigation history.
   */
  const handlePlanMission = () => {
    // Guard clause: check for destination.
    if (!destination) {
      alert('Please select a destination on the map.');
      return;
    }
    if (!initialPose) {
      alert('Please select an initial position on the map.');
      return;
    }
    // Guard clause: check for date and time.
    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time.');
      return;
    }
    console.log(`Mission planned for ${destination} at ${selectedDate} ${selectedTime}`);
    // ... logic to send to backend ...

    // For now we might want to also trigger the launch or save it. 
    // Assuming same behavior for now regarding MQTT publishing if "Planner" implies immediate backend notification,
    // otherwise we just navigate.
    // The requirement says "THose messages needs to be sent if the user presses launch mission or plan mission."
    // So we should probably call the API here too or a similar one.

    // Trigger launch logic for now as requested
    handleLaunchNow();
  };

  // --- JSX Render ---

  // Helper to determine status color
  const isReady = destination && initialPose;

  return (
    <div className="page-container">
      {/* Application Header */}
      <Header>
        {/* Groupe de gauche : manette + changement de mode */}
        <div className="header-group">
          <ConnectionStatus
            label="Manette déconnecté"
            isConnected={isGamepadConnected}
            type="gamepad"
          />
          <button
            className="btn btn-primary"
            onClick={() => navigate('/teleoperation')}
          >
            Changer de mode
          </button>
        </div>

        {/* Centre : titre + état de la destination */}
        <div className="header-title-group">
          <h1>Choisir mission</h1>
          {/* Indicateur de validité de la destination dans le header */}
          <button
            className={`btn btn-status ${isReady ? 'btn-green' : 'btn-red'}`}
          >
            {isReady ? 'Prêt à lancer' : 'Positions manquantes'}
          </button>
        </div>

        {/* Groupe de droite : logs + connexion robot + logout */}
        <div className="header-group">
          {/* Opens the logs page in a new tab */}
          <Link to="/logs" target="_blank" className="btn btn-secondary">
            Logs
          </Link>
          <ConnectionStatus
            label="Robot"
            type="robot"
            isConnected={isRobotConnected}
            onStatusChange={setRobotConnected}
          />

          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </div>
      </Header>


      {/* Main Page Content Grid */}
      <main className="planner-grid">
        {/* Column 1: Important Logs */}
        <div className="grid-col-left">
          <LogsPanel />
        </div>

        {/* Column 2: Interactive Map */}
        <div className="grid-col-center">
          <MapComponent onMapClick={handleMapClick} />
        </div>

        {/* Column 3: Planning Controls */}
        <div className="grid-col-right">
          <div className="planning-controls">
            <input
              type="date"
              className="date-time-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
            <input
              type="time"
              className="date-time-input"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
            />

            <button
              className="btn btn-action btn-green"
              onClick={handlePlanMission}
            >
              Planifier la mission
            </button>
            <button
              className="btn btn-action btn-green"
              onClick={handleLaunchNow}
            >
              Lancer la mission
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MissionPlannerPage;