import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";

import { ViewProjectView, EditProjectView } from "../components/project";

const ProjectPageInner: React.FC = () => {
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = new URLSearchParams(location.search);
  const editable = searchParams.get("editable") === "true";

  // Case 1: No projectId - Do nothing.
  if (!projectId) {
    return null;
  }

  // Case 2: ProjectId exists and editable is true - Edit project
  if (editable) {
    return <EditProjectView projectId={projectId} />;
  }

  // Case 3: ProjectId exists and editable is false - View project
  return <ViewProjectView projectId={projectId} />;
};

const ProjectPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ProjectPageInner />
    </ReactFlowProvider>
  );
};

export default ProjectPage;
