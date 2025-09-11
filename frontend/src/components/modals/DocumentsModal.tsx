import React from "react";
import { Modal } from "../ui/Modal";
import { CardHeader, CardContent } from "../ui/Card";

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: { name: string; documents?: any[] };
}

export const DocumentsModal: React.FC<DocumentsModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} width="w-96">
      <CardHeader className="text-xl font-semibold text-slate-100">
        Documents for {project.name}
      </CardHeader>
      <CardContent>
        {project.documents && project.documents.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {project.documents.map((doc, idx) => (
              <a
                key={idx}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-red-500"
                >
                  <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828A2 2 0 0 0 19.414 7.414l-5.828-5.828A2 2 0 0 0 12.172 1H6zm6 1.414L18.586 8H14a2 2 0 0 1-2-2V3.414zM6 4h6v4a4 4 0 0 0 4 4h4v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4zm2 10a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2z" />
                </svg>
                <span className="truncate w-60">{doc.title || doc.name}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No documents available.</p>
        )}
      </CardContent>
    </Modal>
  );
};
