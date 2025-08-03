import React, { ReactNode, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth"; 

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth(); 
  const [showSpinner, setShowSpinner] = useState<boolean>(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowSpinner(true);
      }, 500); 

      return () => clearTimeout(timer); 
    } else {
      setShowSpinner(false); 
    }
  }, [isLoading]);

  
  if (showSpinner) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner"></div> 
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
