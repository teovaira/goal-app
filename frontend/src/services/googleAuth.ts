import axios, { AxiosError } from 'axios';
import { CredentialResponse } from '@react-oauth/google';
import { NavigateFunction } from 'react-router-dom';
import { authStorage } from '../utils/authStorage';
import { API_ENDPOINTS } from '../config/api';

interface GoogleAuthResponse {
  token: string;
  _id: string;
  name: string;
  email: string;
}

export const authenticateWithGoogle = async (
  credentialResponse: CredentialResponse,
  isRegistration: boolean = false
): Promise<GoogleAuthResponse> => {
  try {
    const endpoint = isRegistration ? API_ENDPOINTS.googleRegister : API_ENDPOINTS.googleLogin;
    
    const response = await axios.post(endpoint, {
      token: credentialResponse.credential,
    });

    return response.data;
  } catch (error) {
    console.error('Google authentication error:', error);
    throw error;
  }
};

export const handleGoogleSuccess = async (
  credentialResponse: CredentialResponse,
  login: (navigate: NavigateFunction) => void,
  navigate: NavigateFunction,
  isRegistration: boolean = false,
  showNotification?: (message: string, type?: "success" | "error" | "info") => void
): Promise<void> => {
  try {
    const authData = await authenticateWithGoogle(credentialResponse, isRegistration);
    
    // Store token and user data
    const userData = {
      _id: authData._id,
      name: authData.name,
      email: authData.email,
    };
    authStorage.setAuthData(authData.token, userData);
    
    // Show success notification if provided
    if (showNotification) {
      const message = isRegistration
        ? "Registration successful! Welcome to Goal Tracker."
        : "Welcome back! Login successful.";
      showNotification(message);
    }
    
    // Use the existing login function from AuthContext
    login(navigate);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Google authentication failed');
    }
    throw new Error('Google authentication failed');
  }
};