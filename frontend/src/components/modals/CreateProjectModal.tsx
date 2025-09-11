import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { CardHeader } from "../ui/Card";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description: string;
    pdf_files: File[];
  }) => void;
  loading?: boolean;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  loading,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files).filter(
      (f) => f.type === "application/pdf"
    );
    if (selectedFiles.length + files.length > 5) {
      alert("You can only add up to 5 PDF files.");
      return;
    }
    setFiles([...files, ...selectedFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name, description, pdf_files: files });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CardHeader>Create New Project</CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter project description (optional)"
            rows={3}
          />
        </div>
        <div className="space-y-2">
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
        </div>
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
