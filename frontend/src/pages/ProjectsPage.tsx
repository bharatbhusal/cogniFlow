import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CreateProjectModal } from "../components/modals/CreateProjectModal";
import { UpdateProjectModal } from "../components/modals/UpdateProjectModal";
import { DocumentsModal } from "../components/modals/DocumentsModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProjects } from "../hooks/useProjects";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/Card";
import { Textarea } from "../components/ui/Textarea";

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
	} = useProjects();

	const [showCreateModal, setShowCreateModal] =
		useState(false);
	const [showUpdateModal, setShowUpdateModal] =
		useState(false);
	const [showDocumentsModal, setShowDocumentsModal] =
		useState(false);
	const [selectedProject, setSelectedProject] =
		useState<any>(null);
	const [newProject, setNewProject] = useState({
		name: "",
		description: "",
		files: [] as File[],
	});

	useEffect(() => {
		fetchProjects();
	}, [fetchProjects]);

	const handleCreateProject = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			// You may need to handle file upload to backend here
			await createProject(newProject);
			setNewProject({ name: "", description: "", files: [] });
			setShowCreateModal(false);
			toast.success("Project created successfully!");
		} catch (error) {
			toast.error("Failed to create project!");
		}
	};

	const handleDeleteProject = async (projectId: string) => {
		toast.info("Deleting project...");
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

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement
		>
	) => {
		const { name, value } = e.target;
		setNewProject((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleCreateModalCreate = (data: {
		name: string;
		description: string;
		files: File[];
	}) => {
		setNewProject(data);
		// Submit form
		handleCreateProject({ preventDefault: () => {} } as any);
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
			<ToastContainer position="top-right" autoClose={3000} />
			{/* Header */}
			<header className="bg-white dark:bg-gray-800 shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-6">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
								CogniFlow
							</h1>
							<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
								Welcome back, {user?.email}
							</p>
						</div>
						<Button variant="outline" onClick={handleLogout}>
							Sign Out
						</Button>
					</div>
				</div>
			</header>

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
							onCreate={handleCreateModalCreate}
							loading={loading}
						/>
					)}

					{/* Error Display */}
					{error && (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
							{error}
						</div>
					)}

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
								No projects yet. Create your first project to get
								started!
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
									className="hover:shadow-lg transition-shadow cursor-pointer"
									onClick={() => handleProjectClick(project.id)}
								>
									<CardHeader>
										<div className="flex justify-between items-start">
											<CardTitle className="text-lg">
												{project.name}
											</CardTitle>
											<div className="flex gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														setSelectedProject(project);
														setShowUpdateModal(true);
													}}
												>
													Update
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														setSelectedProject(project);
														setShowDocumentsModal(true);
													}}
												>
													Documents
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteProject(project.id);
													}}
													className="text-red-500 hover:text-red-700"
												>
													Delete
												</Button>
											</div>
										</div>
										{project.description && (
											<CardDescription>
												{project.description}
											</CardDescription>
										)}
									</CardHeader>
									<CardContent>
										<div className="text-sm text-gray-500 dark:text-gray-400">
											<p>Documents: {project.documents_count || 0}</p>
											<p>Messages: {project.messages_count || 0}</p>
											<p>
												Created:{" "}
												{new Date(
													project.created_at
												).toLocaleDateString()}
											</p>
										</div>
									</CardContent>
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
					onUpdate={(data) => {
						// TODO: Implement update logic with file upload
						toast.info(
							"Update functionality not implemented yet."
						);
						setShowUpdateModal(false);
					}}
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
