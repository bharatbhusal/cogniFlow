import { Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { WiStars } from "react-icons/wi";
import CustomHandle from "./CustomHandle";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Button } from "../ui/Button";
import { CiTrash } from "react-icons/ci";

export const LlmNode = ({ data, id }: any) => {
  return (
    <div className="p-1">
      <CustomHandle type="target" position={Position.Left} />
      <CustomHandle type="source" position={Position.Right} />
      <Card>
        <CardHeader className="pb-2 flex gap-2 flex-row items-center justify-start">
          <WiStars size={40} />
          <div className="font-bold mb-2 flex-1">{data.label || "LLM"}</div>
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
              <Label>Model:</Label>
              <Input
                value={data.llm_model_name || data.model_name || ""}
                placeholder="Enter LLM Model Name"
                className="flex-1"
                onChange={(e) =>
                  data.onDataChange?.(id, "llm_model_name", e.target.value)
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>OpenAI API Key:</Label>
              <Input
                value={data.openai_api_key || ""}
                type="password"
                placeholder="Enter OpenAI API Key"
                className="flex-1"
                onChange={(e) =>
                  data.onDataChange?.(id, "openai_api_key", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
