import { Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { LuFileInput } from "react-icons/lu";
import { Textarea } from "../ui/Textarea";
import { CiTrash } from "react-icons/ci";
import CustomHandle from "./CustomHandle";

export const UserQueryNode = ({ data, id }: any) => {
  return (
    <div className="p-1">
      <CustomHandle type="source" position={Position.Right} />
      <Card>
        <CardHeader className="pb-2 flex gap-2 flex-row items-center justify-start">
          <LuFileInput size={40} />
          <div className="font-bold mb-2 flex-1">
            {data.label || "User Query"}
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
          <Textarea placeholder="Type your query here..." disabled />
        </CardContent>
      </Card>{" "}
    </div>
  );
};
