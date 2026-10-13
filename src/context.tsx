import { createContext, useContext } from "react";
import type { AppState, Course } from "./types";
export interface AppContextType {
  state: AppState;
  course: Course;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  health: any;
}
export const AppContext = createContext<AppContextType | null>(null);
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("Application context missing");
  return ctx;
}
