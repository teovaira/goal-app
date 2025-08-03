import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth"; 

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth(); 
  

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner visible"></div> 
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
