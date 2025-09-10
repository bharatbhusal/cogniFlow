import axios, {
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
} from "axios";
import {
	ApiResponse,
	AuthResponse,
	LoginRequest,
	RegisterRequest,
	Project,
	ProjectListResponse,
	CreateProjectRequest,
	QueryRequest,
	QueryResponse,
} from "../types";

class ApiClient {
	private client: AxiosInstance;

	constructor(
		baseURL: string = import.meta.env.VITE_API_BASE_URL
	) {
		this.client = axios.create({
			baseURL,
			timeout: 30000,
		});

		// Request interceptor to add auth token
		this.client.interceptors.request.use(
			(config) => {
				const token = localStorage.getItem("access_token");
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			(error) => Promise.reject(error)
		);

		// Response interceptor for error handling
		this.client.interceptors.response.use(
			(response) => response,
			(error) => {
				if (error.response?.status === 401) {
					// Clear token and redirect to login
					localStorage.removeItem("access_token");
					window.location.href = "/login";
				}
				return Promise.reject(error);
			}
		);
	}

	// Generic request method
	private async request<T>(
		config: AxiosRequestConfig
	): Promise<T> {
		try {
			const response: AxiosResponse<T> =
				await this.client.request(config);
			return response.data;
		} catch (error: any) {
			throw this.handleError(error);
		}
	}

	private handleError(error: any): Error {
		if (error.response) {
			// Server responded with error status
			const message =
				error.response.data?.message ||
				error.response.data?.detail ||
				"An error occurred";
			return new Error(message);
		} else if (error.request) {
			// Request was made but no response received
			return new Error(
				"Network error - please check your connection"
			);
		} else {
			// Something else happened
			return new Error(
				error.message || "An unexpected error occurred"
			);
		}
	}

	// Auth API methods
	async login(
		credentials: LoginRequest
	): Promise<AuthResponse> {
		return this.request<AuthResponse>({
			method: "POST",
			url: "/auth/login",
			data: credentials,
		});
	}

	async register(
		userData: RegisterRequest
	): Promise<ApiResponse> {
		return this.request<ApiResponse>({
			method: "POST",
			url: "/auth/register",
			data: userData,
		});
	}

	async getCurrentUser(): Promise<{ user: any }> {
		return this.request<{ user: any }>({
			method: "GET",
			url: "/auth/me",
		});
	}

	// Project API methods
	async createProject(
		projectData: CreateProjectRequest
	): Promise<ApiResponse<Project>> {
		const formData = new FormData();
		formData.append("name", projectData.name);

		if (projectData.description) {
			formData.append("description", projectData.description);
		}

		const files = projectData.pdf_files;
		if (files) {
			files.forEach((file: File) => {
				formData.append("pdf_files", file);
			});
		}

		return this.request<ApiResponse<Project>>({
			method: "POST",
			url: "/projects",
			data: formData,
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	}

	async getProjects(): Promise<
		ApiResponse<ProjectListResponse>
	> {
		return this.request<ApiResponse<ProjectListResponse>>({
			method: "GET",
			url: "/projects/",
		});
	}

	async getProject(
		projectId: string
	): Promise<ApiResponse<Project>> {
		return this.request<ApiResponse<Project>>({
			method: "GET",
			url: `/projects/${projectId}`,
		});
	}

	async updateProject(
		projectId: string,
		projectData: Partial<CreateProjectRequest>
	): Promise<ApiResponse<Project>> {
		const formData = new FormData();

		if (projectData.name) {
			formData.append("name", projectData.name);
		}

		if (projectData.description) {
			formData.append("description", projectData.description);
		}

		const files = projectData.pdf_files;
		if (files) {
			files.forEach((file: File) => {
				formData.append("pdf_files", file);
			});
		}

		return this.request<ApiResponse<Project>>({
			method: "PUT",
			url: `/projects/${projectId}`,
			data: formData,
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	}

	async deleteProject(
		projectId: string
	): Promise<ApiResponse> {
		return this.request<ApiResponse>({
			method: "DELETE",
			url: `/projects/${projectId}`,
		});
	}

	async queryProject(
		projectId: string,
		queryData: QueryRequest
	): Promise<ApiResponse<QueryResponse>> {
		return this.request<ApiResponse<QueryResponse>>({
			method: "POST",
			url: `/projects/${projectId}/query`,
			data: queryData,
		});
	}

	// Health check
	async healthCheck(): Promise<any> {
		return this.request<any>({
			method: "GET",
			url: "/health",
		});
	}
}

export const apiClient = new ApiClient();
