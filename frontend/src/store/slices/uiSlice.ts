import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UIState } from "../../types";

// Initial state
const initialState: UIState = {
  theme: "light",
  sidebarOpen: true,
};

// UI slice
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { toggleTheme, setTheme, toggleSidebar, setSidebarOpen } =
  uiSlice.actions;

export default uiSlice.reducer;
