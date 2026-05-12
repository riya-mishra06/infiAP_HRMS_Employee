// Environment configuration for API URLs
// Use Vite's environment variable system

const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

export const API_CONFIG = {
  baseURL: getApiUrl(),
  uploadsURL: `${getApiUrl()}/uploads`,
  socketURL: getApiUrl(),
};

export default API_CONFIG;