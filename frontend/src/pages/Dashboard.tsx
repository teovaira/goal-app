import React from "react";
import { useNavigate } from "react-router-dom";
import useAuth  from "../context/useAuth"; 

const Dashboard = () => {
  const { logout } = useAuth(); 
  const navigate = useNavigate(); 

  const handleLogout = () => {
    logout(); 
    navigate("/login"); 
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-3xl font-semibold">Welcome to the Dashboard</h2>
        <p className="mt-4 mb-6">This is your user dashboard.</p>
        <button
          className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleLogout} 
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
