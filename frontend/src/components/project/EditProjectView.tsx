import React, { useEffect, useState, useCallback } from "react";
import {
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { useProjects } from "../../hooks/useProjects";
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

interface EditProjectViewProps {
  projectId: string;
}

const EditProjectView: React.FC<EditProjectViewProps> = ({ projectId }) => {
  const { fetchOne, currentProject, setCurrent, update, loading } =
    useProjects();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [sidebarNodes, setSidebarNodes] = useState(initialSidebarNodes);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [isSaving, setIsSaving] = useState(false);

  const { screenToFlowPosition } = useReactFlow();

  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(
    null
  );
  const [draftConfig, setDraftConfig] = useState<ProjectConfig | null>(null);

  const getCurrentNodeDataFromCanvas = useCallback((currentNodes: Node[]) => {
    const nodeData: { [key: string]: any } = {};

    currentNodes.forEach((node) => {
      if (node.type === "knowledgeBaseNode") {
        nodeData.knowledge_base_node = node.data;
      } else if (node.type === "llmNode") {
        nodeData.llm_node = node.data;
      } else if (node.type === "webSearchNode") {
        nodeData.web_search_node = node.data;
      }
    });

    return nodeData;
  }, []);

  const createWorkflowNodes = useCallback(
    (
      projectConfig: ProjectConfig,
      onDeleteNode: (id: string) => void,
      onNodeDataChange: (id: string, field: string, value: string) => void
    ) => {
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
        newNodes.push({
          id: nodeId,
          type: nodeType,
          position: { x: index * 400, y: 250 },
          data: {
            onDelete: onDeleteNode,
            onDataChange: onNodeDataChange,
            label: initialSidebarNodes.find((n) => n.id === nodeType)?.label,
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
    []
  );

  const calculateWorkflowFromConnectedNodes = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      const userQueryNodes = currentNodes.filter(
        (n) => n.type === "userQueryNode"
      );
      const outputNodes = currentNodes.filter((n) => n.type === "outputNode");

      if (userQueryNodes.length === 0 || outputNodes.length === 0) {
        return "";
      }

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

      const userQueryNode = userQueryNodes[0];
      const connectedPath = findConnectedPath(userQueryNode.id);

      if (connectedPath.length === 0) {
        return "";
      }

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

  const isNodeInConnectedPath = useCallback(
    (nodeId: string, currentNodes: Node[], currentEdges: Edge[]): boolean => {
      const userQueryNode = currentNodes.find(
        (n) => n.type === "userQueryNode"
      );
      const outputNode = currentNodes.find((n) => n.type === "outputNode");

      if (!userQueryNode || !outputNode) {
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

      const pathFromUserToNode = findPathToOutput(userQueryNode.id, nodeId);
      const pathFromNodeToOutput = findPathToOutput(nodeId, outputNode.id);

      return pathFromUserToNode && pathFromNodeToOutput;
    },
    []
  );

  const updateDraftConfigWithConnectedNodes = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      setDraftConfig((prevConfig) => {
        if (!prevConfig) return prevConfig;

        const newWorkflow = calculateWorkflowFromConnectedNodes(
          currentNodes,
          currentEdges
        );
        const updatedConfig = { ...prevConfig };

        updatedConfig.workflow = newWorkflow;

        const workflowTypes = newWorkflow ? newWorkflow.split("_") : [];

        const connectedKbNode = currentNodes.find(
          (n) =>
            n.type === "knowledgeBaseNode" &&
            isNodeInConnectedPath(n.id, currentNodes, currentEdges)
        );
        const connectedLlmNode = currentNodes.find(
          (n) =>
            n.type === "llmNode" &&
            isNodeInConnectedPath(n.id, currentNodes, currentEdges)
        );
        const connectedWebNode = currentNodes.find(
          (n) =>
            n.type === "webSearchNode" &&
            isNodeInConnectedPath(n.id, currentNodes, currentEdges)
        );

        if (workflowTypes.includes("kb") && connectedKbNode) {
          const kbNode = connectedKbNode;
          updatedConfig.knowledge_base_node = kbNode.data;
        }

        if (workflowTypes.includes("llm") && connectedLlmNode) {
          const llmNode = connectedLlmNode;
          updatedConfig.llm_node = llmNode.data;
        }

        if (workflowTypes.includes("web") && connectedWebNode) {
          const webNode = connectedWebNode;
          updatedConfig.web_search_node = webNode.data;
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

  // Load project data
  useEffect(() => {
    if (projectId) {
      fetchOne(projectId).then((res) => setCurrent(res.payload));
    }
  }, [projectId, fetchOne, setCurrent]);

  // Initialize nodes and edges from project data
  useEffect(() => {
    if (currentProject && currentProject.workflow) {
      const { nodes: newNodes, edges: newEdges } = createWorkflowNodes(
        {
          workflow: currentProject.workflow,
          llm_node: currentProject.llm_node,
          knowledge_base_node: currentProject.knowledge_base_node,
          web_search_node: currentProject.web_search_node,
        },
        onDeleteNode,
        onNodeDataChange
      );

      setNodes(newNodes);
      setEdges(newEdges);

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
      setDraftConfig(null);
      setSidebarNodes(initialSidebarNodes);
    }

    setProjectConfig({
      workflow: currentProject?.workflow,
      knowledge_base_node: currentProject?.knowledge_base_node,
      llm_node: currentProject?.llm_node,
      web_search_node: {
        serpapi_api_key: currentProject?.web_search_node?.serpapi_api_key,
      },
    });
    setDraftConfig({
      workflow: currentProject?.workflow,
      knowledge_base_node: currentProject?.knowledge_base_node,
      llm_node: currentProject?.llm_node,
      web_search_node: {
        serpapi_api_key: currentProject?.web_search_node?.serpapi_api_key,
      },
    });
  }, [currentProject, createWorkflowNodes, getCurrentNodeDataFromCanvas]);

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => {
        const nodeToDelete = prevNodes.find((n) => n.id === nodeId);
        if (!nodeToDelete) return prevNodes;

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

        const remainingNodes = prevNodes.filter((n) => n.id !== nodeId);

        setDraftConfig((prevDraftConfig) => ({
          ...prevDraftConfig,
          ...getCurrentNodeDataFromCanvas(remainingNodes),
          workflow: "Not Configured",
        }));

        return remainingNodes;
      });

      setEdges((prevEdges) =>
        prevEdges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        )
      );
    },
    [edges, getCurrentNodeDataFromCanvas]
  );

  const onNodeDataChange = useCallback(
    (nodeId: string, field: string, value: string) => {
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, [field]: value } }
            : node
        );

        setDraftConfig((prevConfig) => {
          const node = updatedNodes.find((n) => n.id === nodeId);
          if (!node) return prevConfig;

          const updatedConfig = { ...prevConfig };

          if (node.type === "knowledgeBaseNode") {
            updatedConfig.knowledge_base_node = {
              ...updatedConfig.knowledge_base_node,
              [field]: value,
            };
          } else if (node.type === "llmNode") {
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

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const updatedNodes = applyNodeChanges(changes, nds);

      changes.forEach((change) => {
        if (change.type === "remove") {
          const removedNode = nds.find((n) => n.id === change.id);
          if (removedNode) {
            const sidebarNode = initialSidebarNodes.find(
              (n) => n.id === removedNode.type
            );
            if (sidebarNode) {
              setSidebarNodes((currentSidebarNodes) => {
                if (!currentSidebarNodes.some((s) => s.id === sidebarNode.id)) {
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
  }, []);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((prevEdges) => {
        const updatedEdges = applyEdgeChanges(changes, prevEdges);
        return updatedEdges;
      });
    },
    [nodes]
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
        updateDraftConfigWithConnectedNodes(nodes, updatedEdges);
        return updatedEdges;
      });
    },
    [nodes, updateDraftConfigWithConnectedNodes]
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

      const getNodeData = (nodeType: string) => {
        switch (nodeType) {
          case "knowledgeBaseNode":
            return draftConfig?.knowledge_base_node || {};
          case "llmNode":
            return draftConfig?.llm_node || {};
          case "webSearchNode":
            return draftConfig?.web_search_node || {};
          default:
            return {};
        }
      };

      const newNode: Node = {
        id: newId,
        type,
        position,
        data: {
          label,
          onDelete: onDeleteNode,
          onDataChange: onNodeDataChange,
          ...getNodeData(type),
        },
      };

      setNodes((nds) => {
        const updatedNodes = [...nds, newNode];
        return updatedNodes;
      });
      setSidebarNodes((list) => list.filter((n) => n.id !== type));
    },
    [screenToFlowPosition, onDeleteNode, onNodeDataChange, draftConfig]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleSaveProject = useCallback(async () => {
    if (!currentProject || !projectConfig || !projectId) {
      console.error("Missing project data for save operation");
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");

    const updateData = {
      workflow: draftConfig?.workflow,
      llm_node: draftConfig?.llm_node,
      knowledge_base_node: draftConfig?.knowledge_base_node,
      web_search_node: draftConfig?.web_search_node,
    };

    try {
      await update(projectId, { project_config: updateData });
      setSaveStatus("success");
      console.log("Project saved successfully!");

      // Update the projectConfig to match saved state
      setProjectConfig(draftConfig);

      // Reset success status after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving project:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [currentProject, projectConfig, projectId, update, draftConfig]);

  return (
    <div className="h-screen w-full flex">
      <div className="w-64">
        <Sidebar
          project={currentProject}
          projectConfig={projectConfig}
          draftConfig={draftConfig}
          sidebarNodes={sidebarNodes}
          onDragStart={onDragStart}
          onSaveProject={handleSaveProject}
          isSaving={isSaving}
          saveStatus={saveStatus}
        />
      </div>
      <FlowEditor
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
      />
    </div>
  );
};

export default EditProjectView;
