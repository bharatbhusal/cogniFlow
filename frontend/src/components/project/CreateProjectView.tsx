import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../hooks/useProjects";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Card, CardContent } from "../ui/Card";

const CreateProjectView: React.FC = () => {
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

  const handleCreateProject = useCallback(async () => {
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
        navigate(`/projects/${(result.payload as any).id}?editable=true`);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    }
  }, [projectData, create, navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Create New Project
          </h1>

          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                type="text"
                value={projectData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter project name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={projectData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter project description (optional)"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={loading || !projectData.name.trim()}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProjectView;
