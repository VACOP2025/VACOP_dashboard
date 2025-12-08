import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import ConnectionStatus from '../components/ConnectionStatus';
import './ConnectPage.css'; // Imports component-specific styles

/**
 * Renders the "VACOP Connection" page.
 *
 * This page provides a form for users to enter the IP address and port
 * required to establish a connection with the VACOP robot.
 * It manages the state for these inputs and handles the form submission.
 *
 * @returns {React.ReactElement} The rendered connection page.
 */
const ConnectPage: React.FC = () => {
  const navigate = useNavigate();

  // --- Component State ---

  // Manages the value of the IP address input field.
  const [ipAddress, setIpAddress] = useState<string>('172.31.1.147');
  
  // Manages the value of the Port input field.
  const [port, setPort] = useState<string>('7000');
  
  // Manages the display state for the gamepad (placeholder).
  const [isGamepadConnected, setGamepadConnected] = useState(false);
  
  // Manages the display state for the robot connection (placeholder).
  const [isRobotConnected, setRobotConnected] = useState(false);

  // --- Event Handlers ---

  /**
   * Handles the submission of the connection form.
   * Prevents default form behavior and logs the connection attempt.
   *
   * @param {React.FormEvent<HTMLFormElement>} e The form submit event.
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Prevent the browser from reloading the page on form submission.
    e.preventDefault(); 
    console.log('Attempting to connect with IP:', ipAddress, 'and Port:', port);
    
    // --- Simulation Logic ---
    // This block simulates a successful connection for development purposes.
    // In a production environment, this will be replaced with an API/WebSocket call.
    alert('Connexion (simulée) réussie!');
    // setRobotConnected(true); // Note: State update is asynchronous
    
    // Navigate the user back to the main planner page after connection.
    navigate('/'); 
  };

  // --- Render ---

  return (
    <div className="page-container connect-page">
      {/* Page Header */}
      <Header>
        <div className="header-group">
          <ConnectionStatus 
            label="Manette déconnecté" 
            isConnected={isGamepadConnected} 
            type="gamepad" 
          />
        </div>
        
        {/* Centered header content */}
        <div className="header-group header-center">
          <h1>Connexion au VACOP</h1>
          <ConnectionStatus 
            label="Se connecter" 
            isConnected={isRobotConnected} 
            type="robot" 
          />
        </div>
        
        {/* Right-aligned header content */}
        <div className="header-group">
          <Link to="/logs" target="_blank" className="btn btn-secondary">
            Logs
          </Link>
        </div>
      </Header>

      {/* Main content area, centered */}
      <main className="connect-main">
        <form className="connect-form" onSubmit={handleSubmit}>
          
          {/* IP Address Input Group */}
          <div className="connect-input-group">
            <label htmlFor="vacop-ip">VACOP IP :</label>
            <input 
              type="text" 
              id="vacop-ip"
              value={ipAddress} // Controlled component: value is tied to state.
              onChange={(e) => setIpAddress(e.target.value)} // State is updated on change.
            />
          </div>

          {/* Port Input Group */}
          <div className="connect-input-group">
            <label htmlFor="vacop-port">VACOP Port :</label>
            <input 
              type="text" 
              id="vacop-port"
              value={port} // Controlled component.
              onChange={(e) => setPort(e.target.value)} // State is updated on change.
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-action btn-green">
            Se connecter
          </button>
        </form>
      </main>
    </div>
  );
};

export default ConnectPage;