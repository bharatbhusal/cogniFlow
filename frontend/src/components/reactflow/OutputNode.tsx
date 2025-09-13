import { Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { LuFileOutput } from "react-icons/lu";
import { Textarea } from "../ui/Textarea";
import CustomHandle from "./CustomHandle";
import { CiTrash } from "react-icons/ci";
import { Button } from "../ui/Button";

interface OutputNodeData {
  label: string;
  onDelete?: (id: string) => void;
  onDataChange?: (id: string, field: string, value: string) => void;
  readOnly?: boolean;
}

export const OutputNode = ({
  data,
  id,
}: {
  data: OutputNodeData;
  id: string;
}) => {
  return (
    <div className="p-1">
      <CustomHandle type="target" position={Position.Top} />
      <Card>
        <CardHeader className="pb-2 flex gap-2 flex-row items-center justify-start">
          <LuFileOutput size={40} />
          <div className="font-bold mb-2 flex-1">{data.label || "Output"}</div>
          {!data.readOnly && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => data.onDelete?.(id)}
              className="ml-auto px-2 py-0 text-lg"
            >
              <CiTrash />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Output will be displayed here..." disabled />
        </CardContent>
      </Card>
    </div>
  );
};
