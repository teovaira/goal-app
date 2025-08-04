import React, { createContext, useState, ReactNode, useEffect } from "react";
import { NavigateFunction } from "react-router-dom";


export interface AuthContextType {
  isAuthenticated: boolean;
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
  const [isLoading, setIsLoading] = useState<boolean>(true);


  useEffect(() => {
    const token = localStorage.getItem("authToken");

     if (token) {
       setIsAuthenticated(true); 
     } else {
       setIsAuthenticated(false); 
     }

    setIsLoading(false);
  }, []);
  

  const login = (navigate: NavigateFunction) => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true"); 
    navigate("/dashboard")
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("authToken"); 
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
