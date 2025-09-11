import React, { useState, useEffect, useRef } from "react";
import { UpdateProjectModal } from "../components/modals/UpdateProjectModal";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Textarea } from "../components/ui/Textarea";
import { Message } from "../types";
import { toast } from "react-toastify";
import { DocumentsModal } from "../components/modals/DocumentsModal";
import { FaChevronCircleLeft } from "react-icons/fa";

export const ChatPage: React.FC = () => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    fetchOne,
    query,
    update: updateProject,
    currentProject: project,
    setCurrent: setProject,
    loading,
  } = useProjects();

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchOne(projectId).then((res) => {
        setProject(res.payload);
      });
    }
  }, [projectId]);

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
    query(projectId!, { query: userMessage.content });
    setIsLoading(false);
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
        <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4 gap-2">
            <Button variant="ghost" onClick={handleBackToProjects}>
              <FaChevronCircleLeft size={24} />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
          </div>
          {project.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {project.description}
            </p>
          )}
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full h-full">
        {/* Sidebar - Project Info */}
        <aside className="w-64 shadow p-4 hidden md:block h-full overflow-y-auto sticky top-0">
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
                      {project.documents?.length ||
                        project.documents_count ||
                        0}
                    </p>
                    <p>
                      <span className="font-medium">Messages:</span>{" "}
                      {project.messages?.length || project.messages_count || 0}
                    </p>
                    <p>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(project.created_at).toLocaleDateString()}
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
                {project.documents && project.documents.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      What this Project Knows?
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-sm items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition w-full"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            className="w-4 h-4 text-red-500"
                          >
                            <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828A2 2 0 0 0 19.414 7.414l-5.828-5.828A2 2 0 0 0 12.172 1H6zm6 1.414L18.586 8H14a2 2 0 0 1-2-2V3.414zM6 4h6v4a4 4 0 0 0 4 4h4v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4zm2 10a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2z" />
                          </svg>
                          <span className="truncate w-full">{doc.title}</span>
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          {/* Messages Area */}
          <div className="flex-1 p-4 space-y-4">
            {project?.messages?.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Ask questions about your documents or get help with your
                  project.
                </p>
              </div>
            ) : (
              project?.messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
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
                      {new Date(message.created_at).toLocaleTimeString()}
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
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
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
      {showDocumentsModal && project && (
        <DocumentsModal
          isOpen={showDocumentsModal}
          onClose={() => setShowDocumentsModal(false)}
          project={project}
        />
      )}
    </div>
  );
};
