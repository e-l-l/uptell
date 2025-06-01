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

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  user: User | null;
  token: AuthToken | null;
  currentOrg: Organization | null;
  isAuthenticated: boolean;
}

// Default auth state
const defaultAuthState: AuthState = {
  user: null,
  token: null,
  currentOrg: null,
  isAuthenticated: false,
};

// Single atom for all auth state - Jotai handles localStorage automatically
export const authAtom = atomWithStorage<AuthState>(
  "uptell_auth_state",
  defaultAuthState
);

// Derived atoms for convenience (but all derive from single source)
export const isAuthenticatedAtom = atom((get) => get(authAtom).isAuthenticated);
export const userAtom = atom((get) => get(authAtom).user);
export const tokenAtom = atom((get) => get(authAtom).token);
export const currentOrgAtom = atom((get) => get(authAtom).currentOrg);

// Auth actions - much simpler with Jotai
export const signIn = atom(
  null,
  (
    get,
    set,
    { user, token, org }: { user: any; token: AuthToken; org: Organization }
  ) => {
    const simplifiedUser: User = {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata.first_name,
      lastName: user.user_metadata.last_name,
    };

    set(authAtom, {
      user: simplifiedUser,
      token,
      currentOrg: org,
      isAuthenticated: true,
    });
  }
);

export const signOut = atom(null, (get, set) => {
  set(authAtom, defaultAuthState);
});

export const setCurrentOrg = atom(
  null,
  (get, set, org: Organization | null) => {
    const currentState = get(authAtom);
    set(authAtom, {
      ...currentState,
      currentOrg: org,
    });
  }
);
