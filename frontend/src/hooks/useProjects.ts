import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createProject,
  fetchProjects,
  fetchProject,
  updateProject,
  deleteProject,
  queryProject,
  setCurrentProject,
  clearCurrentProject,
} from "../store/slices/projectSlice";
import {
  selectProjectsList,
  selectCurrentProject,
  selectProjectsLoading,
  selectProjectsCount,
  selectProjectById,
  selectProjectsBySearch,
} from "../store/selectors";
import { CreateProjectRequest, QueryRequest } from "../types";

// Projects hook
export const useProjects = () => {
  const dispatch = useAppDispatch();

  const projects = useAppSelector(selectProjectsList);
  const currentProject = useAppSelector(selectCurrentProject);
  const loading = useAppSelector(selectProjectsLoading);
  const totalCount = useAppSelector(selectProjectsCount);

  const create = useCallback(
    (projectData: CreateProjectRequest) => dispatch(createProject(projectData)),
    [dispatch]
  );

  const fetchAll = useCallback(() => dispatch(fetchProjects()), [dispatch]);

  const fetchOne = useCallback(
    (projectId: string) => dispatch(fetchProject(projectId)),
    [dispatch]
  );

  const update = useCallback(
    (projectId: string, projectData: Partial<CreateProjectRequest>) =>
      dispatch(updateProject({ projectId, projectData })),
    [dispatch]
  );

  const remove = useCallback(
    (projectId: string) => dispatch(deleteProject(projectId)),
    [dispatch]
  );

  const query = useCallback(
    (projectId: string, queryData: QueryRequest) =>
      dispatch(queryProject({ projectId, queryData })),
    [dispatch]
  );

  const setCurrent = useCallback(
    (project: any) => dispatch(setCurrentProject(project)),
    [dispatch]
  );

  const clearCurrent = useCallback(
    () => dispatch(clearCurrentProject()),
    [dispatch]
  );

  // Selector functions
  const getProjectById = useCallback(
    (projectId: string) => (state: any) => selectProjectById(state, projectId),
    []
  );

  const searchProjects = useCallback(
    (searchTerm: string) => (state: any) =>
      selectProjectsBySearch(state, searchTerm),
    []
  );

  return {
    projects,
    currentProject,
    loading,
    totalCount,
    create,
    fetchAll,
    fetchOne,
    update,
    remove,
    query,
    setCurrent,
    clearCurrent,
    getProjectById,
    searchProjects,
  };
};
