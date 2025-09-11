import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ReduxProvider } from "./components/providers/ReduxProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";

// Lazy load pages for code splitting
const LoginPage = React.lazy(() =>
  import("./pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  }))
);
const RegisterPage = React.lazy(() =>
  import("./pages/RegisterPage").then((module) => ({
    default: module.RegisterPage,
  }))
);
const ProjectsPage = React.lazy(() => import("./pages/ProjectsPage"));
const ChatPage = React.lazy(() => import("./pages/ChatPage"));
const ProjectPage = React.lazy(() => import("./pages/ProjectPage"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ReduxProvider>
      <Router>
        <div className="App">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes */}
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:projectId"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/project/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjectPage />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/projects" replace />} />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </Suspense>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </ReduxProvider>
  );
}

export default App;
