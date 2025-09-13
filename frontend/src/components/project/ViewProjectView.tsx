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
import Sidebar from "../reactflow/Sidebar";

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

  const createWorkflowNodes = useCallback(
    (projectConfig: ProjectConfig) => {
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

      const allNodeTypes = [
        "userQueryNode",
        ...workflowNodeTypes,
        "outputNode",
      ];

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      const nodeDataMapping: { [key: string]: any } = {
        knowledgeBaseNode: projectConfig.knowledge_base_node,
        llmNode: projectConfig.llm_node,
        webSearchNode: projectConfig.web_search_node,
      };

      allNodeTypes.forEach((nodeType, index) => {
        const nodeId = `${nodeType}-${index}`;

        // Smart grid layout that adapts to screen dimensions
        const nodeWidth = 500;
        const nodeHeight = 450;
        const padding = 20;
        const screenWidth = window.innerWidth - 300; // Account for sidebar
        const screenHeight = window.innerHeight - 100; // Account for margins

        // Calculate how many nodes can fit in each dimension
        const maxNodesPerRow = Math.floor((screenWidth - padding) / nodeWidth);
        const maxNodesPerCol = Math.floor(
          (screenHeight - padding) / nodeHeight
        );

        // Determine grid dimensions based on total nodes and available space
        const totalNodes = allNodeTypes.length;
        let nodesPerRow, nodesPerCol;

        if (screenWidth > screenHeight) {
          // Wide screen: prioritize horizontal layout, overflow vertically if needed
          nodesPerRow = Math.min(maxNodesPerRow, totalNodes);
          nodesPerCol = Math.ceil(totalNodes / nodesPerRow);
        } else {
          // Tall screen: prioritize vertical layout, overflow horizontally if needed
          nodesPerCol = Math.min(maxNodesPerCol, totalNodes);
          nodesPerRow = Math.ceil(totalNodes / nodesPerCol);
        }

        // Calculate position in grid
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;

        const x = col * nodeWidth + padding;
        const y = row * nodeHeight + padding;

        newNodes.push({
          id: nodeId,
          type: nodeType,
          position: { x, y },
          data: {
            onDelete: () => {}, // No-op in view mode
            onDataChange: () => {}, // No-op in view mode
            label: initialSidebarNodes.find((n) => n.id === nodeType)?.label,
            pdf_files: currentProject?.documents || [],
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
    },
    [currentProject]
  );

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

  return (
    <div className="h-screen w-full flex">
      <div className="w-64 bg-gray-900 text-white shadow h-full overflow-y-auto flex flex-col gap-4">
        <Sidebar
          project={currentProject}
          projectConfig={projectConfig}
          draftConfig={null}
          sidebarNodes={null}
          onDragStart={() => {}}
          onSaveProject={async () => {}}
          isSaving={false}
        />
      </div>
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
