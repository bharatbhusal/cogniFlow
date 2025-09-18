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
	OTPRequest,
	OTPVerifyRequest,
	OTPResponse,
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
		let errorMessage = "An unexpected error occurred";

		if (error.response) {
			// Server responded with error status
			const errorData = error.response.data;

			if (errorData) {
				// Use message field as primary error message
				errorMessage = errorData.message || errorMessage;

				// If details exist and provide more info, append them
				if (
					errorData.details &&
					errorData.details !== errorMessage
				) {
					errorMessage = `${errorMessage}: ${errorData.details}`;
				}

				// If neither message nor details, try detail field (FastAPI default)
				if (
					!errorData.message &&
					!errorData.details &&
					errorData.detail
				) {
					errorMessage = errorData.detail;
				}
			}
		} else if (error.request) {
			// Request was made but no response received
			errorMessage =
				"Network error - please check your connection";
		} else {
			// Something else happened
			errorMessage = error.message || errorMessage;
		}

		return new Error(errorMessage);
	}

	// Auth API methods
	async requestOTP(
		otpData: OTPRequest
	): Promise<ApiResponse<OTPResponse>> {
		return this.request<ApiResponse<OTPResponse>>({
			method: "POST",
			url: "/auth/request-otp",
			data: otpData,
		});
	}

	async login(
		credentials: OTPVerifyRequest
	): Promise<AuthResponse> {
		return this.request<AuthResponse>({
			method: "POST",
			url: "/auth/login",
			data: credentials,
		});
	}

	async register(
		userData: OTPVerifyRequest
	): Promise<AuthResponse> {
		return this.request<AuthResponse>({
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

		if (projectData.delete_documents) {
			const ids = Array.isArray(projectData.delete_documents)
				? projectData.delete_documents.join(",")
				: String(projectData.delete_documents);
			formData.append("delete_documents", ids);
		}

		const files = projectData.pdf_files;
		if (files) {
			files.forEach((file: File) => {
				formData.append("pdf_files", file);
			});
		}

		if (projectData.project_config) {
			if (projectData.project_config.workflow) {
				formData.append(
					"workflow",
					projectData.project_config.workflow
				);

				if (projectData.project_config.llm_node) {
					if (
						projectData.project_config.llm_node.openai_api_key &&
						projectData.project_config.llm_node.llm_model_name
					) {
						formData.append(
							"llm_node_config",
							JSON.stringify(projectData.project_config.llm_node)
						);
					}
				}

				if (projectData.project_config.knowledge_base_node) {
					if (
						projectData.project_config.knowledge_base_node
							.openai_api_key &&
						projectData.project_config.knowledge_base_node
							.embedding_model_name
					) {
						formData.append(
							"kb_node_config",
							JSON.stringify(
								projectData.project_config.knowledge_base_node
							)
						);
					}
				}

				if (projectData.project_config.web_search_node) {
					if (
						projectData.project_config.web_search_node
							.serpapi_api_key
					) {
						formData.append(
							"web_search_node_config",
							JSON.stringify(
								projectData.project_config.web_search_node
							)
						);
					}
				}
			}
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
