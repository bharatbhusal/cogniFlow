import { Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { CiGlobe } from "react-icons/ci";
import { CiTrash } from "react-icons/ci";
import CustomHandle from "./CustomHandle";

export const WebSearchNode = ({ data, id }: any) => {
  return (
    <div className="p-1">
      <CustomHandle type="target" position={Position.Left} />
      <CustomHandle type="source" position={Position.Right} />
      <Card>
        <CardHeader className="pb-2 flex gap-2 flex-row items-center justify-start">
          <CiGlobe size={40} />
          <div className="font-bold mb-2 flex-1">
            {data.label || "Web Search"}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => data.onDelete?.(id)}
            className="ml-auto px-2 py-0 text-lg"
          >
            <CiTrash />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-xs">Web search info.</div>
        </CardContent>
      </Card>
    </div>
  );
};
