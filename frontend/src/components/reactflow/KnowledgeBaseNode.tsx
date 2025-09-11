import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { IoBookOutline } from "react-icons/io5";

export const KnowledgeBaseNode = ({ data }: any) => {
  return (
    <div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <Card className="relative">
        <CardHeader className="pb-2 flex gap-2 flex-row items-center justify-start">
          <IoBookOutline size={40} />
          <div className="font-bold mb-2">{data.label || "Knowledge Base"}</div>
        </CardHeader>
        <CardContent>
          <div className="text-xs">
            PDF Upload:{" "}
            <input
              type="file"
              accept="application/pdf"
              multiple
              disabled={!data.editable}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
