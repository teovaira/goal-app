import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import { Goal } from "../types/goal";
import { goalsApi } from "../services/goalsApi";

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newGoalText, setNewGoalText] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedGoals = await goalsApi.getAllGoals();
        setGoals(fetchedGoals);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch goals";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      const newGoal = await goalsApi.createGoal(newGoalText.trim());
      setGoals([...goals, newGoal]);
      setNewGoalText("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create goal";
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Goals</h2>
          
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-600">Loading your goals...</div>
            </div>
          )}
          
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}
          
          {!isLoading && !error && goals.length > 0 && (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal._id}
                  className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <p className="text-gray-800 font-medium">{goal.text}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Created: {new Date(goal.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isLoading && !error && goals.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-6">
                <p className="text-lg font-medium mb-2">No goals yet!</p>
                <p>Start by creating your first goal to track your progress.</p>
              </div>
              
              <form onSubmit={handleCreateGoal} className="max-w-md mx-auto">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    placeholder="Enter your goal..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isCreating}
                  />
                  <button
                    type="submit"
                    disabled={isCreating || !newGoalText.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? "Creating..." : "Create Goal"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
