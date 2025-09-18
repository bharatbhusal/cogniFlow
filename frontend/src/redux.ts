// Store exports
export { store, persistor } from "./store";
export {
	useAppDispatch,
	useAppSelector,
} from "./store/hooks";
export * from "./store/selectors";

// Auth slice exports
export {
	requestOTP,
	loginUser,
	registerUser,
	getCurrentUser,
	logout,
	setToken,
	clearAuth,
} from "./store/slices/authSlice";

// Projects slice exports
export {
	createProject,
	fetchProjects,
	fetchProject,
	updateProject,
	deleteProject,
	queryProject,
	setCurrentProject,
	clearCurrentProject,
	updateProjectInList,
	addProjectToList,
	removeProjectFromList,
} from "./store/slices/projectSlice";

// UI slice exports
export {
	toggleTheme,
	setTheme,
	toggleSidebar,
	setSidebarOpen,
} from "./store/slices/uiSlice";

// Hook exports
export { useAuth } from "./hooks/useAuth";
export { useAuthRehydration } from "./hooks/useAuthRehydration";
export { useProjects } from "./hooks/useProjects";
export { useUI } from "./hooks/useUI";

// Provider exports
export { ReduxProvider } from "./components/providers/ReduxProvider";

// Utility exports
export { persistUtils } from "./utils/persistence";

// Type exports
export * from "./types";

// API client export
export { apiClient } from "./services/api";
