import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { UserQueryNode } from "../components/reactflow/UserQueryNode";
import { KnowledgeBaseNode } from "../components/reactflow/KnowledgeBaseNode";
import { WebSearchNode } from "../components/reactflow/WebSearchNode";
import { OutputNode } from "../components/reactflow/OutputNode";
import { LlmNode } from "../components/reactflow/LlmNode";
import { useProjects } from "../hooks/useProjects";
import { Button } from "../components/ui/Button";
import { FaChevronCircleLeft, FaSave } from "react-icons/fa";
import { Card, CardContent } from "../components/ui/Card";
import { WiStars } from "react-icons/wi";
import { IoBookOutline } from "react-icons/io5";
import { CiGlobe } from "react-icons/ci";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import { IoMenuOutline } from "react-icons/io5";
import CustomEdge from "../components/reactflow/CustomEdge";
import { ProjectConfig } from "../types";

const nodeTypes = {
  userQueryNode: UserQueryNode,
  knowledgeBaseNode: KnowledgeBaseNode,
  webSearchNode: WebSearchNode,
  outputNode: OutputNode,
  llmNode: LlmNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
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

const FlowEditor: React.FC = () => {
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = new URLSearchParams(location.search);
  const editable = searchParams.get("editable") === "true";

  const { fetchOne, currentProject, setCurrent, update, loading } =
    useProjects();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [sidebarNodes, setSidebarNodes] = useState(initialSidebarNodes);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(
    null
  );
  const [currentNodeData, setCurrentNodeData] = useState<{
    [key: string]: any;
  }>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  // Helper function to extract current node data from canvas
  const getCurrentNodeDataFromCanvas = useCallback((currentNodes: Node[]) => {
    const nodeData: { [key: string]: any } = {};

    currentNodes.forEach((node) => {
      if (node.type === "knowledgeBaseNode") {
        nodeData.knowledge_base_node = {
          embedding_model_name: node.data.embedding_model_name || "",
          openai_api_key: node.data.openai_api_key || "",
        };
      } else if (node.type === "llmNode") {
        nodeData.llm_node = {
          model_name: node.data.llm_model_name || node.data.model_name || "",
          openai_api_key: node.data.openai_api_key || "",
        };
      } else if (node.type === "webSearchNode") {
        nodeData.web_search_node = {
          serpapi_api_key: node.data.serpapi_api_key || "",
        };
      }
    });

    return nodeData;
  }, []);

  // Helper function to create workflow nodes from project workflow
  const createWorkflowNodes = useCallback(
    (
      project: any,
      onDeleteNode: (id: string) => void,
      onNodeDataChange: (id: string, field: string, value: string) => void
    ) => {
      if (!project?.workflow) return { nodes: [], edges: [] };

      const workflowSteps = project.workflow.split("_");

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
        knowledgeBaseNode: project.knowledge_base_node,
        llmNode: project.llm_node,
        webSearchNode: project.web_search_node,
      };

      allNodeTypes.forEach((nodeType, index) => {
        const nodeId = `${nodeType}-${index}`;
        newNodes.push({
          id: nodeId,
          type: nodeType,
          position: { x: index * 400, y: 250 },
          data: {
            onDelete: onDeleteNode,
            onDataChange: onNodeDataChange,
            label:
              initialSidebarNodes.find((n) => n.id === nodeType)?.label ||
              "Node",
            ...(nodeDataMapping[nodeType] || {}),
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
            style: { strokeDasharray: "4 2", strokeWidth: 1 },
          });
        }
      });

      return { nodes: newNodes, edges: newEdges };
    },
    []
  );

  // Helper function to calculate workflow based on connected nodes
  const calculateWorkflowFromConnectedNodes = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      // Find nodes that are connected in the workflow chain
      const connectedNodes = new Set<string>();

      // Start from userQueryNode and follow the connections
      const userQueryNodes = currentNodes.filter(
        (n) => n.type === "userQueryNode"
      );
      const outputNodes = currentNodes.filter((n) => n.type === "outputNode");

      if (userQueryNodes.length === 0 || outputNodes.length === 0) {
        return "";
      }

      // Function to find connected path from source to target
      const findConnectedPath = (
        sourceId: string,
        visited: Set<string> = new Set()
      ): string[] => {
        if (visited.has(sourceId)) return [];
        visited.add(sourceId);

        const outgoingEdges = currentEdges.filter(
          (edge) => edge.source === sourceId
        );

        for (const edge of outgoingEdges) {
          const targetNode = currentNodes.find((n) => n.id === edge.target);
          if (!targetNode) continue;

          if (targetNode.type === "outputNode") {
            return [sourceId, targetNode.id];
          }

          const path = findConnectedPath(targetNode.id, new Set(visited));
          if (path.length > 0) {
            return [sourceId, ...path];
          }
        }

        return [];
      };

      // Find path from userQuery to output
      const userQueryNode = userQueryNodes[0];
      const connectedPath = findConnectedPath(userQueryNode.id);

      if (connectedPath.length === 0) {
        return "";
      }

      // Extract workflow node types from the connected path (excluding userQuery and output)
      const workflowParts: string[] = [];
      const pathNodes = connectedPath
        .map((nodeId) => currentNodes.find((n) => n.id === nodeId))
        .filter(Boolean);

      for (const node of pathNodes) {
        if (node!.type === "knowledgeBaseNode") {
          workflowParts.push("kb");
        } else if (node!.type === "llmNode") {
          workflowParts.push("llm");
        } else if (node!.type === "webSearchNode") {
          workflowParts.push("web");
        }
      }

      const workflow = workflowParts.join("_");
      console.log(
        "Calculated workflow from connected nodes:",
        workflow,
        "Connected path:",
        connectedPath.map((id) => currentNodes.find((n) => n.id === id)?.type)
      );
      return workflow;
    },
    []
  );

  // Helper function to check if a node is in the connected path
  const isNodeInConnectedPath = useCallback(
    (nodeId: string, currentNodes: Node[], currentEdges: Edge[]): boolean => {
      const userQueryNodes = currentNodes.filter(
        (n) => n.type === "userQueryNode"
      );
      const outputNodes = currentNodes.filter((n) => n.type === "outputNode");

      if (userQueryNodes.length === 0 || outputNodes.length === 0) {
        return false;
      }

      const findPathToOutput = (
        currentId: string,
        targetId: string,
        visited: Set<string> = new Set()
      ): boolean => {
        if (currentId === targetId) return true;
        if (visited.has(currentId)) return false;
        visited.add(currentId);

        const outgoingEdges = currentEdges.filter(
          (edge) => edge.source === currentId
        );

        for (const edge of outgoingEdges) {
          if (findPathToOutput(edge.target, targetId, new Set(visited))) {
            return true;
          }
        }

        return false;
      };

      const userQueryNode = userQueryNodes[0];
      const outputNode = outputNodes[0];

      // Check if there's a path from userQuery through this node to output
      const pathFromUserToNode = findPathToOutput(userQueryNode.id, nodeId);
      const pathFromNodeToOutput = findPathToOutput(nodeId, outputNode.id);

      return pathFromUserToNode && pathFromNodeToOutput;
    },
    []
  );

  // Helper function to update projectConfig with proper data management
  const updateProjectConfigWithConnectedNodes = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      setProjectConfig((prevConfig) => {
        if (!prevConfig) return prevConfig;

        const newWorkflow = calculateWorkflowFromConnectedNodes(
          currentNodes,
          currentEdges
        );
        const updatedConfig = { ...prevConfig };

        // Update workflow
        updatedConfig.workflow = newWorkflow;

        // Get connected workflow node types
        const workflowTypes = newWorkflow ? newWorkflow.split("_") : [];

        // Find connected nodes of each type to preserve their data
        const connectedKbNodes = currentNodes.filter(
          (n) =>
            n.type === "knowledgeBaseNode" &&
            isNodeInConnectedPath(n.id, currentNodes, currentEdges)
        );
        const connectedLlmNodes = currentNodes.filter(
          (n) =>
            n.type === "llmNode" &&
            isNodeInConnectedPath(n.id, currentNodes, currentEdges)
        );
        const connectedWebNodes = currentNodes.filter(
          (n) =>
            n.type === "webSearchNode" &&
            isNodeInConnectedPath(n.id, currentNodes, currentEdges)
        );

        // Manage knowledge base node data
        if (workflowTypes.includes("kb") && connectedKbNodes.length > 0) {
          const kbNode = connectedKbNodes[0]; // Use first connected KB node
          updatedConfig.knowledge_base_node = {
            embedding_model_name:
              kbNode.data.embedding_model_name ||
              prevConfig.knowledge_base_node?.embedding_model_name ||
              "",
            openai_api_key:
              kbNode.data.openai_api_key ||
              prevConfig.knowledge_base_node?.openai_api_key ||
              "",
          };
        } else if (!workflowTypes.includes("kb")) {
          // Clear KB data if no KB node is connected
          updatedConfig.knowledge_base_node = {
            embedding_model_name: "",
            openai_api_key: "",
          };
        }

        // Manage LLM node data
        if (workflowTypes.includes("llm") && connectedLlmNodes.length > 0) {
          const llmNode = connectedLlmNodes[0]; // Use first connected LLM node
          updatedConfig.llm_node = {
            llm_model_name:
              llmNode.data.llm_model_name ||
              llmNode.data.model_name ||
              prevConfig.llm_node?.llm_model_name ||
              "",
            openai_api_key:
              llmNode.data.openai_api_key ||
              prevConfig.llm_node?.openai_api_key ||
              "",
          };
        } else if (!workflowTypes.includes("llm")) {
          // Clear LLM data if no LLM node is connected
          updatedConfig.llm_node = {
            llm_model_name: "",
            openai_api_key: "",
          };
        }

        // Manage web search node data
        if (workflowTypes.includes("web") && connectedWebNodes.length > 0) {
          const webNode = connectedWebNodes[0]; // Use first connected web node
          updatedConfig.web_search_node = {
            serpapi_api_key:
              webNode.data.serpapi_api_key ||
              prevConfig.web_search_node?.serpapi_api_key ||
              "",
          };
        } else if (!workflowTypes.includes("web")) {
          // Clear web search data if no web node is connected
          updatedConfig.web_search_node = {
            serpapi_api_key: "",
          };
        }

        console.log(
          "Updated project config with connected nodes:",
          updatedConfig
        );
        return updatedConfig;
      });
    },
    [calculateWorkflowFromConnectedNodes, isNodeInConnectedPath]
  );

  useEffect(() => {
    if (projectId) {
      fetchOne(projectId).then((res) => setCurrent(res.payload));
    }
  }, [projectId, fetchOne, setCurrent]);

  useEffect(() => {
    if (currentProject && currentProject.workflow) {
      const { nodes: newNodes, edges: newEdges } = createWorkflowNodes(
        currentProject,
        onDeleteNode,
        onNodeDataChange
      );

      setNodes(newNodes);
      setEdges(newEdges);

      // Update current node data for sidebar display
      setCurrentNodeData(getCurrentNodeDataFromCanvas(newNodes));

      const workflowSteps = currentProject.workflow.split("_");
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
      const nodesOnCanvas = new Set(allNodeTypes);
      setSidebarNodes(
        initialSidebarNodes.filter((n) => !nodesOnCanvas.has(n.id))
      );
    } else {
      setNodes([]);
      setEdges([]);
      setCurrentNodeData({});
      setSidebarNodes(initialSidebarNodes);
    }
    setProjectConfig({
      workflow: currentProject?.workflow || "",
      knowledge_base_node: {
        embedding_model_name:
          currentProject?.knowledge_base_node?.embedding_model_name || "",
        openai_api_key:
          currentProject?.knowledge_base_node?.openai_api_key || "",
      },
      llm_node: {
        llm_model_name: currentProject?.llm_node?.llm_model_name || "",
        openai_api_key: currentProject?.llm_node?.openai_api_key || "",
      },
      web_search_node: {
        serpapi_api_key: currentProject?.web_search_node?.serpapi_api_key || "",
      },
    });
  }, [
    currentProject,
    editable,
    createWorkflowNodes,
    getCurrentNodeDataFromCanvas,
  ]);

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => {
        const nodeToDelete = prevNodes.find((n) => n.id === nodeId);
        if (!nodeToDelete) return prevNodes;

        // Add the node back to sidebar if it's not already there
        const sidebarNode = initialSidebarNodes.find(
          (n) => n.id === nodeToDelete.type
        );
        if (sidebarNode) {
          setSidebarNodes((currentSidebarNodes) => {
            if (!currentSidebarNodes.some((s) => s.id === sidebarNode.id)) {
              return [...currentSidebarNodes, sidebarNode];
            }
            return currentSidebarNodes;
          });
        }

        // Update projectConfig with connected nodes logic
        setProjectConfig((prevConfig) => {
          if (!prevConfig) return prevConfig;

          const remainingNodes = prevNodes.filter((n) => n.id !== nodeId);
          const remainingEdges = edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          );

          const newWorkflow = calculateWorkflowFromConnectedNodes(
            remainingNodes,
            remainingEdges
          );
          const updatedConfig = { ...prevConfig };
          updatedConfig.workflow = newWorkflow;

          // Get connected workflow node types
          const workflowTypes = newWorkflow ? newWorkflow.split("_") : [];

          // If the deleted node type is no longer in the connected workflow, clear its data
          if (
            nodeToDelete.type === "knowledgeBaseNode" &&
            !workflowTypes.includes("kb")
          ) {
            updatedConfig.knowledge_base_node = {
              embedding_model_name: "",
              openai_api_key: "",
            };
          } else if (
            nodeToDelete.type === "llmNode" &&
            !workflowTypes.includes("llm")
          ) {
            updatedConfig.llm_node = {
              llm_model_name: "",
              openai_api_key: "",
            };
          } else if (
            nodeToDelete.type === "webSearchNode" &&
            !workflowTypes.includes("web")
          ) {
            updatedConfig.web_search_node = {
              serpapi_api_key: "",
            };
          }

          return updatedConfig;
        });

        const remainingNodes = prevNodes.filter((n) => n.id !== nodeId);

        // Update current node data for sidebar display
        setCurrentNodeData(getCurrentNodeDataFromCanvas(remainingNodes));

        return remainingNodes;
      });

      // Remove connected edges
      setEdges((prevEdges) =>
        prevEdges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        )
      );
    },
    [edges, calculateWorkflowFromConnectedNodes, getCurrentNodeDataFromCanvas]
  );

  const onNodeDataChange = useCallback(
    (nodeId: string, field: string, value: string) => {
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, [field]: value } }
            : node
        );

        // Update current node data for sidebar display
        setCurrentNodeData(getCurrentNodeDataFromCanvas(updatedNodes));

        // Update projectConfig only if the node is connected in the workflow
        setProjectConfig((prevConfig) => {
          if (!prevConfig) return prevConfig;

          const node = updatedNodes.find((n) => n.id === nodeId);
          if (!node) return prevConfig;

          // Check if this node is in the connected path
          const isConnected = isNodeInConnectedPath(
            nodeId,
            updatedNodes,
            edges
          );
          if (!isConnected) {
            console.log(
              `Node ${nodeId} is not connected, skipping config update`
            );
            return prevConfig;
          }

          const updatedConfig = { ...prevConfig };

          if (node.type === "knowledgeBaseNode") {
            updatedConfig.knowledge_base_node = {
              ...updatedConfig.knowledge_base_node,
              [field]: value,
            };
          } else if (node.type === "llmNode") {
            // Map the field name correctly for llm_node
            const mappedField =
              field === "llm_model_name" ? "llm_model_name" : field;
            updatedConfig.llm_node = {
              ...updatedConfig.llm_node,
              [mappedField]: value,
            };
          } else if (node.type === "webSearchNode") {
            updatedConfig.web_search_node = {
              ...updatedConfig.web_search_node,
              [field]: value,
            };
          }

          console.log(
            "ProjectConfig updated for connected node:",
            updatedConfig
          );
          return updatedConfig;
        });

        return updatedNodes;
      });
    },
    [edges, isNodeInConnectedPath]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);

        // Update current node data for sidebar display
        setCurrentNodeData(getCurrentNodeDataFromCanvas(updatedNodes));

        changes.forEach((change) => {
          if (change.type === "remove") {
            const removedNode = nds.find((n) => n.id === change.id);
            if (removedNode) {
              const sidebarNode = initialSidebarNodes.find(
                (n) => n.id === removedNode.type
              );
              if (sidebarNode) {
                setSidebarNodes((currentSidebarNodes) => {
                  if (
                    !currentSidebarNodes.some((s) => s.id === sidebarNode.id)
                  ) {
                    return [...currentSidebarNodes, sidebarNode];
                  }
                  return currentSidebarNodes;
                });
              }
            }
          }
        });

        return updatedNodes;
      });
    },
    [getCurrentNodeDataFromCanvas]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((prevEdges) => {
        const updatedEdges = applyEdgeChanges(changes, prevEdges);

        // Update workflow and node data when edges are changed
        updateProjectConfigWithConnectedNodes(nodes, updatedEdges);

        return updatedEdges;
      });
    },
    [nodes, updateProjectConfigWithConnectedNodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        id: `e${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
        animated: true,
        type: "customEdge",
        style: { strokeDasharray: "4 2", strokeWidth: 1 },
      };

      setEdges((prevEdges) => {
        const updatedEdges = [...prevEdges, newEdge];

        // Update workflow and node data when new connection is made
        updateProjectConfigWithConnectedNodes(nodes, updatedEdges);

        return updatedEdges;
      });
    },
    [nodes, updateProjectConfigWithConnectedNodes]
  );

  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: string, label: string) => {
      event.dataTransfer.setData("application/reactflow", nodeType);
      event.dataTransfer.setData("label", label);
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      const label = event.dataTransfer.getData("label");

      if (typeof type === "undefined" || !type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newId = `${type}-${Date.now()}`;
      const newNode: Node = {
        id: newId,
        type,
        position,
        data: {
          label,
          onDelete: onDeleteNode,
          onDataChange: onNodeDataChange,
        },
      };

      setNodes((nds) => {
        const updatedNodes = [...nds, newNode];

        // Update current node data for sidebar display
        setCurrentNodeData(getCurrentNodeDataFromCanvas(updatedNodes));

        return updatedNodes;
      });
      setSidebarNodes((list) => list.filter((n) => n.id !== type));

      // Initialize node data in projectConfig when a new node is added (but don't update workflow until connected)
      setProjectConfig((prevConfig) => {
        if (!prevConfig) return prevConfig;

        const updatedConfig = { ...prevConfig };

        // Initialize node data if it doesn't exist
        if (
          type === "knowledgeBaseNode" &&
          !updatedConfig.knowledge_base_node
        ) {
          updatedConfig.knowledge_base_node = {
            embedding_model_name: "",
            openai_api_key: "",
          };
        } else if (type === "llmNode" && !updatedConfig.llm_node) {
          updatedConfig.llm_node = {
            llm_model_name: "",
            openai_api_key: "",
          };
        } else if (type === "webSearchNode" && !updatedConfig.web_search_node) {
          updatedConfig.web_search_node = {
            serpapi_api_key: "",
          };
        }

        // Don't update workflow here - it will be updated when nodes are connected via edges
        return updatedConfig;
      });
    },
    [screenToFlowPosition, onDeleteNode, onNodeDataChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleSaveProject = useCallback(async () => {
    if (!currentProject || !projectConfig || !projectId) {
      console.error("Missing project data for save operation");
      setSaveStatus("error");
      return;
    }

    try {
      setSaveStatus("idle");
      const updateData = {
        workflow: projectConfig.workflow,
        llm_node: {
          llm_model_name: projectConfig.llm_node?.llm_model_name || "",
          openai_api_key: projectConfig.llm_node?.openai_api_key || "",
        },
        knowledge_base_node: {
          embedding_model_name:
            projectConfig.knowledge_base_node?.embedding_model_name || "",
          openai_api_key:
            projectConfig.knowledge_base_node?.openai_api_key || "",
        },
        web_search_node: {
          serpapi_api_key: projectConfig.web_search_node?.serpapi_api_key || "",
        },
      } as any; // Type assertion to bypass strict type checking

      await update(projectId, updateData);
      setSaveStatus("success");
      console.log("Project saved successfully!");

      // Reset success status after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("error");
      console.error("Error saving project:", error);

      // Reset error status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [currentProject, projectConfig, projectId, update]);

  return (
    <div className="flex h-screen w-full">
      <div className="w-64">
        <Sidebar
          project={currentProject}
          projectConfig={projectConfig}
          currentNodeData={currentNodeData}
          sidebarNodes={sidebarNodes}
          onDragStart={onDragStart}
          onSaveProject={handleSaveProject}
          isSaving={loading}
          saveStatus={saveStatus}
        />
      </div>
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

interface SidebarProps {
  project: any;
  projectConfig: ProjectConfig | null;
  currentNodeData: { [key: string]: any };
  sidebarNodes: typeof initialSidebarNodes;
  onDragStart: (
    event: React.DragEvent,
    nodeType: string,
    label: string
  ) => void;
  onSaveProject: () => Promise<void>;
  isSaving: boolean;
  saveStatus: "idle" | "success" | "error";
}

const Sidebar: React.FC<SidebarProps> = ({
  project,
  projectConfig,
  currentNodeData,
  sidebarNodes,
  onDragStart,
  onSaveProject,
  isSaving,
  saveStatus,
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
        {(projectConfig || Object.keys(currentNodeData).length > 0) && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Current Node Data
            </h3>
            <Card>
              <CardContent className="p-3">
                <div className="space-y-2 text-xs">
                  <p>
                    <span className="font-medium">Workflow:</span>{" "}
                    {projectConfig?.workflow || "Not connected"}
                  </p>
                  {currentNodeData.knowledge_base_node && (
                    <>
                      {currentNodeData.knowledge_base_node
                        .embedding_model_name && (
                        <p>
                          <span className="font-medium">KB Model:</span>{" "}
                          {
                            currentNodeData.knowledge_base_node
                              .embedding_model_name
                          }
                        </p>
                      )}
                      <p>
                        <span className="font-medium">KB Key:</span>{" "}
                        {currentNodeData.knowledge_base_node.openai_api_key
                          ? "Configured"
                          : "Not configured"}
                      </p>
                    </>
                  )}
                  {currentNodeData.llm_node && (
                    <>
                      {currentNodeData.llm_node.model_name && (
                        <p>
                          <span className="font-medium">LLM Model:</span>{" "}
                          {currentNodeData.llm_node.model_name}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">LLM Key:</span>{" "}
                        {currentNodeData.llm_node.openai_api_key
                          ? "Configured"
                          : "Not configured"}
                      </p>
                    </>
                  )}
                  {currentNodeData.web_search_node && (
                    <p>
                      <span className="font-medium">Web Search:</span>{" "}
                      {currentNodeData.web_search_node.serpapi_api_key
                        ? "Configured"
                        : "Not configured"}
                    </p>
                  )}
                  {Object.keys(currentNodeData).length === 0 &&
                    !projectConfig?.workflow && (
                      <p className="text-gray-500 italic">No nodes on canvas</p>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
                      <span className="font-medium">KB Model:</span>{" "}
                      {projectConfig.knowledge_base_node.embedding_model_name}
                    </p>
                  )}
                  {projectConfig?.knowledge_base_node?.openai_api_key && (
                    <p>
                      <span className="font-medium">KB Key:</span>{" "}
                      {projectConfig.knowledge_base_node.openai_api_key}
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
                      {projectConfig.llm_node.openai_api_key}
                    </p>
                  )}
                  {projectConfig?.web_search_node?.serpapi_api_key && (
                    <p>
                      <span className="font-medium">Web Search:</span>{" "}
                      {projectConfig?.web_search_node?.serpapi_api_key
                        ? "Configured"
                        : "Not configured"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <div>
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

const ProjectPage: React.FC = () => {
  return (
    <div className="h-screen w-full flex">
      <ReactFlowProvider>
        <FlowEditor />
      </ReactFlowProvider>
    </div>
  );
};

export default ProjectPage;
