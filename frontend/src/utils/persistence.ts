import { persistor } from "../store";

/**
 * Utility functions for managing persisted state
 */
export const persistUtils = {
  /**
   * Purge all persisted state
   */
  purgeAll: async () => {
    try {
      await persistor.purge();
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Failed to purge persisted state:", error);
      return false;
    }
  },

  /**
   * Flush persisted state (save current state)
   */
  flush: async () => {
    try {
      await persistor.flush();
      return true;
    } catch (error) {
      console.error("Failed to flush persisted state:", error);
      return false;
    }
  },

  /**
   * Pause persistence
   */
  pause: () => {
    persistor.pause();
  },

  /**
   * Resume persistence
   */
  resume: () => {
    persistor.persist();
  },

  /**
   * Check if persistence is paused
   */
  isPaused: () => {
    const state = persistor.getState();
    return state.registry.length === 0;
  },

  /**
   * Get persistence state
   */
  getState: () => {
    return persistor.getState();
  },
};
