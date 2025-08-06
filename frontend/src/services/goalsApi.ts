import axios from "axios";
import { Goal } from "../types/goal";

const API_URL = "http://localhost:5000/api/goals";

const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const goalsApi = {
  async getAllGoals(): Promise<Goal[]> {
    try {
      const response = await axios.get(API_URL, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Failed to fetch goals");
      }
      throw new Error("An unexpected error occurred");
    }
  },

  async createGoal(goalText: string): Promise<Goal> {
    try {
      const response = await axios.post(
        API_URL,
        { text: goalText },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Failed to create goal");
      }
      throw new Error("An unexpected error occurred");
    }
  },

  async updateGoal(goalId: string, goalText: string): Promise<Goal> {
    try {
      const response = await axios.put(
        `${API_URL}/${goalId}`,
        { text: goalText },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Failed to update goal");
      }
      throw new Error("An unexpected error occurred");
    }
  },

  async deleteGoal(goalId: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/${goalId}`, {
        headers: getAuthHeaders(),
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Failed to delete goal");
      }
      throw new Error("An unexpected error occurred");
    }
  },
};