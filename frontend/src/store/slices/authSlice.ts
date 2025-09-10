import {
	createSlice,
	createAsyncThunk,
	PayloadAction,
} from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";
import {
	AuthState,
	LoginRequest,
	RegisterRequest,
	User,
} from "../../types";
import { apiClient } from "../../services/api";

// Initial state
const initialState: AuthState = {
	user: null,
	token: null,
	isAuthenticated: false,
	loading: false,
	error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
	"auth/login",
	async (credentials: LoginRequest, { rejectWithValue }) => {
		try {
			const response = await apiClient.login(credentials);
			localStorage.setItem(
				"access_token",
				response.data.access_token
			);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(error.message);
		}
	}
);

export const registerUser = createAsyncThunk(
	"auth/register",
	async (userData: RegisterRequest, { rejectWithValue }) => {
		try {
			const response = await apiClient.register(userData);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(error.message);
		}
	}
);

export const getCurrentUser = createAsyncThunk(
	"auth/getCurrentUser",
	async (_, { rejectWithValue }) => {
		try {
			const response = await apiClient.getCurrentUser();
			return (response as any).data.user;
		} catch (error: any) {
			return rejectWithValue(error.message);
		}
	}
);

export const logout = createAsyncThunk(
	"auth/logout",
	async () => {
		localStorage.removeItem("access_token");
		return null;
	}
);

// Auth slice
const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
		setToken: (state, action: PayloadAction<string>) => {
			state.token = action.payload;
			state.isAuthenticated = true;
			localStorage.setItem("access_token", action.payload);
		},
		clearAuth: (state) => {
			state.user = null;
			state.token = null;
			state.isAuthenticated = false;
			localStorage.removeItem("access_token");
		},
	},
	extraReducers: (builder) => {
		// Handle rehydration from persistence
		builder.addCase(REHYDRATE, (state, action: any) => {
			if (action.payload?.auth) {
				const persistedAuth = action.payload.auth;
				// Only restore user and token, not loading/error states
				state.user = persistedAuth.user;
				state.token = persistedAuth.token;
				state.isAuthenticated =
					!!persistedAuth.token && !!persistedAuth.user;

				// Sync with localStorage
				if (persistedAuth.token) {
					localStorage.setItem(
						"access_token",
						persistedAuth.token
					);
				}
			}
		});

		// Login
		builder
			.addCase(loginUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(loginUser.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload.user;
				state.token = action.payload.access_token;
				state.isAuthenticated = true;
				state.error = null;
			})
			.addCase(loginUser.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
				state.isAuthenticated = false;
			});

		// Register
		builder
			.addCase(registerUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(registerUser.fulfilled, (state) => {
				state.loading = false;
				state.error = null;
			})
			.addCase(registerUser.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});

		// Get current user
		builder
			.addCase(getCurrentUser.pending, (state) => {
				state.loading = true;
			})
			.addCase(getCurrentUser.fulfilled, (state, action) => {
				state.loading = false;
				if (action.payload) {
					state.user = action.payload;
					state.isAuthenticated = true;
				}
			})
			.addCase(getCurrentUser.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
				state.isAuthenticated = false;
				state.token = null;
				localStorage.removeItem("access_token");
			});

		// Logout
		builder.addCase(logout.fulfilled, (state) => {
			state.user = null;
			state.token = null;
			state.isAuthenticated = false;
			state.loading = false;
			state.error = null;
		});
	},
});

export const { clearError, setToken, clearAuth } =
	authSlice.actions;
export default authSlice.reducer;
