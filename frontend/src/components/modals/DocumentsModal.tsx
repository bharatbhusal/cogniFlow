import React from "react";
import { Modal } from "../ui/Modal";

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
    <Modal isOpen={isOpen} onClose={onClose} title="Project Documents">
      <div>
        <p className="mb-2">
          Documents for <span className="font-semibold">{project.name}</span>:
        </p>
        {project.documents && project.documents.length > 0 ? (
          <ul className="list-disc pl-4">
            {project.documents.map((doc, idx) => (
              <li key={idx}>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer"
                >
                  {doc.title || doc.name}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No documents available.</p>
        )}
      </div>
    </Modal>
  );
};
