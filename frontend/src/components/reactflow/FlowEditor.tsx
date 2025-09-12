import React, { useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Background,
  Controls,
} from "reactflow";
import { UserQueryNode } from "./UserQueryNode";
import { KnowledgeBaseNode } from "./KnowledgeBaseNode";
import { WebSearchNode } from "./WebSearchNode";
import { OutputNode } from "./OutputNode";
import { LlmNode } from "./LlmNode";
import CustomEdge from "./CustomEdge";

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

interface FlowEditorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
}

const FlowEditor: React.FC<FlowEditorProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDrop,
  onDragOver,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  return (
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
  );
};

export default FlowEditor;
