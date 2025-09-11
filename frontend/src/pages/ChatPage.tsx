import React, { useState, useEffect, useRef } from "react";
import { UpdateProjectModal } from "../components/modals/UpdateProjectModal";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Textarea } from "../components/ui/Textarea";
import { Message, Project } from "../types";
import { toast } from "react-toastify";
import { DocumentsModal } from "../components/modals/DocumentsModal";

export const ChatPage: React.FC = () => {
	const [showUpdateModal, setShowUpdateModal] =
		useState(false);
	const { projectId } = useParams<{ projectId: string }>();
	const navigate = useNavigate();
	const {
		fetchOne,
		query,
		update: updateProject,
		currentProject: project,
		setCurrent: setProject,
	} = useProjects();

	const [messages, setMessages] = useState<Message[]>([]);
	const [inputMessage, setInputMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [showDocumentsModal, setShowDocumentsModal] =
		useState(false);
	const [selectedProject, setSelectedProject] =
		useState<any>(null);

	useEffect(() => {
		if (projectId) {
			fetchOne(projectId).then((res) => {
				setProject(res.payload);
				setMessages((res.payload as Project).messages || []);
			});
		}
	}, [projectId]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({
			behavior: "smooth",
		});
	}, [messages]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputMessage.trim() || isLoading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			content: inputMessage,
			role: "user",
			created_at: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputMessage("");
		setIsLoading(true);

		setTimeout(() => {
			query(projectId!, { query: userMessage.content }).then(
				(res) => {
					setMessages((prev) => [
						...prev,
						(res.payload as any).response as Message,
					]);
					setIsLoading(false);
				}
			);
		}, 1000);
	};

	const handleUpdateProject = async (data: {
		name?: string;
		description?: string;
		pdf_files?: File[];
		delete_documents?: string[];
	}) => {
		try {
			await updateProject(projectId!, data);
			setShowUpdateModal(false);
			toast.success("Project updated successfully!");
		} catch (error) {
			toast.error("Failed to update project!");
		}
	};

	const handleBackToProjects = () => {
		navigate("/projects");
	};

	if (!project) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<p className="text-gray-500 dark:text-gray-400">
					Loading project...
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
			{/* Header */}
			<header className="bg-white dark:bg-gray-800 shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-4">
							<Button
								variant="ghost"
								onClick={handleBackToProjects}
							>
								← Back to Projects
							</Button>
							<div>
								<h1 className="text-xl font-bold text-gray-900 dark:text-white">
									{project.name}
								</h1>
								{project.description && (
									<p className="text-sm text-gray-600 dark:text-gray-400">
										{project.description}
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Chat Container */}
			<div className="flex-1 flex max-w-7xl mx-auto w-full">
				{/* Sidebar - Project Info */}
				<aside className="w-64 bg-white dark:bg-gray-800 shadow p-4 hidden md:block">
					<div className="space-y-4">
						<div>
							<h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
								Project Info
							</h3>
							<Card>
								<CardContent className="p-3">
									<div className="space-y-2 text-sm">
										<p>
											<span className="font-medium">Documents:</span>{" "}
											{project.documents_count || 0}
										</p>
										<p>
											<span className="font-medium">Created:</span>{" "}
											{new Date(
												project.created_at
											).toLocaleDateString()}
										</p>
									</div>
								</CardContent>
							</Card>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
								Quick Actions
							</h3>
							<div className="space-y-2">
								<Button
									variant="secondary"
									size="sm"
									className="w-full"
									onClick={() => setShowUpdateModal(true)}
								>
									Update Document
								</Button>
								<Button
									variant="secondary"
									size="sm"
									className="w-full"
									onClick={(e) => {
										e.stopPropagation();
										setSelectedProject(project);
										setShowDocumentsModal(true);
									}}
								>
									Documents
								</Button>
							</div>
						</div>
					</div>
				</aside>

				{/* Main Chat Area */}
				<main className="flex-1 flex flex-col bg-white dark:bg-gray-800">
					{/* Messages Area */}
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{messages.length === 0 ? (
							<div className="text-center py-12">
								<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
									Start a conversation
								</h3>
								<p className="text-gray-500 dark:text-gray-400">
									Ask questions about your documents or get help with
									your project.
								</p>
							</div>
						) : (
							messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${
										message.role === "user"
											? "justify-end"
											: "justify-start"
									}`}
								>
									<div
										className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
											message.role === "user"
												? "bg-primary text-primary-foreground"
												: "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
										}`}
									>
										<p className="text-sm">{message.content}</p>
										<p className="text-xs opacity-70 mt-1">
											{new Date(
												message.created_at
											).toLocaleTimeString()}
										</p>
									</div>
								</div>
							))
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Input Area */}
					<div className="border-t border-gray-200 dark:border-gray-700 p-4">
						<form
							onSubmit={handleSendMessage}
							className="flex space-x-2"
						>
							<Textarea
								value={inputMessage}
								onChange={(e) => setInputMessage(e.target.value)}
								placeholder="Type your message here..."
								className="flex-1 min-h-[44px] max-h-32 resize-none"
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSendMessage(e);
									}
								}}
							/>
							<Button
								type="submit"
								disabled={!inputMessage.trim() || isLoading}
								className="self-end"
							>
								Send
							</Button>
						</form>
						<p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
							Press Enter to send, Shift+Enter for new line
						</p>
					</div>
				</main>
			</div>
			{/* Update Project Modal */}
			{showUpdateModal && (
				<UpdateProjectModal
					isOpen={showUpdateModal}
					onClose={() => setShowUpdateModal(false)}
					project={project}
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
		</div>
	);
};
