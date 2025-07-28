import axios, { AxiosInstance } from 'axios';

// Shared axios client for API requests
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${process.env.BASE_URL}/api`
});