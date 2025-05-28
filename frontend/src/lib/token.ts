export interface TokenData {
  access_token: string;
  token_type: string;
}

const TOKEN_KEY = "auth_token";

export const tokenStorage = {
  getToken: (): TokenData | null => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      return token ? JSON.parse(token) : null;
    } catch (error) {
      console.error("Error reading token from storage:", error);
      return null;
    }
  },

  setToken: (token: TokenData): void => {
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    } catch (error) {
      console.error("Error saving token to storage:", error);
    }
  },

  removeToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error("Error removing token from storage:", error);
    }
  },

  getAuthHeader: (): { Authorization: string } | {} => {
    const token = tokenStorage.getToken();
    return token
      ? { Authorization: `${token.token_type} ${token.access_token}` }
      : {};
  },
};
