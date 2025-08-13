export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {

  login: `${API_BASE_URL}/api/users/login`,
  register: `${API_BASE_URL}/api/users`,
  googleLogin: `${API_BASE_URL}/api/users/google-login`,
  googleRegister: `${API_BASE_URL}/api/users/google-register`,
  me: `${API_BASE_URL}/api/users/me`,
  
  
  goals: `${API_BASE_URL}/api/goals`,
};