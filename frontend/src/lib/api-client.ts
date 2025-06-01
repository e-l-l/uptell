import axios, { AxiosError, AxiosInstance, AxiosRequestHeaders } from "axios";
import { getDefaultStore } from "jotai";
import {
  tokenAtom,
  updateAuthState,
  currentOrgAtom,
  Organization,
} from "./atoms/auth";
import { toast } from "sonner";

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

        if (token?.access_token && token?.token_type) {
          const authHeader = `${token.token_type} ${token.access_token}`;
          config.headers = {
            ...config.headers,
            Authorization: authHeader,
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
        // Log error details for debugging
        console.error("API Error:", {
          status: error.response?.status,
          message: error.response?.data?.detail || error.message,
          url: error.config?.url,
          method: error.config?.method,
        });

        const status = error.response?.status;
        const errorMessage = error.response?.data?.detail || error.message;

        // Handle different types of errors
        if (status === 401) {
          // Handle unauthorized access
          const errorDetail = error.response?.data?.detail || "";

          // Check if it's a session expiry or invalid token
          if (
            errorDetail.includes("session has expired") ||
            errorDetail.includes("Invalid authentication token") ||
            errorDetail.includes("Missing authorization header")
          ) {
            // Clear auth state
            this.store.set(tokenAtom, null);
            updateAuthState(this.store.set, null);
            this.store.set(currentOrgAtom, null);

            // Show toast for session expiry
            toast.error("Session expired. Please log in again.");

            // Only redirect if not already on auth pages
            const currentPath = window.location.pathname;
            if (
              !currentPath.includes("/login") &&
              !currentPath.includes("/signup") &&
              !currentPath.includes("/join")
            ) {
              window.location.href = "/login";
            }
          } else {
            // Show generic unauthorized toast
            toast.error("Unauthorized access. Please check your permissions.");
          }
        } else if (status === 403) {
          toast.error(
            "Access forbidden. You don't have permission to perform this action."
          );
        } else if (status === 404) {
          toast.error(
            "Resource not found. The requested item may have been deleted."
          );
        } else if (status === 422) {
          toast.error(
            "Invalid data provided. Please check your input and try again."
          );
        } else if (status === 429) {
          toast.error(
            "Too many requests. Please wait a moment before trying again."
          );
        } else if (status && status >= 500) {
          toast.error(
            "Server error occurred. Please try again later or contact support."
          );
        } else if (
          error.code === "ECONNABORTED" ||
          error.message.includes("timeout")
        ) {
          toast.error(
            "Request timed out. Please check your connection and try again."
          );
        } else if (error.code === "ERR_NETWORK" || !error.response) {
          toast.error("Network error. Please check your internet connection.");
        } else if (status && status >= 400 && status < 500) {
          // Other client errors
          toast.error(
            errorMessage || "An error occurred while processing your request."
          );
        }

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
    const { access_token, token_type, user, org } = response.data;

    this.store.set(tokenAtom, { access_token, token_type });
    this.store.set(currentOrgAtom, org);
    updateAuthState(this.store.set, user);

    return response.data;
  }

  signOut() {
    this.store.set(tokenAtom, null);
    updateAuthState(this.store.set, null);
    this.store.set(currentOrgAtom, null);
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

  async setCurrentOrganization(org: Organization) {
    this.store.set(currentOrgAtom, org);
  }

  async createOrganizationInvite(
    orgId: string,
    email: string,
    role: "owner" | "member",
    expiresAt?: Date
  ) {
    const response = await this.client.post("/user-organizations/invites", {
      org_id: orgId,
      email,
      role,
      expires_at: expiresAt?.toISOString(),
    });
    return response.data;
  }

  async getInviteDetails(code: string) {
    const response = await this.client.get(
      `/user-organizations/invites/${code}`
    );
    return response.data;
  }

  async joinOrganization(code: string) {
    const response = await this.client.post(`/user-organizations/join/${code}`);
    const { organization } = response.data;
    // Set the joined organization as current
    this.store.set(currentOrgAtom, organization);
    return response.data;
  }

  async listUserOrganizations(userId: string) {
    const response = await this.client.get(
      `/user-organizations/user/${userId}`
    );
    return response.data;
  }

  async addUserToOrganization(
    userId: string,
    orgId: string,
    role: "owner" | "member"
  ) {
    const response = await this.client.post("/user-organizations", {
      user_id: userId,
      org_id: orgId,
      role,
    });
    return response.data;
  }

  async listOrganizationMembers(orgId: string) {
    const response = await this.client.get(`/user-organizations/orgs/${orgId}`);
    return response.data;
  }

  async updateUserRole(userOrgId: string, role: "owner" | "member") {
    const response = await this.client.patch(
      `/user-organizations/${userOrgId}`,
      {
        role,
      }
    );
    return response.data;
  }

  async removeUserFromOrganization(userId: string, orgId: string) {
    const response = await this.client.delete(
      `/user-organizations/${userId}/${orgId}`
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

  async patch<T>(url: string, data?: any) {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string) {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
