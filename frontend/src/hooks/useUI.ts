import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
} from "../store/slices/uiSlice";
import { selectTheme, selectSidebarOpen } from "../store/selectors";

// UI hook
export const useUI = () => {
  const dispatch = useAppDispatch();

  const theme = useAppSelector(selectTheme);
  const sidebarOpen = useAppSelector(selectSidebarOpen);

  const toggle = useCallback(() => dispatch(toggleTheme()), [dispatch]);

  const setThemeMode = useCallback(
    (mode: "light" | "dark") => dispatch(setTheme(mode)),
    [dispatch]
  );

  const toggleSidebarOpen = useCallback(
    () => dispatch(toggleSidebar()),
    [dispatch]
  );

  const setSidebar = useCallback(
    (open: boolean) => dispatch(setSidebarOpen(open)),
    [dispatch]
  );

  return {
    theme,
    sidebarOpen,
    toggleTheme: toggle,
    setTheme: setThemeMode,
    toggleSidebar: toggleSidebarOpen,
    setSidebarOpen: setSidebar,
  };
};
