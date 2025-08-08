export interface Notification {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
}

export interface NotificationContextType {
  showNotification: (message: string, type?: "success" | "error" | "info", duration?: number) => void;
}