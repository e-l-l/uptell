import axios, { AxiosError, AxiosInstance, AxiosRequestHeaders } from "axios";
import { getDefaultStore } from "jotai";
import { tokenAtom, updateAuthState } from "./atoms/auth";

interface ErrorResponse {
  detail?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private client: AxiosInstance;
  private store = getDefaultStore();

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
        const token = this.store.get(tokenAtom);
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `${token.token_type} ${token.access_token}`,
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
          this.store.set(tokenAtom, null);
          updateAuthState(this.store.set, null);
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
  async signUp(
    email: string,
    password: string,
    userData?: { firstName: string; lastName: string }
  ) {
    const response = await this.client.post("/auth/signup", {
      email,
      password,
      firstName: userData?.firstName,
      lastName: userData?.lastName,
    });
    return response.data;
  }

  async signIn(email: string, password: string) {
    const response = await this.client.post("/auth/signin", {
      email,
      password,
    });
    const { access_token, token_type, user } = response.data;

    // Update token in localStorage via Jotai
    this.store.set(tokenAtom, { access_token, token_type });

    // Update auth state
    updateAuthState(this.store.set, user);

    return response.data;
  }

  signOut() {
    this.store.set(tokenAtom, null);
    updateAuthState(this.store.set, null);
  }

  // Organization methods
  async createOrganization(name: string) {
    const response = await this.client.post("/organizations", { name });
    return response.data;
  }

  async listOrganizations() {
    const response = await this.client.get("/organizations");
    return response.data;
  }

  async getOrganization(orgId: string) {
    const response = await this.client.get(`/organizations/${orgId}`);
    return response.data;
  }

  async createOrganizationInvite(
    orgId: string,
    email: string,
    role: "owner" | "member"
  ) {
    const response = await this.client.post("/user-organizations/invites", {
      org_id: orgId,
      email,
      role,
    });
    return response.data;
  }

  async joinOrganization(code: string) {
    const response = await this.client.post(`/user-organizations/join/${code}`);
    return response.data;
  }

  async listUserOrganizations(userId: string) {
    const response = await this.client.get(
      `/user-organizations/user/${userId}`
    );
    return response.data;
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
