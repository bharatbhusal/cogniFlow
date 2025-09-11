import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
export const UserQueryNode = ({ data }: any) => {
  return (
    <div>
      <Handle type="source" position={Position.Right} />
      <Card className="relative">
        <CardHeader className="pb-2">
          <div className="font-bold mb-2">{data.label || "User Query"}</div>
        </CardHeader>
        <CardContent>
          <div className="text-xs ">User's query goes here.</div>
        </CardContent>
      </Card>{" "}
    </div>
  );
};
