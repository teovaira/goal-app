import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import { authStorage } from "../utils/authStorage";

interface ProtectedRouteProps {
  children: ReactNode;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoading } = useAuth(); 
  

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner visible" role="status" aria-label="Loading"></div>
      </div>
    );
  }
  
  const token = authStorage.getAuthToken();

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
