import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { getCurrentUser } from "../store/slices/authSlice";
import {
  selectIsAuthenticated,
  selectToken,
  selectUser,
} from "../store/selectors";

/**
 * Hook to handle authentication rehydration after app startup
 * This will attempt to fetch the current user if a token is persisted
 */
export const useAuthRehydration = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const token = useAppSelector(selectToken);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    // If we have a token but no user (after rehydration), fetch the current user
    if (token && !user && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [token, user, isAuthenticated, dispatch]);

  return {
    isAuthenticated,
    user,
    token,
    isRehydrated: true, // Since we're using redux-persist, this will be true after rehydration
  };
};
