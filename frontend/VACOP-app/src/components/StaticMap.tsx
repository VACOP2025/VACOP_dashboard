import React from 'react';
import './StaticMap.css'; // Imports component-specific styles

/**
 * A placeholder component for the static, non-interactive map view.
 *
 * This component is used on dashboards to display the robot's position
 * or environment without allowing user interaction (unlike MapComponent).
 * Currently, it renders a static placeholder.
 *
 * @returns {React.ReactElement} The rendered static map panel.
 */
const StaticMap: React.FC = () => {
  return (
    <div className="static-map-placeholder">
      <h4>Map</h4>
      <div className="map-content">
        <p>(Static Map View)</p>
      </div>
    </div>
  );
};

export default StaticMap;