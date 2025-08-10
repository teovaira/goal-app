import { createContext, useState, ReactNode, useEffect } from "react";
import { NavigateFunction } from "react-router-dom";
import { authStorage } from "../utils/authStorage";

interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (navigate: NavigateFunction) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    const token = authStorage.getAuthToken();
    const userData = authStorage.getUserData();

    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
      if (userData) {
        setUser(userData);
      }
    } else {
      authStorage.clearAuthData();
      setIsAuthenticated(false);
      setUser(null);
    }

    setIsLoading(false);
  }, []);
  

  const login = (navigate: NavigateFunction) => {
    setIsAuthenticated(true);
    const userData = authStorage.getUserData();
    if (userData) {
      setUser(userData);
    }
    navigate("/dashboard")
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    authStorage.clearAuthData();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
