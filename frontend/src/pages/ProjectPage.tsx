import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import { UserQueryNode } from "../components/reactflow/UserQueryNode";
import { KnowledgeBaseNode } from "../components/reactflow/KnowledgeBaseNode";
import { WebSearchNode } from "../components/reactflow/WebSearchNode";
import { OutputNode } from "../components/reactflow/OutputNode";
import { LlmNode } from "../components/reactflow/LlmNode";
import { useProjects } from "../hooks/useProjects";
import { Button } from "../components/ui/Button";
import { FaChevronCircleLeft } from "react-icons/fa";
import { Card, CardContent } from "../components/ui/Card";
import { WiStars } from "react-icons/wi";
import { IoBookOutline } from "react-icons/io5";
import { CiGlobe } from "react-icons/ci";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import { IoMenuOutline } from "react-icons/io5";

const nodeTypes = {
  userQueryNode: UserQueryNode,
  knowledgeBaseNode: KnowledgeBaseNode,
  webSearchNode: WebSearchNode,
  outputNode: OutputNode,
  llmNode: LlmNode,
};

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

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchOne, currentProject: project, setCurrent } = useProjects();
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [sidebarNodes, setSidebarNodes] = useState(initialSidebarNodes);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<any>(null);

  // Handlers for drag events
  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      let updated = applyNodeChanges(changes, nds);
      // Handle node deletion
      changes.forEach((change: any) => {
        if (change.type === "remove") {
          const removedNode = nds.find((n: any) => n.id === change.id);
          if (removedNode) {
            const sidebarNode = initialSidebarNodes.find(
              (n) => n.id === removedNode.type
            );
            setSidebarNodes((list) => [
              ...list,
              sidebarNode || {
                id: removedNode.type,
                label: removedNode.data.label,
                icon: <IoMenuOutline className="text-lg" />,
              },
            ]);
          }
        }
      });
      return updated;
    });
  }, []);
  const onEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // Allow user to create new edges interactively
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => [
      ...eds,
      { ...connection, id: `e${connection.source}-${connection.target}` },
    ]);
  }, []);

  // Parse editable from query string
  const searchParams = new URLSearchParams(location.search);
  const editable = searchParams.get("editable") === "true";

  useEffect(() => {
    if (projectId) {
      fetchOne(projectId).then((res) => setCurrent(res.payload));
    }
    setNodes([]);
    setEdges([]);
    setSidebarNodes(initialSidebarNodes);
  }, [projectId, editable, fetchOne, setCurrent]);

  // Drag and drop logic
  const onDragStart = (
    event: React.DragEvent,
    nodeType: string,
    label: string
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("label", label);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/reactflow");
    const label = event.dataTransfer.getData("label");
    if (typeof type === "undefined" || !type) return;
    let position = { x: 100, y: 100 };
    if (rfInstance) {
      position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
    }
    const newId = `${type}-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type,
        position,
        data: {
          label,
          onDelete: (idToDelete: string) => {
            setNodes((currentNodes) => {
              const nodeToRemove = currentNodes.find(
                (n) => n.id === idToDelete
              );
              if (nodeToRemove) {
                const sidebarNode = initialSidebarNodes.find(
                  (n) => n.id === nodeToRemove.type
                );
                setSidebarNodes((list) => [
                  ...list,
                  sidebarNode || {
                    id: nodeToRemove.type,
                    label: nodeToRemove.data.label,
                    icon: <IoMenuOutline className="text-lg" />,
                  },
                ]);
              }
              return currentNodes.filter((n) => n.id !== idToDelete);
            });
          },
        },
      },
    ]);
    setSidebarNodes((list) => list.filter((n) => n.id !== type));
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="h-screen w-full flex">
      {/* Sidebar */}
      <aside className="w-64 shadow p-4 h-full overflow-y-auto sticky top-0 bg-gray-900 text-white flex flex-col gap-4">
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
                    {project?.documents?.length ||
                      project?.documents_count ||
                      0}
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
      {/* Main Flow Area */}
      <div
        className="flex-1"
        ref={reactFlowWrapper}
        style={{ position: "relative" }}
      >
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              onDelete: (idToDelete: string) => {
                setNodes((currentNodes) => {
                  const nodeToRemove = currentNodes.find(
                    (n) => n.id === idToDelete
                  );
                  if (nodeToRemove) {
                    const sidebarNode = initialSidebarNodes.find(
                      (n) => n.id === nodeToRemove.type
                    );
                    setSidebarNodes((list) => [
                      ...list,
                      sidebarNode || {
                        id: nodeToRemove.type,
                        label: nodeToRemove.data.label,
                        icon: <IoMenuOutline className="text-lg" />,
                      },
                    ]);
                  }
                  return currentNodes.filter((n) => n.id !== idToDelete);
                });
              },
            },
          }))}
          edges={edges.map((edge) => ({
            ...edge,
            style: { strokeDasharray: "4 2", strokeWidth: 1 },
          }))}
          nodeTypes={nodeTypes}
          fitView
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setRfInstance}
          deleteKeyCode={"Delete"} // Enable delete with 'Delete' key
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};
export default ProjectPage;
