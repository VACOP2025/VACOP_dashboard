import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import './LoginPage.css'; // Imports component-specific styles

/**
 * Renders the user login page.
 *
 * This component provides a form for users to authenticate.
 * It manages form state (username, password, error) and handles
 * the submission process by communicating with the 'authService'.
 *
 * @returns {React.ReactElement} The rendered login page component.
 */
const LoginPage: React.FC = () => {
  // --- Component State ---

  // Manages the value of the username input field.
  const [username, setUsername] = useState<string>('');
  
  // Manages the value of the password input field.
  const [password, setPassword] = useState<string>('');
  
  // Manages the display of login-related error messages.
  const [error, setError] = useState<string | null>(null);
  
  // --- Hooks ---

  // React Router hook for programmatic navigation after login.
  const navigate = useNavigate();

  // --- Event Handlers ---

  /**
   * Handles the 'submit' event of the login form.
   * This function prevents the default form submission, calls the
   * 'authService' to attempt a login, and navigates to the root
   * page ('/') on success or displays an error on failure.
   *
   * @param {React.FormEvent<HTMLFormElement>} e The form submission event.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Prevent the default browser behavior of a full-page reload.
    e.preventDefault();
    setError(null); // Clear any previous submission errors.

    try {
      // Asynchronously call the login method from the auth service.
      const success = await authService.login(username, password);
      
      if (success) {
        // On successful authentication, navigate to the main application page.
        navigate('/'); 
      }
    } catch (err) {
      // Handle errors (e.g., incorrect credentials) from the auth service.
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  // --- Render ---
  
  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h3>Login</h3>
        
        {/* Username Input Group */}
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username} // Binds the input value to the 'username' state.
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            required
          />
        </div>

        {/* Password Input Group */}
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password} // Binds the input value to the 'password' state.
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Conditional rendering for displaying login errors */}
        {error && <p className="error-message">{error}</p>}

        {/* Form Submit Button */}
        <button type="submit" className="login-button">Login</button>

        {/* Placeholder link for user registration */}
        <div className="register-link">
          <Link to="#">Register</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;