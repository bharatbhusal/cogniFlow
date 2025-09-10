import { useCallback } from "react";
import {
	useAppDispatch,
	useAppSelector,
} from "../store/hooks";
import {
	loginUser,
	registerUser,
	getCurrentUser,
	logout,
	clearError as clearAuthError,
} from "../store/slices/authSlice";
import {
	selectUser,
	selectIsAuthenticated,
	selectAuthLoading,
	selectAuthError,
	selectToken,
} from "../store/selectors";
import { LoginRequest, RegisterRequest } from "../types";
import { persistUtils } from "../utils/persistence";

// Auth hook
export const useAuth = () => {
	const dispatch = useAppDispatch();

	const user = useAppSelector(selectUser);
	const isAuthenticated = useAppSelector(
		selectIsAuthenticated
	);
	const loading = useAppSelector(selectAuthLoading);
	const error = useAppSelector(selectAuthError);
	const token = useAppSelector(selectToken);

	const login = useCallback(
		(credentials: LoginRequest) =>
			dispatch(loginUser(credentials)),
		[dispatch]
	);

	const register = useCallback(
		(userData: RegisterRequest) =>
			dispatch(registerUser(userData)),
		[dispatch]
	);

	const fetchCurrentUser = useCallback(
		() => dispatch(getCurrentUser()),
		[dispatch]
	);

	const logoutUser = useCallback(async () => {
		const result = await dispatch(logout());
		// Also clear persisted state on logout
		await persistUtils.purgeAll();
		return result;
	}, [dispatch]);

	const clearError = useCallback(
		() => dispatch(clearAuthError()),
		[dispatch]
	);

	const clearAllData = useCallback(async () => {
		await logoutUser();
		await persistUtils.purgeAll();
	}, [logoutUser]);

	return {
		user,
		isAuthenticated,
		loading,
		error,
		token,
		login,
		register,
		fetchCurrentUser,
		logout: logoutUser,
		clearError,
		clearAllData,
		persistUtils,
	};
};
