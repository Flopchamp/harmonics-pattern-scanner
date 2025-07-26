import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Pattern API calls
export const patternAPI = {
  // Get all patterns
  getPatterns: async (filters = {}) => {
    try {
      const response = await api.get('/patterns', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching patterns:', error);
      throw error;
    }
  },

  // Trigger pattern detection
  detectPatterns: async (symbol, timeframe, priceData) => {
    try {
      const response = await api.post('/patterns/detect', {
        symbol,
        timeframe,
        priceData
      });
      return response.data;
    } catch (error) {
      console.error('Error detecting patterns:', error);
      throw error;
    }
  },

  // Get pattern statistics
  getStats: async () => {
    try {
      const response = await api.get('/patterns/stats/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching pattern stats:', error);
      throw error;
    }
  },

  // Test API connection
  healthCheck: async () => {
    try {
      const response = await axios.get('http://localhost:5000/health');
      return response.data;
    } catch (error) {
      console.error('API health check failed:', error);
      throw error;
    }
  }
};

// User API calls
export const userAPI = {
  // Test login
  testConnection: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.log('No user session found (expected)');
      return null;
    }
  }
};
