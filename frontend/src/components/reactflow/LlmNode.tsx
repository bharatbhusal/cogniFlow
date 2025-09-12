import { Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { WiStars } from "react-icons/wi";
import CustomHandle from "./CustomHandle";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Button } from "../ui/Button";
import { CiTrash } from "react-icons/ci";

interface LlmNodeData {
  label: string;
  onDelete?: (id: string) => void;
  onDataChange?: (id: string, field: string, value: string) => void;
  llm_model_name?: string;
  model_name?: string; // Alternative field name for compatibility
  openai_api_key?: string;
  readOnly?: boolean;
}

export const LlmNode = ({ data, id }: { data: LlmNodeData; id: string }) => {
  return (
    <div className="p-1">
      <CustomHandle type="target" position={Position.Left} />
      <CustomHandle type="source" position={Position.Right} />
      <Card>
        <CardHeader className="pb-2 flex gap-2 flex-row items-center justify-start">
          <WiStars size={40} />
          <div className="font-bold mb-2 flex-1">{data.label || "LLM"}</div>
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
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Label>Model:</Label>
              <Input
                disabled={data.readOnly}
                value={data.llm_model_name || data.model_name || ""}
                placeholder="Enter LLM Model Name"
                className="flex-1"
                readOnly={data.readOnly}
                onChange={(e) =>
                  !data.readOnly &&
                  data.onDataChange?.(id, "llm_model_name", e.target.value)
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>OpenAI API Key:</Label>
              <Input
                disabled={data.readOnly}
                value={
                  data.readOnly && data.openai_api_key
                    ? "**********"
                    : data.openai_api_key || ""
                }
                type={!data.readOnly ? "text" : "password"}
                placeholder="Enter OpenAI API Key"
                className="flex-1"
                readOnly={data.readOnly}
                onChange={(e) =>
                  !data.readOnly &&
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
