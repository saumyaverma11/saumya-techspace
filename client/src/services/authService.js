import api from './api';

const TOKEN_KEY = 'admin_token';

export const authService = {
  /**
   * Login admin with credentials matching backend contract { email, password }
   */
  async login({ identifier, email, password }) {
    const emailToSubmit = (email || identifier || '').trim().toLowerCase();
    const res = await api.post('/auth/login', {
      email: emailToSubmit,
      password,
    });
    return res;
  },

  /**
   * Validate current session and retrieve admin profile
   */
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  /**
   * Request password reset link
   */
  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', {
      email: (email || '').trim().toLowerCase(),
    });
    return res;
  },

  /**
   * Token helpers
   */
  getStoredToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setStoredToken(token) {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  removeStoredToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

export default authService;
