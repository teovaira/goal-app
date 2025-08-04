import React, { createContext, useState, ReactNode, useEffect } from "react";
import { NavigateFunction } from "react-router-dom";

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
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch {
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");
        }
      }
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      setIsAuthenticated(false);
      setUser(null);
    }

    setIsLoading(false);
  }, []);
  

  const login = (navigate: NavigateFunction) => {
    setIsAuthenticated(true);
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        console.error("Failed to parse user data");
      }
    }
    navigate("/dashboard")
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("isAuthenticated");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
