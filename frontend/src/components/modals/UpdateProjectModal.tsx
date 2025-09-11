import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { CardHeader, CardContent, CardFooter } from "../ui/Card";
import { Project } from "../../types";

interface UpdateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project & { pdf_files?: File[] };
  onUpdate: (data: {
    name?: string;
    description?: string;
    pdf_files?: File[];
    delete_documents?: string[];
  }) => void;
}

export const UpdateProjectModal: React.FC<UpdateProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdate,
}) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [files, setFiles] = useState<File[]>(project.pdf_files || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files).filter(
      (f) => f.type === "application/pdf"
    );
    setNewFiles([...newFiles, ...selectedFiles]);
  };

  const handleRemoveFile = (index: number, isNew: boolean = false) => {
    if (isNew) {
      setNewFiles(newFiles.filter((_, i) => i !== index));
    } else {
      setFiles(files.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      name,
      description,
      pdf_files: [...files, ...newFiles],
      delete_documents: deleteIds,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-2">
        <CardHeader>Update Project</CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="update-name">Project Name</Label>
            <Input
              id="update-name"
              name="update-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="update-description">Project Description</Label>
            <Input
              id="update-description"
              name="update-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="update-files">Add More PDF Files</Label>
            <Input
              id="update-files"
              name="update-files"
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
              className="hover:cursor-pointer"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {[...files, ...newFiles].map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-800 rounded-md p-2"
                >
                  <span className="text-xs">{idx + 1}. </span>
                  <span className="text-xs w-60 truncate text-gray-200">
                    {file.name}
                  </span>
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
          </div>
          {/* Document Deletion Section */}
          {project.documents && project.documents.length > 0 && (
            <div className="space-y-2">
              <Label>Delete Existing Documents</Label>
              <div className="flex flex-col gap-2">
                {project.documents.map((doc) => (
                  <label key={doc.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={deleteIds.includes(doc.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDeleteIds([...deleteIds, doc.id]);
                        } else {
                          setDeleteIds(deleteIds.filter((id) => id !== doc.id));
                        }
                      }}
                    />
                    <span className="text-xs">{doc.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button type="submit">Update Project</Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </CardFooter>
      </form>
    </Modal>
  );
};
