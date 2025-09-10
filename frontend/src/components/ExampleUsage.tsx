import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAuthRehydration } from "../hooks/useAuthRehydration";
import { useProjects } from "../hooks/useProjects";
import { useUI } from "../hooks/useUI";
import { Project } from "../types";
import "./ExampleUsage.css";

// Example component demonstrating Redux state management usage with persistence
export const ExampleUsage: React.FC = () => {
  // Local state for forms
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const {
    user,
    isAuthenticated,
    loading: authLoading,
    error: authError,
    login,
    register,
    logout,
    clearError: clearAuthError,
    clearAllData,
    persistUtils,
  } = useAuth();

  // Use rehydration hook to handle auth state after app restart
  const { isRehydrated } = useAuthRehydration();

  const {
    projects,
    currentProject,
    loading: projectsLoading,
    error: projectsError,
    create: createProject,
    fetchAll: fetchProjects,
    fetchOne: fetchProject,
    remove: deleteProject,
    clearError: clearProjectsError,
  } = useProjects();

  const { theme, sidebarOpen, toggleTheme, toggleSidebar } = useUI();

  // Fetch projects when user is authenticated and rehydrated
  useEffect(() => {
    if (isAuthenticated && isRehydrated) {
      fetchProjects();
    }
  }, [isAuthenticated, isRehydrated, fetchProjects]);

  // Example handlers
  const handleLogin = async () => {
    try {
      const result = await login(credentials);
      if (result.meta.requestStatus === "fulfilled") {
        setCredentials({ email: "", password: "" });
        console.log("Successfully logged in!");
      }
    } catch (error) {
      console.error("Login failed. Please check your credentials.");
    }
  };

  const handleCreateProject = async () => {
    try {
      await createProject({
        name: "New Project",
        description: "A sample project",
      });
      console.log("Your project has been created successfully");
    } catch (error) {
      console.error("Failed to create project");
    }
  };

  const handleClearAllData = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all persisted data? This will log you out and clear all stored information."
      )
    ) {
      await clearAllData();
      console.log("All persisted data has been cleared");
    }
  };

  const handlePurgeCache = async () => {
    if (window.confirm("Clear all cached data?")) {
      await persistUtils.purgeAll();
      console.log("All cached data has been purged");
    }
  };

  return (
    <div className={`app ${theme}`}>
      <header>
        <h1>CogniFlow - Redux Persistent State Management Demo</h1>
        <div>
          <button onClick={toggleTheme}>
            Switch to {theme === "light" ? "dark" : "light"} mode
          </button>
          <button onClick={toggleSidebar}>
            {sidebarOpen ? "Close" : "Open"} Sidebar
          </button>
          <button
            onClick={handleClearAllData}
            style={{ backgroundColor: "#dc3545" }}
          >
            Clear All Data
          </button>
          <button
            onClick={handlePurgeCache}
            style={{ backgroundColor: "#fd7e14" }}
          >
            Purge Cache
          </button>
        </div>
      </header>

      <main>
        {/* Authentication Section */}
        <section>
          <h2>Authentication (Persistent)</h2>
          {authLoading && <p>Loading...</p>}
          {authError && (
            <div className="error">
              {authError}
              <button onClick={clearAuthError}>Clear Error</button>
            </div>
          )}

          <div>
            <p>
              <strong>Rehydration Status:</strong>{" "}
              {isRehydrated ? "✅ Complete" : "⏳ Loading..."}
            </p>
          </div>

          {isAuthenticated ? (
            <div>
              <p>Welcome, {user?.email}!</p>
              <p>
                <strong>Session Persisted:</strong> Your login will survive page
                refreshes
              </p>
              <button onClick={logout}>Logout</button>
            </div>
          ) : (
            <div>
              <p>Login state will be restored after page refresh</p>
              <button onClick={handleLogin}>Sample Login</button>
              <button
                onClick={() =>
                  register({ email: "new@example.com", password: "password" })
                }
              >
                Sample Register
              </button>
            </div>
          )}
        </section>

        {/* Projects Section */}
        <section>
          <h2>Projects ({projects.length}) - Not Persisted</h2>
          <p>
            <em>Projects are fetched fresh on each app load</em>
          </p>
          {projectsLoading && <p>Loading projects...</p>}
          {projectsError && (
            <div className="error">
              {projectsError}
              <button onClick={clearProjectsError}>Clear Error</button>
            </div>
          )}

          {isAuthenticated && (
            <div>
              <button onClick={handleCreateProject}>
                Create Sample Project
              </button>
              <div>
                {projects.map((project: Project) => (
                  <div key={project.id} className="project-item">
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                    <button onClick={() => fetchProject(project.id)}>
                      {currentProject?.id === project.id ? "Current" : "Select"}
                    </button>
                    <button onClick={() => deleteProject(project.id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* UI State Section */}
        <section>
          <h2>UI State (Partially Persistent)</h2>
          <p>
            <em>Theme and sidebar state persist, notifications are fresh</em>
          </p>
          <div>
            <p>
              <strong>Current Theme:</strong> {theme} (persisted)
            </p>
            <p>
              <strong>Sidebar Open:</strong> {sidebarOpen ? "Yes" : "No"}{" "}
              (persisted)
            </p>
          </div>
        </section>

        {/* Persistence Controls */}
        <section>
          <h2>Persistence Controls</h2>
          <div>
            <button onClick={() => persistUtils.flush()}>
              Flush State (Save Now)
            </button>
            <button onClick={() => persistUtils.pause()}>
              Pause Persistence
            </button>
            <button onClick={() => persistUtils.resume()}>
              Resume Persistence
            </button>
            <p>
              <strong>Persistence Active:</strong>{" "}
              {!persistUtils.isPaused() ? "Yes" : "No"}
            </p>
          </div>
        </section>
      </main>

      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="sidebar">
          <h3>Persistent Sidebar</h3>
          <p>
            <strong>Current theme:</strong> {theme}
          </p>
          <p>
            <strong>User:</strong> {user?.email || "Not logged in"}
          </p>
          <p>
            <strong>Projects:</strong> {projects.length}
          </p>
          <p>
            <strong>Persistence:</strong>{" "}
            {!persistUtils.isPaused() ? "Active" : "Paused"}
          </p>
          <hr />
          <p>
            <em>This sidebar state persists across page refreshes</em>
          </p>
        </aside>
      )}
    </div>
  );
};

export default ExampleUsage;
