import React from 'react';
import './Header.css'; // Imports the corresponding styles for this component.

/**
 * Defines the props for the Header component.
 *
 * This component is designed as a layout wrapper.
 * It utilizes 'React.PropsWithChildren' to automatically include
 * the 'children' prop, allowing other React elements to be nested inside.
 */
type HeaderProps = React.PropsWithChildren<{
  // No other specific props are needed for this component
}>;

/**
 * A reusable layout component that renders the main application header.
 *
 * This component acts as a container, applying consistent styling
 * (via 'app-header' class) and structure to all header content.
 *
 * @param {HeaderProps} props - The component props, primarily 'children'.
 * @returns {React.ReactElement} The rendered header element.
 */
const Header: React.FC<HeaderProps> = ({ children }) => {
  return (
    // Renders an HTML <header> element
    // All nested elements (children) are rendered inside.
    <header className="app-header">
      {children}
    </header>
  );
};

// Makes the Header component available for import elsewhere in the application.
export default Header;