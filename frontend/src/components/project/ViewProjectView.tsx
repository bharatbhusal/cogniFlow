import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  applyNodeChanges,
  Node,
  Edge,
  NodeChange,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { useProjects } from "../../hooks/useProjects";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { FaChevronCircleLeft, FaEdit } from "react-icons/fa";
import { WiStars } from "react-icons/wi";
import { IoBookOutline } from "react-icons/io5";
import { CiGlobe } from "react-icons/ci";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import { ProjectConfig } from "../../types";
import FlowEditor from "../reactflow/FlowEditor";

const initialSidebarNodes = [
  {
    id: "userQueryNode",
    label: "User Query",
    icon: <LuFileInput className="text-lg" />,
  },
  {
    id: "knowledgeBaseNode",
    label: "Knowledge Base",
    icon: <IoBookOutline className="text-lg" />,
  },
  { id: "llmNode", label: "LLM", icon: <WiStars className="text-lg" /> },
  {
    id: "webSearchNode",
    label: "Web Search",
    icon: <CiGlobe className="text-lg" />,
  },
  {
    id: "outputNode",
    label: "Output",
    icon: <LuFileOutput className="text-lg" />,
  },
];

interface ViewProjectViewProps {
  projectId: string;
}

const ViewProjectView: React.FC<ViewProjectViewProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const { fetchOne, currentProject, setCurrent, loading } = useProjects();

  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(
    null
  );
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const createWorkflowNodes = useCallback((projectConfig: ProjectConfig) => {
    if (!projectConfig.workflow) return { nodes: [], edges: [] };

    const workflowSteps = projectConfig.workflow.split("_");

    const nodeTypeMapping: { [key: string]: string } = {
      kb: "knowledgeBaseNode",
      llm: "llmNode",
      web: "webSearchNode",
    };

    const workflowNodeTypes = workflowSteps
      .map((step: string) => nodeTypeMapping[step])
      .filter(Boolean);

    const allNodeTypes = ["userQueryNode", ...workflowNodeTypes, "outputNode"];

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const nodeDataMapping: { [key: string]: any } = {
      knowledgeBaseNode: projectConfig.knowledge_base_node,
      llmNode: projectConfig.llm_node,
      webSearchNode: projectConfig.web_search_node,
    };

    allNodeTypes.forEach((nodeType, index) => {
      const nodeId = `${nodeType}-${index}`;
      newNodes.push({
        id: nodeId,
        type: nodeType,
        position: { x: index * 400, y: 250 },
        data: {
          onDelete: () => {}, // No-op in view mode
          onDataChange: () => {}, // No-op in view mode
          label: initialSidebarNodes.find((n) => n.id === nodeType)?.label,
          readOnly: true, // Flag to indicate read-only mode
          ...nodeDataMapping[nodeType],
        },
      });

      if (index > 0) {
        const sourceNodeId = `${allNodeTypes[index - 1]}-${index - 1}`;
        const targetNodeId = nodeId;
        newEdges.push({
          id: `e${sourceNodeId}-${targetNodeId}`,
          source: sourceNodeId,
          target: targetNodeId,
          animated: true,
          type: "customEdge",
          style: { strokeDasharray: "4 2", strokeWidth: 2 },
        });
      }
    });

    return { nodes: newNodes, edges: newEdges };
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchOne(projectId).then((res) => setCurrent(res.payload));
    }
  }, [projectId, fetchOne, setCurrent]);

  useEffect(() => {
    if (currentProject) {
      setProjectConfig({
        workflow: currentProject.workflow,
        knowledge_base_node: currentProject.knowledge_base_node,
        llm_node: currentProject.llm_node,
        web_search_node: {
          serpapi_api_key: currentProject.web_search_node?.serpapi_api_key,
        },
      });

      // Create workflow visualization if workflow exists
      if (currentProject.workflow) {
        const { nodes: newNodes, edges: newEdges } = createWorkflowNodes({
          workflow: currentProject.workflow,
          llm_node: currentProject.llm_node,
          knowledge_base_node: currentProject.knowledge_base_node,
          web_search_node: currentProject.web_search_node,
        });

        setNodes(newNodes);
        setEdges(newEdges);
      } else {
        setNodes([]);
        setEdges([]);
      }
    }
  }, [currentProject, createWorkflowNodes]);

  // Allow dragging nodes but prevent other changes
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      // Only allow position changes, filter out other change types
      const allowedChanges = changes.filter(
        (change) => change.type === "position" || change.type === "dimensions"
      );
      return applyNodeChanges(allowedChanges, nds);
    });
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    // Don't set dropEffect in view mode
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">Project not found</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If there's a workflow, show the ReactFlow interface
  //   if (currentProject.workflow && projectConfig) {
  return (
    <div className="h-screen w-full flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white shadow p-4 h-full overflow-y-auto flex flex-col gap-4">
        <div className="space-y-4">
          <div className="mx-auto">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <FaChevronCircleLeft size={24} />
              </Button>
              <h1 className="text-xl font-bold text-white">
                {currentProject.name}
              </h1>
            </div>
            {currentProject.description && (
              <p className="text-sm text-gray-400 mt-1">
                {currentProject.description.length > 100
                  ? currentProject.description.slice(0, 100) + "..."
                  : currentProject.description}
              </p>
            )}
          </div>

          {/* Project Info */}
          <div>
            <h3 className="text-sm font-medium text-white mb-2">
              Project Info
            </h3>
            <Card>
              <CardContent className="p-3">
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Documents:</span>{" "}
                    {currentProject.documents?.length ||
                      currentProject.documents_count ||
                      0}
                  </p>
                  <p>
                    <span className="font-medium">Messages:</span>{" "}
                    {currentProject.messages?.length ||
                      currentProject.messages_count ||
                      0}
                  </p>
                  <p>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(currentProject.created_at!).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Config */}
          {projectConfig && projectConfig.workflow && (
            <div>
              <h3 className="text-sm font-medium text-white mb-2">
                Workflow Configuration
              </h3>
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2 text-xs">
                    <p>
                      <span className="font-medium">Workflow:</span>{" "}
                      {projectConfig.workflow || "Not connected"}
                    </p>
                    {projectConfig.knowledge_base_node
                      ?.embedding_model_name && (
                      <p>
                        <span className="font-medium">KB Model:</span>{" "}
                        {projectConfig.knowledge_base_node.embedding_model_name}
                      </p>
                    )}
                    {projectConfig.knowledge_base_node?.openai_api_key && (
                      <p>
                        <span className="font-medium">KB Key:</span> **********
                      </p>
                    )}
                    {projectConfig.llm_node?.llm_model_name && (
                      <p>
                        <span className="font-medium">LLM Model:</span>{" "}
                        {projectConfig.llm_node.llm_model_name}
                      </p>
                    )}
                    {projectConfig.llm_node?.openai_api_key && (
                      <p>
                        <span className="font-medium">LLM Key:</span> **********
                      </p>
                    )}
                    {projectConfig.web_search_node?.serpapi_api_key && (
                      <p>
                        <span className="font-medium">Web Search:</span>{" "}
                        **********
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Edit Button */}
          <div>
            <Button
              onClick={() => navigate(`/projects/${projectId}?editable=true`)}
              className="w-full flex items-center gap-2"
            >
              <FaEdit />
              Edit Project
            </Button>
          </div>
        </div>

        <div className="mt-auto">
          <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
            <p className="font-medium mb-1">📖 View Mode</p>
            <p>
              You can drag nodes around but cannot modify, add, or delete them.
            </p>
          </div>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <FlowEditor
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={() => {}}
        onConnect={() => {}}
        onDrop={() => {}}
        onDragOver={onDragOver}
      />
    </div>
  );
};

export default ViewProjectView;
