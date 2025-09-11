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
  error: null,
};

// Async thunks
export const createProject = createAsyncThunk(
  "projects/create",
  async (projectData: CreateProjectRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.createProject(projectData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
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
      return rejectWithValue(error.message);
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
      return rejectWithValue(error.message);
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
      return rejectWithValue(error.message);
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
      return rejectWithValue(error.message);
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
      return rejectWithValue(error.message);
    }
  }
);

// Project slice
const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
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
        state.error = null;
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
        state.error = action.payload as string;
      });

    // Fetch projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
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
        state.error = action.payload as string;
      });

    // Fetch single project
    builder
      .addCase(fetchProject.pending, (state) => {
        state.loading = true;
        state.error = null;
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
        state.error = action.payload as string;
      });

    // Update project
    builder
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const { updates } = action.payload as any;

          // Update current project
          if (state.currentProject?.id === action.payload.id) {
            state.currentProject = {
              ...state.currentProject,
              name: updates.name_updated
                ? action.payload.name
                : state.currentProject.name,
              description: updates.description_updated
                ? action.payload.description
                : state.currentProject.description,
              documents: updates.files_added
                ? [
                    ...(state.currentProject.documents || []),
                    ...(updates.new_files || []),
                  ]
                : Array.isArray(updates.deleted_files)
                ? (state.currentProject.documents || []).filter(
                    (doc) => !updates.deleted_files.includes(doc.id)
                  )
                : state.currentProject.documents,
              documents_count: updates.files_added
                ? (state.currentProject.documents_count || 0) +
                  updates.files_added
                : Array.isArray(updates.deleted_files)
                ? (state.currentProject.documents_count || 0) -
                  updates.deleted_files.length
                : state.currentProject.documents_count,
            };
          }

          // Update project in list
          const index = state.projects.findIndex(
            (p) => p.id === action.payload.id
          );
          if (index !== -1) {
            state.projects[index] = {
              ...state.projects[index],
              name: updates.name_updated
                ? action.payload.name
                : state.projects[index].name,
              description: updates.description_updated
                ? action.payload.description
                : state.projects[index].description,
              documents: updates.files_added
                ? [
                    ...(state.projects[index].documents || []),
                    ...(updates.new_files || []),
                  ]
                : Array.isArray(updates.deleted_files)
                ? (state.projects[index].documents || []).filter(
                    (doc) => !updates.deleted_files.includes(doc.id)
                  )
                : state.projects[index].documents,
              documents_count: updates.files_added
                ? (state.projects[index].documents_count || 0) +
                  updates.files_added
                : Array.isArray(updates.deleted_files)
                ? (state.projects[index].documents_count || 0) -
                  updates.deleted_files.length
                : state.projects[index].documents_count,
            };
          }
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete project
    builder
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
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
        state.error = action.payload as string;
      });

    // Query project
    builder
      .addCase(queryProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(queryProject.fulfilled, (state) => {
        state.loading = false;
        // Query response is handled separately, typically in a chat/message component
      })
      .addCase(queryProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setCurrentProject,
  clearCurrentProject,
  updateProjectInList,
  addProjectToList,
  removeProjectFromList,
} = projectSlice.actions;

export default projectSlice.reducer;
