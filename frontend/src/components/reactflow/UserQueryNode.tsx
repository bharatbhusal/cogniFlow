import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { LuFileInput } from "react-icons/lu";
export const UserQueryNode = ({ data }: any) => {
  return (
    <div>
      <Handle type="source" position={Position.Right} />
      <Card className="relative">
        <CardHeader className="pb-2 flex gap-2 flex-row items-center justify-start">
          <LuFileInput size={40} />
          <div className="font-bold mb-2">{data.label || "User Query"}</div>
        </CardHeader>
        <CardContent>
          <div className="text-xs ">User's query goes here.</div>
        </CardContent>
      </Card>{" "}
    </div>
  );
};
