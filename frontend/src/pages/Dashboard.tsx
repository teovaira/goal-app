import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import { useNotification } from "../context/useNotification";
import { Goal } from "../types/goal";
import { goalsApi } from "../services/goalsApi";

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newGoalText, setNewGoalText] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  
  type FilterType = 'all' | 'active' | 'completed';
  const [filter, setFilter] = useState<FilterType>('all');

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
      showNotification("Goal created successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create goal";
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateGoal = async (goalId: string, newText: string) => {
    if (!newText.trim()) return;

    try {
      setIsUpdating(true);
      setError(null);
      const updatedGoal = await goalsApi.updateGoal(goalId, { text: newText.trim() });
      setGoals(goals.map(goal => goal._id === goalId ? updatedGoal : goal));
      setEditingGoalId(null);
      setEditedText("");
      showNotification("Goal updated successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update goal";
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleComplete = async (goalId: string, currentStatus: boolean) => {
    try {
      setError(null);
      const updatedGoal = await goalsApi.updateGoal(goalId, { completed: !currentStatus });
      setGoals(goals.map(goal => goal._id === goalId ? updatedGoal : goal));
      showNotification(`Goal marked as ${!currentStatus ? 'completed' : 'incomplete'}!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update goal status";
      setError(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setEditedText("");
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      setDeletingGoalId(goalId);
      setError(null);
      await goalsApi.deleteGoal(goalId);
      setGoals(goals.filter(goal => goal._id !== goalId));
      showNotification("Goal deleted successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete goal";
      setError(errorMessage);
    } finally {
      setDeletingGoalId(null);
    }
  };

  const handleLogout = () => {
    showNotification("Logged out successfully!");
    logout();
    navigate("/login");
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    if (filter === 'active') return !goal.completed;
    if (filter === 'completed') return goal.completed;
    return true;
  });

  const completedGoalsCount = goals.filter(goal => goal.completed).length;
  const totalGoalsCount = goals.length;
  
  const filteredTotalCount = filteredGoals.length;

  return (
    <main className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome to Dashboard!
              </h1>
              <p className="text-gray-700 mt-1 text-sm sm:text-base">goal management system</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors min-h-[44px] w-full sm:w-auto"
            >
              Logout
            </button>
          </div>
        </div>

        
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Your Goals</h2>
              {totalGoalsCount > 0 && (
                <p className="text-xs sm:text-sm text-gray-700 mt-1">
                  {filter === 'all' ? (
                    <>
                      {completedGoalsCount} of {totalGoalsCount} completed
                      {completedGoalsCount === totalGoalsCount && totalGoalsCount > 0 && " 🏆"}
                    </>
                  ) : (
                    <>
                      Showing {filteredTotalCount} {filter} goal{filteredTotalCount !== 1 ? 's' : ''}
                    </>
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1 rounded-md text-sm font-medium transition-colors min-h-[40px] sm:min-h-0 ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1 rounded-md text-sm font-medium transition-colors min-h-[40px] sm:min-h-0 ${
                  filter === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1 rounded-md text-sm font-medium transition-colors min-h-[40px] sm:min-h-0 ${
                  filter === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
          
          <div className="mb-6 sm:mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">Create New Goal</h3>
            <form onSubmit={handleCreateGoal}>
              <div className="flex flex-col sm:flex-row gap-3">
                <label htmlFor="new-goal-input" className="sr-only">
                  Enter your goal
                </label>
                <input
                  type="text"
                  id="new-goal-input"
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  placeholder="Enter your goal..."
                  className="flex-1 px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  disabled={isCreating}
                />
                <button
                  type="submit"
                  disabled={isCreating || !newGoalText.trim()}
                  className="px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] w-full sm:w-auto"
                >
                  {isCreating ? "Creating..." : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
          
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-700">Loading your goals...</div>
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
              {filteredGoals.length === 0 ? (
                <div className="text-center py-8 text-gray-700">
                  <p className="text-lg font-medium mb-2">
                    No {filter === 'all' ? '' : filter} goals found
                  </p>
                  <p className="text-sm">
                    {filter === 'active' && "You've completed all your goals! 🎉"}
                    {filter === 'completed' && "No completed goals yet. Keep working on your active goals!"}
                  </p>
                </div>
              ) : (
                filteredGoals.map((goal) => (
                <div
                  key={goal._id}
                  className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {editingGoalId === goal._id ? (
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          handleUpdateGoal(goal._id, editedText);
                        }} className="w-full">
                          <label htmlFor={`edit-goal-${goal._id}`} className="sr-only">
                            Edit goal text
                          </label>
                          <input
                            type="text"
                            id={`edit-goal-${goal._id}`}
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                            disabled={isUpdating}
                          />
                          <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <button
                              type="submit"
                              disabled={isUpdating || !editedText.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[40px] w-full sm:w-auto"
                            >
                              {isUpdating ? "Updating..." : "Update"}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors text-sm min-h-[40px] w-full sm:w-auto"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id={`goal-checkbox-${goal._id}`}
                              checked={goal.completed}
                              onChange={() => handleToggleComplete(goal._id, goal.completed)}
                              className="mt-0.5 sm:mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer min-w-[20px] min-h-[20px]"
                              aria-label={`Mark "${goal.text}" as ${goal.completed ? 'incomplete' : 'complete'}`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm sm:text-base text-gray-800 font-medium break-words ${goal.completed ? 'line-through text-gray-500' : ''}`}>
                                {goal.text}
                              </p>
                              <div className="mt-1 text-xs sm:text-sm text-gray-700">
                                Created: {new Date(goal.createdAt).toLocaleDateString()}
                                {goal.completed && (
                                  <span className="ml-2 text-green-600">✓ Completed</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => {
                                setEditingGoalId(goal._id);
                                setEditedText(goal.text);
                              }}
                              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors text-sm min-h-[40px] w-full sm:w-auto"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete this goal?\n\n"${goal.text}"`)) {
                                  handleDeleteGoal(goal._id);
                                }
                              }}
                              disabled={deletingGoalId === goal._id}
                              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] w-full sm:w-auto"
                            >
                              {deletingGoalId === goal._id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          )}
          
          {!isLoading && !error && goals.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-700">
                <p className="text-lg font-medium mb-2">No goals yet!</p>
                <p className="text-sm sm:text-base">Use the form above to create your first goal and start tracking your progress.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
