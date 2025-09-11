import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
export const OutputNode = ({ data }: any) => {
  return (
    <div>
      <Handle type="target" position={Position.Left} />
      <Card className="relative">
        <CardHeader className="pb-2">
          <div className="font-bold mb-2">{data.label || "Output"}</div>
        </CardHeader>
        <CardContent>
          <div className="text-xs">Output info.</div>
        </CardContent>
      </Card>
    </div>
  );
};
