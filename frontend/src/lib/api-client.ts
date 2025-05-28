import axios, { AxiosError, AxiosInstance, AxiosRequestHeaders } from "axios";
import { tokenStorage } from "./token";

interface ErrorResponse {
  detail?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const authHeader = tokenStorage.getAuthHeader();
        if (Object.keys(authHeader).length > 0) {
          config.headers = {
            ...config.headers,
            ...authHeader,
          } as AxiosRequestHeaders;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ErrorResponse>) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          tokenStorage.removeToken();
          // You might want to redirect to login page here
          window.location.href = "/login";
        }
        // Extract error message from response.detail if available
        const errorMessage = error.response?.data?.detail || error.message;
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  // Auth methods
  async signUp(email: string, password: string) {
    const response = await this.client.post("/auth/signup", {
      email,
      password,
    });
    return response.data;
  }

  async signIn(email: string, password: string) {
    const response = await this.client.post("/auth/signin", {
      email,
      password,
    });
    const tokenData = response.data;
    tokenStorage.setToken(tokenData);
    return tokenData;
  }

  signOut() {
    tokenStorage.removeToken();
  }

  // Generic request methods
  async get<T>(url: string, params?: any) {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any) {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any) {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string) {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
