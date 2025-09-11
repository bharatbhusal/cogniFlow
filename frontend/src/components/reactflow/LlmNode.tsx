import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";

export const LlmNode = ({ data }: any) => {
  return (
    <div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <Card className="relative">
        <CardHeader className="pb-2">
          <div className="font-bold mb-2">{data.label || "LLM"}</div>
        </CardHeader>
        <CardContent>
          <div className="text-xs ">LLM node info.</div>
        </CardContent>
      </Card>
    </div>
  );
};
