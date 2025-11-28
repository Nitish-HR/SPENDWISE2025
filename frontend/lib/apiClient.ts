import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response type
type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
};

// Error handler
const handleError = (error: unknown): ApiResponse => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      message: axiosError.message || 'An error occurred',
    };
  }
  return {
    success: false,
    message: 'An unexpected error occurred',
  };
};

// Client wrapper methods
export const client = {
  async get<T = any>(path: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.get<T>(path, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async post<T = any>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post<T>(path, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async put<T = any>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.put<T>(path, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async delete<T = any>(path: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.delete<T>(path, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return handleError(error);
    }
  },
};

export default apiClient;

