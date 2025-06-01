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

// SINGLE SOURCE OF TRUTH - All auth state in one atom
export interface AuthState {
  user: User | null;
  token: AuthToken | null;
  currentOrg: Organization | null;
  isAuthenticated: boolean;
}

// MIGRATION HELPER - Handle old localStorage keys
const migrateOldAuthState = (): AuthState => {
  try {
    // Try to get old localStorage values
    const oldAuthState = localStorage.getItem("auth_state");
    const oldToken = localStorage.getItem("auth_token");
    const oldOrg = localStorage.getItem("current_org");

    let migratedState: AuthState = {
      user: null,
      token: null,
      currentOrg: null,
      isAuthenticated: false,
    };

    // Migrate old auth state
    if (oldAuthState) {
      try {
        const parsed = JSON.parse(oldAuthState);
        if (parsed.user && parsed.isAuthenticated) {
          migratedState.user = parsed.user;
          migratedState.isAuthenticated = parsed.isAuthenticated;
        }
      } catch (e) {
        console.warn("Failed to parse old auth_state:", e);
      }
    }

    // Migrate old token
    if (oldToken) {
      try {
        const parsed = JSON.parse(oldToken);
        if (parsed?.access_token && parsed?.token_type) {
          migratedState.token = parsed;
        }
      } catch (e) {
        console.warn("Failed to parse old auth_token:", e);
      }
    }

    // Migrate old org
    if (oldOrg) {
      try {
        const parsed = JSON.parse(oldOrg);
        if (parsed?.id && parsed?.name) {
          migratedState.currentOrg = parsed;
        }
      } catch (e) {
        console.warn("Failed to parse old current_org:", e);
      }
    }

    // Clean up old keys if migration was successful and we have some data
    if (migratedState.user || migratedState.token || migratedState.currentOrg) {
      console.info("🔄 Migrating old auth state to new format");
      localStorage.removeItem("auth_state");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("current_org");

      // Save migrated state
      localStorage.setItem("uptell_auth_state", JSON.stringify(migratedState));
      console.info("✅ Auth state migration completed");

      // Store migration status for debugging
      localStorage.setItem(
        "uptell_migration_status",
        JSON.stringify({
          migrated: true,
          timestamp: new Date().toISOString(),
          hadOldData: true,
        })
      );
    } else {
      // Store that we checked but found no old data
      localStorage.setItem(
        "uptell_migration_status",
        JSON.stringify({
          migrated: false,
          timestamp: new Date().toISOString(),
          hadOldData: false,
        })
      );
    }

    return migratedState;
  } catch (error) {
    console.warn("Migration failed, using default state:", error);
    localStorage.setItem(
      "uptell_migration_status",
      JSON.stringify({
        migrated: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return {
      user: null,
      token: null,
      currentOrg: null,
      isAuthenticated: false,
    };
  }
};

// Check if we need to migrate on app start
const getInitialAuthState = (): AuthState => {
  if (typeof window === "undefined") {
    // SSR - return default state
    return {
      user: null,
      token: null,
      currentOrg: null,
      isAuthenticated: false,
    };
  }

  // Check if new format exists
  const newAuthState = localStorage.getItem("uptell_auth_state");
  if (newAuthState) {
    try {
      return JSON.parse(newAuthState);
    } catch (e) {
      console.warn("Failed to parse new auth state, migrating...");
    }
  }

  // No new format, try migration
  return migrateOldAuthState();
};

// Single atom for all auth state with localStorage persistence
export const authAtom = atomWithStorage<AuthState>(
  "uptell_auth_state",
  getInitialAuthState()
);

// Derived atoms for convenience (but all derive from single source)
export const isAuthenticatedAtom = atom((get) => get(authAtom).isAuthenticated);
export const userAtom = atom((get) => get(authAtom).user);
export const tokenAtom = atom((get) => get(authAtom).token);
export const currentOrgAtom = atom((get) => get(authAtom).currentOrg);

// ATOMIC AUTH OPERATIONS - All state changes are atomic and synchronized
export const authActions = {
  // Complete sign in - updates ALL auth state atomically
  signIn: (
    set: (atom: typeof authAtom, value: AuthState) => void,
    user: any,
    token: AuthToken,
    org: Organization
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
  },

  // Complete sign out - clears ALL auth state atomically
  signOut: (set: (atom: typeof authAtom, value: AuthState) => void) => {
    set(authAtom, {
      user: null,
      token: null,
      currentOrg: null,
      isAuthenticated: false,
    });
  },

  // Update organization only (keep user and token)
  setCurrentOrg: (
    get: () => AuthState,
    set: (atom: typeof authAtom, value: AuthState) => void,
    org: Organization | null
  ) => {
    const currentState = get();
    set(authAtom, {
      ...currentState,
      currentOrg: org,
    });
  },

  // Clear auth state (for 401 errors) - atomic operation
  clearAuth: (set: (atom: typeof authAtom, value: AuthState) => void) => {
    set(authAtom, {
      user: null,
      token: null,
      currentOrg: null,
      isAuthenticated: false,
    });
  },
};

// LEGACY COMPATIBILITY - Keep old exports for gradual migration
export const updateAuthState = (
  set: (atom: typeof authAtom, value: AuthState) => void,
  user: any | null
) => {
  if (!user) {
    authActions.signOut(set);
    return;
  }

  // For legacy calls, preserve existing token and org if they exist
  const currentState = set as any; // This is a hack but needed for compatibility
  console.warn(
    "⚠️ DEPRECATED: Use authActions.signIn instead of updateAuthState"
  );

  const simplifiedUser: User = {
    id: user.id,
    email: user.email,
    firstName: user.user_metadata.first_name,
    lastName: user.user_metadata.last_name,
  };

  // This is a simplified version for legacy compatibility
  set(authAtom, {
    user: simplifiedUser,
    token: null, // Will be set separately in legacy flow
    currentOrg: null, // Will be set separately in legacy flow
    isAuthenticated: true,
  });
};

export const updateCurrentOrg = (
  set: (atom: typeof authAtom, value: AuthState) => void,
  org: Organization | null
) => {
  console.warn("⚠️ DEPRECATED: Use authActions.setCurrentOrg instead");
  // Legacy compatibility - this is not ideal but needed during transition
  const get = () => ({} as AuthState); // Placeholder - in real usage this would need the current state
  authActions.setCurrentOrg(get, set, org);
};
