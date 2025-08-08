import { createContext } from "react";
import { NotificationContextType } from "./NotificationTypes";

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);