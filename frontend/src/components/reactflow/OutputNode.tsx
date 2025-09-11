import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { LuFileOutput } from "react-icons/lu";
import { Textarea } from "../ui/Textarea";
import { CiTrash } from "react-icons/ci";

export const OutputNode = ({ data, id }: any) => {
  return (
    <div>
      <Handle type="target" position={Position.Left} />
      <Card className="relative">
        <CardHeader className="pb-2 flex gap-2 flex-row items-center justify-start">
          <LuFileOutput size={40} />
          <div className="font-bold mb-2 flex-1">{data.label || "Output"}</div>
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
          <Textarea placeholder="Output will be displayed here..." disabled />
        </CardContent>
      </Card>
    </div>
  );
};
