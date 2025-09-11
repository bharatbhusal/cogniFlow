import React, { useEffect, useState, useCallback } from "react";
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

const nodeTypes = {
  userQueryNode: UserQueryNode,
  knowledgeBaseNode: KnowledgeBaseNode,
  webSearchNode: WebSearchNode,
  outputNode: OutputNode,
  llmNode: LlmNode,
};

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchOne, currentProject: project, setCurrent } = useProjects();
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  // Handlers for drag events
  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
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
    // Demo static nodes/edges for now
    setNodes([
      {
        id: "1",
        type: "userQueryNode",
        position: { x: 50, y: 50 },
        data: { label: "User Query" },
      },
      {
        id: "2",
        type: "knowledgeBaseNode",
        position: { x: 300, y: 100 },
        data: { label: "Knowledge Base", editable: editable },
      },
      {
        id: "3",
        type: "llmNode",
        position: { x: 800, y: -100 },
        data: { label: "LLM" },
      },
      {
        id: "4",
        type: "webSearchNode",
        position: { x: 1000, y: 200 },
        data: { label: "Web Search" },
      },
      {
        id: "5",
        type: "outputNode",
        position: { x: 1300, y: 50 },
        data: { label: "Output" },
      },
    ]);
    setEdges([
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
      { id: "e3-4", source: "3", target: "4" },
      { id: "e4-5", source: "4", target: "5" },
    ]);
  }, [projectId, editable, fetchOne, setCurrent]);

  return (
    <div className="h-[calc(100vh-100px)] w-full">
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate("/projects")}>
          <FaChevronCircleLeft size={24} />
        </Button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges.map((edge) => ({
          ...edge,
          style: { strokeDasharray: "4 2", strokeWidth: 1 },
        }))}
        nodeTypes={nodeTypes}
        fitView
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};
export default ProjectPage;
