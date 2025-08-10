import axios from "axios";
import { Goal } from "../types/goal";
import { authStorage } from "../utils/authStorage";
import { API_ENDPOINTS } from "../config/api";

const getAuthHeaders = () => {
  const token = authStorage.getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const goalsApi = {
  async getAllGoals(): Promise<Goal[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.goals, {
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
        API_ENDPOINTS.goals,
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

  async updateGoal(goalId: string, updates: { text?: string; completed?: boolean }): Promise<Goal> {
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.goals}/${goalId}`,
        updates,
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
      await axios.delete(`${API_ENDPOINTS.goals}/${goalId}`, {
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