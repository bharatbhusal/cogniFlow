import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";
import { Message } from "../types";
import { toast } from "react-toastify";
import {
	FaChevronCircleLeft,
	FaSpinner,
} from "react-icons/fa";
import Sidebar from "../components/reactflow/Sidebar";
import { IoSend } from "react-icons/io5";

export const ChatPage: React.FC = () => {
	const { projectId } = useParams<{ projectId: string }>();
	const navigate = useNavigate();
	const {
		fetchOne,
		query,
		currentProject: project,
		setCurrent: setProject,
		loading,
	} = useProjects();

	const [inputMessage, setInputMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [canSendMessage, setCanSendMessage] =
		useState(false);

	useEffect(() => {
		if (projectId) {
			fetchOne(projectId)
				.then((res) => {
					if (res.meta.requestStatus === "fulfilled") {
						setProject(res.payload);
					} else if (res.meta.requestStatus === "rejected") {
						toast.error(
							(res.payload as string) || "Failed to load project"
						);
					}
				})
				.catch((error) => {
					toast.error("Failed to load project");
				});
		}
	}, [projectId]);

	useEffect(() => {
		if (project) {
			const hashWorkflow = project.workflow?.split("_") || [];
			const hasKb =
				project.workflow?.split("_").includes("kb") || false;
			const hasDocuments =
				(project.documents && project.documents.length > 0) ||
				false;

			// Disable textarea if no kb and no documents
			setCanSendMessage(
				hashWorkflow.length > 0
					? hasKb
						? hasKb && hasDocuments
						: true
					: false
			);
		}
	}, [project]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({
			behavior: "smooth",
		});
	}, [project?.messages]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputMessage.trim() || isLoading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			content: inputMessage,
			role: "user",
			created_at: new Date().toISOString(),
		};
		setInputMessage("");
		setIsLoading(true);

		try {
			const result = await query(projectId!, {
				query: userMessage.content,
			});
			if (result.meta.requestStatus === "rejected") {
				toast.error(
					(result.payload as string) || "Failed to send message"
				);
			}
		} catch (error) {
			toast.error("Failed to send message");
		} finally {
			setIsLoading(false);
		}
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
		<div className="h-screen flex flex-col">
			{/* Chat Container */}
			<div className="flex-1 flex mx-auto w-full h-full">
				<div className="w-64 bg-gray-900 text-white shadow h-full overflow-y-auto flex-col gap-4 hidden sm:flex">
					<Sidebar
						project={project}
						projectConfig={null}
						draftConfig={null}
						sidebarNodes={null}
						onDragStart={() => {}}
						onSaveProject={async () => {}}
						isSaving={false}
					/>
				</div>
				{/* Main Chat Area */}
				<main className="flex-1 flex flex-col h-full overflow-y-auto">
					{/* Messages Area */}
					<div className="flex-1 p-4 space-y-4">
						<div className="bg-slate-800 p-2 rounded-md text-gray-300 sm:hidden">
							{project.description}
						</div>
						{project?.messages?.length === 0 ? (
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
							project?.messages?.map((message) => (
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
						{loading && (
							<div className="flex justify-start">
								<div className="flex justify-left items-center w-md gap-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white h-10 w-20 px-4 py-2 rounded-lg">
									<ul
										className="animate-bounce h-2 bg-gray-300 rounded-lg w-2"
										style={{ animationDelay: "0s" }}
									></ul>
									<ul
										className="animate-bounce h-2 bg-gray-300 rounded-lg w-2"
										style={{ animationDelay: "0.15s" }}
									></ul>
									<ul
										className="animate-bounce h-2 bg-gray-300 rounded-lg w-2"
										style={{ animationDelay: "0.3s" }}
									></ul>
									<ul
										className="animate-bounce h-2 bg-gray-300 rounded-lg w-2"
										style={{ animationDelay: "0.45s" }}
									></ul>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Input Area */}
					<div className="border-t border-gray-200 dark:border-gray-700 p-2">
						<form
							onSubmit={handleSendMessage}
							className="flex gap-2 items-end justify-between"
						>
							<Button
								type="button"
								variant="secondary"
								className="sm:hidden flex items-center justify-center min-h-[44px] max-h-32"
								onClick={() => navigate(-1)}
							>
								<FaChevronCircleLeft size={20} />
							</Button>
							<Textarea
								disabled={!canSendMessage}
								value={inputMessage}
								onChange={(e) => setInputMessage(e.target.value)}
								placeholder={
									canSendMessage
										? "Type your message here...."
										: "No documents available. Please upload documents to chat."
								}
								className="min-h-[44px] max-h-32 resize-none"
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSendMessage(e);
									}
								}}
							/>
							<Button
								type="submit"
								disabled={
									!inputMessage.trim() ||
									isLoading ||
									!canSendMessage
								}
								className="min-h-[44px] max-h-32"
							>
								{loading ? (
									<FaSpinner className="animate-spin" />
								) : (
									<IoSend />
								)}
							</Button>
						</form>
						<p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
							Press Enter to send, Shift+Enter for new line
						</p>
					</div>
				</main>
			</div>
		</div>
	);
};
export default ChatPage;
