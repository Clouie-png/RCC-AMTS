// src/config/api.js

/**
 * API Base URL Configuration
 * 
 * This file centralizes the API base URL configuration for the application.
 * It uses Vite's environment variables to allow easy switching between
 * development and production environments.
 * 
 * In development, it defaults to 'http://localhost:3001'.
 * In production, it uses the value of VITE_API_URL from the environment.
 * 
 * To use:
 * import { API_BASE_URL } from '@/config/api';
 * const apiUrl = `${API_BASE_URL}/your-endpoint`;
 */

// Use environment variable for API URL, with a fallback for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Re-export for convenience if needed elsewhere
export default API_BASE_URL;