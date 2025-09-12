import React from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronCircleLeft, FaSave } from "react-icons/fa";
import { IoMenuOutline } from "react-icons/io5";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { ProjectConfig } from "../../types";

interface SidebarProps {
  project: any;
  projectConfig: ProjectConfig | null;
  draftConfig: ProjectConfig | null;
  sidebarNodes: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
  }>;
  onDragStart: (
    event: React.DragEvent,
    nodeType: string,
    label: string
  ) => void;
  onSaveProject: () => Promise<void>;
  isSaving: boolean;
  saveStatus?: "idle" | "success" | "error";
}

const Sidebar: React.FC<SidebarProps> = ({
  project,
  projectConfig,
  draftConfig,
  sidebarNodes,
  onDragStart,
  onSaveProject,
  isSaving,
  saveStatus = "idle",
}) => {
  const navigate = useNavigate();

  return (
    <aside className="w-full shadow p-4 h-full overflow-y-auto bg-gray-900 text-white flex flex-col gap-4">
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
              {project.description!.length > 200
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
                  <span className="font-medium">Documents:</span>{" "}
                  {project?.documents?.length || project?.documents_count || 0}
                </p>
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
        </div>

        {projectConfig && (
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
        {draftConfig &&
          (!projectConfig ||
            JSON.stringify(draftConfig) !== JSON.stringify(projectConfig)) && (
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
                        {draftConfig.knowledge_base_node
                          .embedding_model_name && (
                          <p>
                            <span className="font-medium">
                              Knowledge Base Model:
                            </span>{" "}
                            {
                              draftConfig.knowledge_base_node
                                .embedding_model_name
                            }
                          </p>
                        )}
                        <p>
                          <span className="font-medium">
                            Knowledge Base Key:
                          </span>{" "}
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
                        <p className="text-gray-500 italic">
                          No nodes on canvas
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>
              <div className="mt-2">
                <Button
                  onClick={onSaveProject}
                  disabled={isSaving}
                  className="w-full"
                  variant={
                    saveStatus === "success"
                      ? "secondary"
                      : saveStatus === "error"
                      ? "destructive"
                      : "default"
                  }
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : saveStatus === "success" ? (
                    <div className="flex items-center gap-2">
                      <FaSave />
                      Saved!
                    </div>
                  ) : saveStatus === "error" ? (
                    <div className="flex items-center gap-2">
                      <FaSave />
                      Error - Retry
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
      <h3 className="text-sm font-medium mb-2">Nodes</h3>
      <div className="flex flex-col gap-2">
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
    </aside>
  );
};

export default Sidebar;
