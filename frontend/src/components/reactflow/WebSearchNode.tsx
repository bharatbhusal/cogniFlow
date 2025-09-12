import { Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { CiGlobe, CiTrash } from "react-icons/ci";
import CustomHandle from "./CustomHandle";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Button } from "../ui/Button";

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
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Label>SerpAPI API Key:</Label>
              <Input
                value={data.serpapi_api_key || ""}
                type="password"
                placeholder="Enter SerpAPI API Key"
                className="flex-1"
                onChange={(e) =>
                  data.onDataChange?.(id, "serpapi_api_key", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
