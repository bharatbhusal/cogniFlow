import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  ProjectState,
  Project,
  CreateProjectRequest,
  QueryRequest,
} from "../../types";
import { apiClient } from "../../services/api";

// Initial state
const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  totalCount: 0,
  loading: false,
};

// Async thunks
export const createProject = createAsyncThunk(
  "projects/create",
  async (projectData: CreateProjectRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.createProject(projectData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to create project"
      );
    }
  }
);

export const fetchProjects = createAsyncThunk(
  "projects/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getProjects();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch projects"
      );
    }
  }
);

export const fetchProject = createAsyncThunk(
  "projects/fetchOne",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.getProject(projectId);
      if (!response.data) {
        throw new Error("Project not found");
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch project"
      );
    }
  }
);

export const updateProject = createAsyncThunk(
  "projects/update",
  async (
    {
      projectId,
      projectData,
    }: {
      projectId: string;
      projectData: Partial<CreateProjectRequest>;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.updateProject(projectId, projectData);
      if (!response.data) {
        throw new Error("Failed to update project");
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update project"
      );
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (projectId: string, { rejectWithValue }) => {
    try {
      await apiClient.deleteProject(projectId);
      return projectId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete project"
      );
    }
  }
);

export const queryProject = createAsyncThunk(
  "projects/query",
  async (
    { projectId, queryData }: { projectId: string; queryData: QueryRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.queryProject(projectId, queryData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to query project"
      );
    }
  }
);

// Project slice
const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
    updateProjectInList: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    },
    addProjectToList: (state, action: PayloadAction<Project>) => {
      state.projects.unshift(action.payload);
      state.totalCount += 1;
    },
    removeProjectFromList: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
      state.totalCount -= 1;
    },
  },
  extraReducers: (builder) => {
    // Create project
    builder
      .addCase(createProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.projects.unshift({
            ...action.payload,
            documents_count: action.payload.documents?.length || 0,
          });
          state.totalCount += 1;
        }
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
      });

    // Fetch projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.projects = action.payload.projects;
          state.totalCount = action.payload.total_count;
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
      });

    // Fetch single project
    builder
      .addCase(fetchProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentProject = action.payload;

          // Update project in list if it exists
          const index = state.projects.findIndex(
            (p) => p.id === action.payload.id
          );
          if (index !== -1) {
            state.projects[index] = action.payload;
          }
        }
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false;
      });

    // Update project
    builder
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const { updates } = action.payload as any;

          // Update current project
          if (state.currentProject?.id === action.payload.id) {
            const deletedIds = Array.isArray(updates.deleted_files)
              ? updates.deleted_files.map((d: any) => d.id)
              : [];

            state.currentProject = {
              ...state.currentProject,
              ...(updates.name_updated && { name: action.payload.name }),
              ...(updates.description_updated && {
                description: action.payload.description,
              }),
              documents: updates.files_added
                ? [
                    ...(state.currentProject.documents || []),
                    ...(updates.new_files || []),
                  ]
                : updates.files_deleted > 0 && deletedIds.length > 0
                ? (state.currentProject.documents || []).filter(
                    (doc) => !deletedIds.includes(doc.id)
                  )
                : state.currentProject.documents,
              documents_count: updates.files_added
                ? (state.currentProject.documents_count || 0) +
                  updates.files_added
                : updates.files_deleted > 0 && deletedIds.length > 0
                ? (state.currentProject.documents_count || 0) -
                  deletedIds.length
                : state.currentProject.documents_count,
              workflow:
                updates.workflow.status !== "unchanged"
                  ? updates.workflow.new_workflow
                  : state.currentProject.workflow,
              llm_node:
                updates.llm_node.status !== "unchanged"
                  ? {
                      llm_model_name: updates.llm_node.new_llm_model_name,
                      openai_api_key: updates.llm_node.new_openai_api_key,
                    }
                  : state.currentProject.llm_node,
              web_search_node:
                updates.web_search_node.status !== "unchanged"
                  ? {
                      serpapi_api_key:
                        updates.web_search_node.new_serpapi_api_key,
                    }
                  : state.currentProject.web_search_node,
              knowledge_base_node:
                updates.kb_node.status !== "unchanged"
                  ? {
                      openai_api_key: updates.kb_node.new_openai_api_key,
                      embedding_model_name:
                        updates.kb_node.new_embedding_model_name,
                    }
                  : state.currentProject.knowledge_base_node,
            };
          }
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
      });

    // Delete project
    builder
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        const projectId = action.payload;

        // Remove from projects list
        state.projects = state.projects.filter((p) => p.id !== projectId);
        state.totalCount -= 1;

        // Clear current project if it was deleted
        if (state.currentProject?.id === projectId) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
      });

    // Query project
    builder
      .addCase(queryProject.pending, (state, action) => {
        state.loading = true;
        state.currentProject?.messages!.push({
          id: "temp-id-" + Date.now(),
          content: action.meta.arg.queryData.query,
          role: "user",
          created_at: new Date().toISOString(),
        });
      })
      .addCase(queryProject.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject?.messages!.push(action.payload!.response);
      })
      .addCase(queryProject.rejected, (state, action) => {
        state.loading = false;
      });
  },
});

export const {
  setCurrentProject,
  clearCurrentProject,
  updateProjectInList,
  addProjectToList,
  removeProjectFromList,
} = projectSlice.actions;

export default projectSlice.reducer;
