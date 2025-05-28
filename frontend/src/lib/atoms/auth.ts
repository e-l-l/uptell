import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Atom for storing auth state in localStorage
export const authAtom = atomWithStorage<AuthState>("auth_state", {
  user: null,
  isAuthenticated: false,
});

// Atom for storing token in localStorage
export const tokenAtom = atomWithStorage<{
  access_token: string;
  token_type: string;
} | null>("auth_token", null);

// Atom for storing current organization in localStorage
export const currentOrgAtom = atomWithStorage<Organization | null>(
  "current_org",
  null
);

// Derived atom to check if user is authenticated
export const isAuthenticatedAtom = atom((get) => get(authAtom).isAuthenticated);

// Atom for storing user data
export const userAtom = atom((get) => get(authAtom).user);

// Helper function to update auth state
export const updateAuthState = (
  set: (atom: typeof authAtom, value: AuthState) => void,
  user: any | null
) => {
  if (!user) {
    set(authAtom, {
      user: null,
      isAuthenticated: false,
    });
    return;
  }

  // Transform the user data to our simplified format
  const simplifiedUser: User = {
    id: user.id,
    email: user.email,
    firstName: user.user_metadata.first_name,
    lastName: user.user_metadata.last_name,
  };

  set(authAtom, {
    user: simplifiedUser,
    isAuthenticated: true,
  });
};

// Helper function to update current organization
export const updateCurrentOrg = (
  set: (atom: typeof currentOrgAtom, value: Organization | null) => void,
  org: Organization | null
) => {
  set(currentOrgAtom, org);
};
