import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaChevronCircleLeft,
  FaEdit,
  FaFilePdf,
  FaSave,
  FaTextHeight,
} from "react-icons/fa";
import { IoMenuOutline } from "react-icons/io5";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { Project, ProjectConfig } from "../../types";
import { LuMessageCircle, LuMessageCircleReply } from "react-icons/lu";

interface SidebarProps {
  project: Project | null;
  projectConfig: ProjectConfig | null;
  draftConfig: ProjectConfig | null;
  sidebarNodes: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
  }> | null;
  onDragStart: (
    event: React.DragEvent,
    nodeType: string,
    label: string
  ) => void;
  onSaveProject: () => Promise<void>;
  isSaving: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  project,
  projectConfig,
  draftConfig,
  sidebarNodes,
  onDragStart,
  onSaveProject,
  isSaving,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're currently on the chat page
  const isChatPage = location.pathname.includes(`/chat/${project?.id}`);

  return (
    <aside className="w-full shadow p-4 h-full overflow-y-auto bg-gray-900 text-white flex-col gap-4 flex">
      <div className="space-y-4">
        <div className="mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <FaChevronCircleLeft size={24} />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {project?.name}
            </h1>
          </div>
          {project?.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {project.description!.length > 200 && !isChatPage
                ? project.description!.slice(0, 200) + "..."
                : project.description}
            </p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Project Info
          </h3>
          <Card>
            <CardContent className="p-3">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Messages:</span>{" "}
                  {project?.messages?.length || project?.messages_count || 0}
                </p>
                <p>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(project?.created_at!).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {!isChatPage && (
            <Button
              onClick={() => navigate(`/chat/${project?.id}`)}
              className="w-full flex items-center gap-2 mt-2"
            >
              <LuMessageCircleReply />
              Chat
            </Button>
          )}

          {!draftConfig && (
            <Button
              onClick={() => navigate(`/projects/${project?.id}?editable=true`)}
              className="w-full flex items-center gap-2 mt-2"
            >
              <FaEdit />
              Edit Project
            </Button>
          )}
        </div>
        {project && project.documents && project.documents.length > 0 && (
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
                  <FaFilePdf className="text-red-500" />
                  <span className="truncate w-full">{doc.title}</span>
                </a>
              ))}
            </div>
          </>
        )}

        {projectConfig && projectConfig.workflow && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Saved Config
            </h3>
            <Card>
              <CardContent className="p-3">
                <div className="space-y-2 text-xs">
                  <p>
                    <span className="font-medium">Workflow:</span>{" "}
                    {projectConfig.workflow}
                  </p>
                  {projectConfig?.knowledge_base_node?.embedding_model_name && (
                    <p>
                      <span className="font-medium">Knowledge Base Model:</span>{" "}
                      {projectConfig.knowledge_base_node.embedding_model_name}
                    </p>
                  )}
                  {projectConfig?.knowledge_base_node?.openai_api_key && (
                    <p>
                      <span className="font-medium">Knowledge Base Key:</span>{" "}
                      {projectConfig.knowledge_base_node.openai_api_key
                        ? "**********"
                        : "Not Configured"}
                    </p>
                  )}
                  {projectConfig?.llm_node?.llm_model_name && (
                    <p>
                      <span className="font-medium">LLM Model:</span>{" "}
                      {projectConfig.llm_node.llm_model_name}
                    </p>
                  )}
                  {projectConfig?.llm_node?.openai_api_key && (
                    <p>
                      <span className="font-medium">LLM Key:</span>{" "}
                      {projectConfig.llm_node.openai_api_key
                        ? "**********"
                        : "Not Configured"}
                    </p>
                  )}
                  {projectConfig?.web_search_node?.serpapi_api_key && (
                    <p>
                      <span className="font-medium">Web Search:</span>{" "}
                      {projectConfig?.web_search_node?.serpapi_api_key
                        ? "**********"
                        : "Not Configured"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {draftConfig && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Draft Config
            </h3>
            <Card>
              <CardContent className="p-3">
                <div className="space-y-2 text-xs">
                  <p>
                    <span className="font-medium">Workflow:</span>{" "}
                    {draftConfig?.workflow || "Not connected"}
                  </p>
                  {draftConfig.knowledge_base_node && (
                    <>
                      {draftConfig.knowledge_base_node.embedding_model_name && (
                        <p>
                          <span className="font-medium">
                            Knowledge Base Model:
                          </span>{" "}
                          {draftConfig.knowledge_base_node.embedding_model_name}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Knowledge Base Key:</span>{" "}
                        {draftConfig.knowledge_base_node.openai_api_key
                          ? "**********"
                          : "Not Configured"}
                      </p>
                    </>
                  )}
                  {draftConfig.llm_node && (
                    <>
                      {draftConfig.llm_node.llm_model_name && (
                        <p>
                          <span className="font-medium">LLM Model:</span>{" "}
                          {draftConfig.llm_node.llm_model_name}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">LLM Key:</span>{" "}
                        {draftConfig.llm_node.openai_api_key
                          ? "**********"
                          : "Not Configured"}
                      </p>
                    </>
                  )}
                  {draftConfig.web_search_node && (
                    <p>
                      <span className="font-medium">Web Search:</span>{" "}
                      {draftConfig.web_search_node.serpapi_api_key
                        ? "**********"
                        : "Not Configured"}
                    </p>
                  )}
                  {Object.keys(draftConfig).length === 0 &&
                    !projectConfig?.workflow && (
                      <p className="text-gray-500 italic">No nodes on canvas</p>
                    )}
                </div>
              </CardContent>
            </Card>
            <div className="mt-2">
              <Button
                onClick={onSaveProject}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FaSave />
                    Save Project
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      {sidebarNodes && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium mb-2">Nodes</h3>
          {sidebarNodes.map((node) => (
            <div
              key={node.id}
              className="cursor-move flex justify-between items-center bg-gray-800 rounded p-2 text-center text-sm border border-gray-700 hover:bg-gray-700 transition"
              draggable
              onDragStart={(e) => onDragStart(e, node.id, node.label)}
            >
              <div className="flex items-center gap-2">
                {node.icon}
                {node.label}
              </div>
              <IoMenuOutline />
            </div>
          ))}
        </div>
      )}

      {!draftConfig && !isChatPage && (
        <div className="mt-auto">
          <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
            <p className="font-medium mb-1">📖 View Mode</p>
            <p>
              You can drag nodes around but cannot modify, add, or delete them.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
