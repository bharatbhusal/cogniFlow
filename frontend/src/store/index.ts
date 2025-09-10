import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import projectReducer from "./slices/projectSlice";
import uiReducer from "./slices/uiSlice";

// Persist configuration
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "ui", "projects"],
};

// Auth slice persist config - exclude loading and error states
const authPersistConfig = {
  key: "auth",
  storage,
  blacklist: ["loading", "error"], // Don't persist loading and error states
};

// UI slice persist config - all UI state can be persisted now
const uiPersistConfig = {
  key: "ui",
  storage,
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedUiReducer = persistReducer(uiPersistConfig, uiReducer);

// Combine all reducers
const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  projects: projectReducer, // Not persisted - always fetch fresh
  ui: persistedUiReducer,
});

// Create persisted root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
          "persist/PURGE",
          "persist/FLUSH",
          "persist/PAUSE",
        ],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
