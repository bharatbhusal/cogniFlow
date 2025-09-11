import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { WiStars } from "react-icons/wi";

export const LlmNode = ({ data }: any) => {
  return (
    <div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <Card className="relative">
        <CardHeader className="pb-2 flex gap-2 flex-row items-center justify-start">
          <WiStars size={40} />
          <div className="font-bold mb-2">{data.label || "LLM"}</div>
        </CardHeader>
        <CardContent>
          <div className="text-xs ">LLM node info.</div>
        </CardContent>
      </Card>
    </div>
  );
};
