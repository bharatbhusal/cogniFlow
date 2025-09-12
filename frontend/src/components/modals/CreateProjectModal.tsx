import React, { useCallback, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { CardHeader } from "../ui/Card";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../redux";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { create, loading } = useProjects();

  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
  });

  const handleInputChange = useCallback((field: string, value: string) => {
    setProjectData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleCreateProject = useCallback(
    async (e: any) => {
      e.preventDefault();
      if (!projectData.name.trim()) {
        alert("Project name is required");
        return;
      }

      try {
        const result = await create(projectData);
        if (
          result.payload &&
          typeof result.payload === "object" &&
          result.payload !== null &&
          "id" in result.payload
        ) {
          navigate(`/projects/${result.payload.id}?editable=true`);
        }
      } catch (error) {
        console.error("Error creating project:", error);
        alert("Failed to create project");
      }
    },
    [projectData, create, navigate]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CardHeader>Create New Project</CardHeader>
      <form onSubmit={handleCreateProject} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            name="name"
            required
            value={projectData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter project name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={projectData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Enter project description (optional)"
            rows={3}
          />
        </div>
        {/* <div className="space-y-2">
          <Label htmlFor="files">PDF Files (max 5)</Label>
          <Input
            id="files"
            name="files"
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
            disabled={files.length >= 5}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-slate-800 rounded-md p-2"
              >
                <span className="text-xs">{idx + 1}. </span>
                <span className="text-xs w-60 truncate">{file.name}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveFile(idx)}
                >
                  &times;
                </Button>
              </div>
            ))}
          </div>
        </div> */}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};
