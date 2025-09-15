import React, { useState, useEffect } from "react";
import {
  FaFilePdf,
  FaTrash,
  FaEdit,
  FaFacebookMessenger,
  FaTruckLoading,
  FaSpinner,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CreateProjectModal } from "../components/modals/CreateProjectModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProjects } from "../hooks/useProjects";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/Card";
import { Header } from "../components/ui/Header";
import { LuMessageCircleReply, LuView } from "react-icons/lu";

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, fetchAll, remove, loading } = useProjects();

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchAll()
      .then((result) => {
        if (result.meta.requestStatus === "rejected") {
          toast.error((result.payload as string) || "Failed to load projects");
        }
      })
      .catch((error) => {
        toast.error("Failed to load projects");
        console.error("Error loading projects:", error);
      });
  }, [fetchAll]);

  const handleDeleteProject = async (projectId: string) => {
    try {
      const result = await remove(projectId);
      if (result.meta.requestStatus === "fulfilled") {
        toast.success("Project deleted successfully!");
      } else if (result.meta.requestStatus === "rejected") {
        toast.error((result.payload as string) || "Failed to delete project");
      }
    } catch (error) {
      toast.error("Failed to delete project");
      console.error("Error deleting project:", error);
    }
  };

  return (
    <motion.div
      className=""
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
    >
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Projects
            </h2>
            <Button onClick={() => setShowCreateModal(true)}>
              Create New Project
            </Button>
          </div>

          {/* Create Project Modal */}
          {showCreateModal && (
            <CreateProjectModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
            />
          )}

          {/* Error Display removed; use toastify for errors */}

          {/* Projects Grid */}
          {loading && projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Loading projects...
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No projects yet. Create your first project to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 text-slate-100 shadow-xl rounded-2xl border border-slate-700 flex flex-col justify-between hover:border-gray-400 cursor-pointer duration-200 ease-in-out"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}?editable=false`);
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold text-slate-100 mb-1">
                      {project.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-2">
                    <div className="flex flex-col gap-1 text-sm">
                      <CardDescription className="text-slate-300 text-base">
                        {project.description!.length > 200
                          ? project.description!.slice(0, 200) + "..."
                          : project.description}
                      </CardDescription>
                      {project.messages_count! > 0 && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <FaEdit className="text-slate-400" />
                          {project.messages_count} messages
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-slate-500">
                        {project.created_at && (
                          <span>
                            Created:{" "}
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </span>
                    </div>
                    {project.workflow && project && project.workflow && (
                      <span className="flex items-center gap-1 text-slate-400">
                        {project.workflow.split("_").map((step) => {
                          const stepsMapping: { [key: string]: string } = {
                            llm: "Language Model",
                            kb: "Knowledge Base",
                            web: "Web Search",
                          };
                          const mappedStep =
                            stepsMapping[step] || step || "Unknown Step";
                          return (
                            <span className="flex items-center gap-1 text-gray-200 bg-gray-600 text-center px-2 py-1 rounded-lg text-sm">
                              {mappedStep}
                            </span>
                          );
                        })}
                      </span>
                    )}
                  </CardContent>
                  <CardFooter className="justify-end gap-3 border-t border-slate-700 pt-4 pb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/chat/${project.id}`);
                      }}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <LuMessageCircleReply />
                      )}
                      Chat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}?editable=true`);
                      }}
                      className="flex items-center gap-2"
                    >
                      {" "}
                      {loading ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaEdit />
                      )}
                      Edit
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            "Are you sure you want to delete this project? This action cannot be undone."
                          )
                        ) {
                          handleDeleteProject(project.id);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaTrash />
                      )}
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
};
export default ProjectsPage;
