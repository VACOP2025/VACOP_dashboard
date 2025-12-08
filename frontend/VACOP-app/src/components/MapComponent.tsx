import React, { useState } from 'react';
import './MapComponent.css'; // Import component-specific styles

/**
 * Defines the structure for a 2D coordinate point.
 * This interface is used for both setting the pin and passing
 * the destination data to the parent component.
 */
export interface MapCoordinates {
  x: number;
  y: number;
}

/**
 * Defines the props accepted by the MapComponent.
 */
interface MapComponentProps {
  /**
   * A callback function passed from the parent component.
   * It is invoked when the map is clicked, passing the
   * coordinates of the click event.
   */
  onMapClick: (coords: MapCoordinates) => void;
}

/**
 * A placeholder component for the interactive mission map.
 *
 * This component manages its own internal state for visually displaying a pin
 * at the clicked location. It also forwards the selected coordinates to its
 * parent component via the 'onMapClick' prop to update the application's
 * global state (e.g., the selected destination).
 *
 * @param {MapComponentProps} props The component props, including the callback.
 * @returns {React.ReactElement} The rendered map placeholder.
 */
const MapComponent: React.FC<MapComponentProps> = ({ onMapClick }) => {
  /**
   * Local state to manage the visual position of the clicked pin.
   * 'null' indicates no pin has been set.
   */
  const [pinPosition, setPinPosition] = useState<MapCoordinates | null>(null);

  /**
   * Handles the 'click' event on the map placeholder.
   *
   * This function calculates the click coordinates relative to the map element,
   * updates the local state to display the pin, and calls the 'onMapClick'
   * callback prop to notify the parent of the new destination.
   *
   * @param {React.MouseEvent<HTMLDivElement>} e The mouse click event.
   */
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Get the bounding box of the map element to calculate relative coordinates.
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newCoords = { x, y };

    // 1. Update the local state to visually place the pin.
    setPinPosition(newCoords);
    
    // 2. Execute the parent's callback function with the new coordinates.
    onMapClick(newCoords);
  };

  return (
    <div className="map-placeholder" onClick={handleClick}>
      <p>Map Placeholder</p>
      <p>(Click to set destination)</p>
      
      {/*
        Conditionally render the pin element only if 'pinPosition' is not null.
        The pin's position is set using inline styles.
      */}
      {pinPosition && (
        <div 
          className="map-pin" 
          style={{ left: `${pinPosition.x}px`, top: `${pinPosition.y}px` }}
        />
      )}
    </div>
  );
};

export default MapComponent;