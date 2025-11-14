import axios from 'axios';

/**
 * The API endpoint for user authentication.
 * Assumes a reverse proxy is configured (e.g., in vite.config.ts)
 * to forward requests from '/auth/login' to the backend server.
 */
const API_URL = '/auth/login';

/**
 * Defines the expected shape of the successful login response payload,
 * which should contain a JSON Web Token (JWT).
 */
interface LoginResponse {
  access_token: string;
}

/**
 * Asynchronously logs in a user by sending credentials to the backend.
 *
 * @param {string} username The user's username.
 * @param {string} password The user's password.
 * @returns {Promise<boolean>} A promise that resolves to 'true' on success.
 * @throws {Error} Throws an error on login failure (e.g., wrong credentials).
 */
const login = async (username: string, password: string): Promise<boolean> => {
  
  // --- DEVELOPMENT SIMULATION BLOCK ---
  // This code simulates a successful login for frontend development
  // when the backend is not available.
  console.log('Simulating login for:', username);

  // 1. Manually set a mock token in localStorage.
  localStorage.setItem('user_token', 'this_is_a_fake_token_for_dev');

  // 2. Simulate network latency.
  await new Promise(resolve => setTimeout(resolve, 500)); 

  // 3. Return 'true' to indicate success.
  return true;
  // --- END DEVELOPMENT SIMULATION BLOCK ---


  /* --- PRODUCTION AUTHENTICATION LOGIC (Commented Out) ---
  try {
    // 1. Send credentials to the backend API endpoint.
    const response = await axios.post<LoginResponse>(API_URL, {
      username,
      password,
    });

    // 2. On a successful response, extract and store the JWT.
    if (response.data.access_token) {
      // 3. Store the token in localStorage for session persistence.
      localStorage.setItem('user_token', response.data.access_token);
      return true;
    }
    return false;

  } catch (err) {
    // 4. Handle network errors or 401 (Unauthorized) responses.
    console.error('Login failed:', err);
    throw new Error('Invalid username or password.');
  }
  --- END PRODUCTION LOGIC --- */
};

/**
 * Logs out the current user.
 * This function clears the session token from localStorage and
 * forces a redirect to the login page, effectively resetting the session.
 */
const logout = () => {
  localStorage.removeItem('user_token');
  // Redirect to the login page to ensure a clean state.
  window.location.href = '/login';
};

/**
 * Retrieves the current user's authentication token.
 *
 * @returns {string | null} The JWT string if it exists, or 'null'.
 */
const getCurrentUserToken = (): string | null => {
  return localStorage.getItem('user_token');
};

/**
 * Encapsulates the authentication functions into a single service object.
 */
const authService = {
  login,
  logout,
  getCurrentUserToken,
};

// Exports the service for use across the application.
export default authService;