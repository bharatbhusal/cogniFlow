import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";

interface UpdateProjectModalProps {
	isOpen: boolean;
	onClose: () => void;
	project: {
		name: string;
		description: string;
		pdf_files?: File[];
	};
	onUpdate: (data: {
		name?: string;
		description?: string;
		pdf_files: File[];
	}) => void;
}

export const UpdateProjectModal: React.FC<
	UpdateProjectModalProps
> = ({ isOpen, onClose, project, onUpdate }) => {
	const [name, setName] = useState(project.name);
	const [description, setDescription] = useState(
		project.description
	);
	const [files, setFiles] = useState<File[]>(
		project.pdf_files || []
	);
	const [newFiles, setNewFiles] = useState<File[]>([]);

	const handleFileChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		if (!e.target.files) return;
		const selectedFiles = Array.from(e.target.files).filter(
			(f) => f.type === "application/pdf"
		);
		setNewFiles([...newFiles, ...selectedFiles]);
	};

	const handleRemoveFile = (
		index: number,
		isNew: boolean = false
	) => {
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
		});
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Update Project"
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2"></div>
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
					<Label htmlFor="update-description">
						Project Description
					</Label>
					<Input
						id="update-description"
						name="update-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="update-files">
						Add More PDF Files
					</Label>
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
								className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded"
							>
								<span className="text-xs">{file.name}</span>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={() =>
										handleRemoveFile(idx, idx >= files.length)
									}
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				</div>
				<div className="flex gap-2">
					<Button type="submit">Update Project</Button>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
					>
						Cancel
					</Button>
				</div>
			</form>
		</Modal>
	);
};
