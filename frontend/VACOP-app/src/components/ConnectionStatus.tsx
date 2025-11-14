import React from 'react';
import { FaGamepad, FaWifi, FaSlash } from 'react-icons/fa';
import './ConnectionStatus.css'; // Imports component-specific styles

/**
 * Defines the props accepted by the ConnectionStatus component.
 */
interface ConnectionStatusProps {
  /** The text label to display on the button. */
  label: string;
  
  /** Boolean state indicating if the device is connected. */
  isConnected: boolean;
  
  /** The type of device, used to determine which icon to display. */
  type: 'gamepad' | 'robot';
}

/**
 * A reusable UI component that displays the connection status
 * of a device (e.g., gamepad or robot).
 *
 * It renders a button with a dynamic icon and label,
 * and its visual style changes based on the 'isConnected' prop.
 *
 * @param {ConnectionStatusProps} props The component props.
 * @returns {React.ReactElement} The rendered status button.
 */
const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ label, isConnected, type }) => {
  
  /**
   * Determines the correct icon to display based on the component's props.
   * @returns {React.ReactElement} The icon element.
   */
  const getIcon = (): React.ReactElement => {
    // Select the base icon based on the 'type' prop.
    const baseIcon = (type === 'gamepad') ? <FaGamepad /> : <FaWifi />;
    
    // If disconnected, wrap the icon in a container
    // and overlay it with a 'FaSlash' icon.
    if (!isConnected) {
      return (
        <span className="icon-disconnected">
          {baseIcon}
          <FaSlash className="icon-slash" />
        </span>
      );
    }
    
    // If connected, return only the base icon.
    return baseIcon;
  };

  /**
   * Renders the button.
   * The CSS class is dynamically set to 'connected' or 'disconnected'
   * based on the 'isConnected' prop, allowing for state-specific styling.
   */
  return (
    <button className={`status-button ${isConnected ? 'connected' : 'disconnected'}`}>
      {getIcon()}
      <span>{label}</span>
    </button>
  );
};

export default ConnectionStatus;