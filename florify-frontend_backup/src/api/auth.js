// src/api/auth.js
import axios from "axios";

// Replace with your API Gateway Invoke URL after deployment
const API_BASE_URL = "https://jiazehdrvf.execute-api.eu-north-1.amazonaws.com/dev";

// Create axios instance with better error handling
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || 'Server error occurred';
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
);

// ----------------- SIGNUP -----------------
export const signup = async (userData) => {
  try {
    const response = await api.post('/signup', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ----------------- LOGIN -----------------
export const login = async (userData) => {
  try {
    const response = await api.post('/login', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ----------------- CONFIRM -----------------
export const confirm = async (email, code) => {
  try {
    const response = await api.post('/confirm', {
      email,
      code,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ----------------- RESEND -----------------
export const resend = async (email) => {
  try {
    const response = await api.post('/resend', { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};
