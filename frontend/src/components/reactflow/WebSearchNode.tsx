import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { CiGlobe } from "react-icons/ci";
export const WebSearchNode = ({ data }: any) => {
  return (
    <div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <Card className="relative">
        <CardHeader className="pb-2 flex gap-2 flex-row items-center justify-start">
          <CiGlobe size={40} />
          <div className="font-bold mb-2">{data.label || "Web Search"}</div>
        </CardHeader>
        <CardContent>
          <div className="text-xs">Web search info.</div>
        </CardContent>
      </Card>
    </div>
  );
};
