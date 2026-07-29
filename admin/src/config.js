// Centralized API base URL. Vite exposes env vars prefixed with VITE_ via
// import.meta.env. Set VITE_API_URL in Render's environment variables when
// deploying; falls back to localhost for local development.
export const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
