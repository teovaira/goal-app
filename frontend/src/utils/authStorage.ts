interface UserData {
  _id: string;
  name: string;
  email: string;
}

export const authStorage = {
  setAuthData: (token: string, userData: UserData): void => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
  },

  getAuthToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  getUserData: (): UserData | null => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  },

  clearAuthData: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('isAuthenticated');
  }
};