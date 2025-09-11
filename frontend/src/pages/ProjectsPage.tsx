import React, { useState, useEffect } from "react";
import { FaFilePdf, FaTrash, FaEdit } from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CreateProjectModal } from "../components/modals/CreateProjectModal";
import { UpdateProjectModal } from "../components/modals/UpdateProjectModal";
import { DocumentsModal } from "../components/modals/DocumentsModal";
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

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    projects,
    loading,
    error,
    create: createProject,
    fetchAll: fetchProjects,
    remove: deleteProject,
    update: updateProject,
  } = useProjects();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCreateProject = async (data: {
    name: string;
    description: string;
    pdf_files: File[];
  }) => {
    try {
      await createProject(data);
      setShowCreateModal(false);
      toast.success("Project created successfully!");
    } catch (error) {
      toast.error("Failed to create project!");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      toast.success("Project deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete project!");
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/chat/${projectId}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleUpdateProject = async (data: {
    name?: string;
    description?: string;
    pdf_files?: File[];
    delete_documents?: string[];
  }) => {
    try {
      await updateProject(selectedProject.id, data);
      setShowUpdateModal(false);
      toast.success("Project updated successfully!");
    } catch (error) {
      toast.error("Failed to update project!");
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
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
              onCreate={handleCreateProject}
              loading={loading}
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
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 text-slate-100 shadow-xl rounded-2xl border border-slate-700 cursor-pointer hover:scale-[1.025] hover:shadow-2xl transition-all duration-200 flex flex-col justify-between"
                  onClick={() => navigate(`/chat/${project.id}`)}
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
                      <span className="flex items-center gap-1 text-slate-400">
                        <FaFilePdf className="text-red-400" />
                        {project.documents_count} documents
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <FaEdit className="text-slate-400" />
                        {project.messages_count} messages
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        {project.created_at && (
                          <span>
                            Created:{" "}
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end gap-3 border-t border-slate-700 pt-4 pb-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2 px-3 py-1 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setShowDocumentsModal(true);
                      }}
                      title="Documents"
                    >
                      <FaFilePdf className="text-red-400" />
                      {/* <span className="hidden md:inline">Documents</span> */}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2 px-3 py-1 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setShowUpdateModal(true);
                      }}
                      title="Edit"
                    >
                      <FaEdit />
                      {/* <span className="hidden md:inline">Edit</span> */}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2 px-3 py-1 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      title="Delete"
                    >
                      <FaTrash />
                      {/* <span className="hidden md:inline">Delete</span> */}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      {/* Update Project Modal */}
      {showUpdateModal && selectedProject && (
        <UpdateProjectModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          project={selectedProject}
          onUpdate={handleUpdateProject}
        />
      )}

      {/* View Documents Modal */}
      {showDocumentsModal && selectedProject && (
        <DocumentsModal
          isOpen={showDocumentsModal}
          onClose={() => setShowDocumentsModal(false)}
          project={selectedProject}
        />
      )}
    </motion.div>
  );
};
