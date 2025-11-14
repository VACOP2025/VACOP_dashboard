import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../../services/authService';

/**
 * A route guard component for React Router.
 *
 * This component checks the user's authentication status via the 'authService'.
 * If the user is authenticated, it renders the nested child route (using <Outlet />).
 * If the user is not authenticated, it automatically redirects them to the '/login' path,
 * replacing the current entry in the navigation history.
 *
 * @returns {React.ReactElement} Either the <Outlet /> for the child route or a <Navigate /> component.
 */
const PrivateRoute: React.FC = () => {
  
  // Check the user's authentication status from the auth service.
  // The '!!' operator coerces the result (e.g., a token string or null) into a boolean.
  const isLoggedIn = !!authService.getCurrentUserToken(); 

  // Conditionally render the protected content or the redirect.
  // 'replace' is used to prevent the login page from being added to the history stack,
  // so the user cannot navigate "back" to it after logging in.
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;