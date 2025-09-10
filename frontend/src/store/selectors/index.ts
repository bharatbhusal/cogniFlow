import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { Project } from "../../types";

// Auth selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectToken = (state: RootState) => state.auth.token;

// Projects selectors
export const selectProjects = (state: RootState) => state.projects;
export const selectProjectsList = (state: RootState) => state.projects.projects;
export const selectCurrentProject = (state: RootState) =>
  state.projects.currentProject;
export const selectProjectsLoading = (state: RootState) =>
  state.projects.loading;
export const selectProjectsError = (state: RootState) => state.projects.error;
export const selectProjectsCount = (state: RootState) =>
  state.projects.totalCount;

// Memoized selectors
export const selectProjectById = createSelector(
  [selectProjectsList, (state: RootState, projectId: string) => projectId],
  (projects: Project[], projectId: string) =>
    projects.find((project: Project) => project.id === projectId)
);

export const selectProjectsBySearch = createSelector(
  [selectProjectsList, (state: RootState, searchTerm: string) => searchTerm],
  (projects: Project[], searchTerm: string) => {
    if (!searchTerm) return projects;
    return projects.filter(
      (project: Project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
);

// UI selectors
export const selectUI = (state: RootState) => state.ui;
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
