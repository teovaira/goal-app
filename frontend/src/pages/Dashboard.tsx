import React from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import { Goal } from "../types/goal";

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const hardcodedGoal: Goal = {
    id: "1",
    text: "Learn React fundamentals"
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to Dashboard!
              </h1>
              <p className="text-gray-600 mt-1">goal management system</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Goals Section</h2>
          <p className="text-gray-600">
            {hardcodedGoal.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
