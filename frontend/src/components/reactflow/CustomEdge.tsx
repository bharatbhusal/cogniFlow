import React from "react";
import {
  BezierEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from "reactflow";
import { Button } from "../ui/Button";

export default function CustomEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  } = props;

  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BezierEdge {...props} />
      <EdgeLabelRenderer>
        <Button
          aria-label="Delete Edge"
          style={{
            position: "absolute",
            left: `${labelX}px`,
            top: `${labelY}px`,
            transform: "translate(-50%, -50%)",
            background: "transparent",
            pointerEvents: "all",
            color: "#ef4444",
          }}
          onClick={() =>
            setEdges((prevEdges) => prevEdges.filter((edge) => edge.id !== id))
          }
        >
          &times;
        </Button>
      </EdgeLabelRenderer>
    </>
  );
}
