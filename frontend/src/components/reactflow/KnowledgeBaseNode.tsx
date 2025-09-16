import { Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { IoBookOutline, IoClose } from "react-icons/io5";
import { FaFilePdf, FaUpload } from "react-icons/fa";
import CustomHandle from "./CustomHandle";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Button } from "../ui/Button";
import { CiTrash } from "react-icons/ci";
import { useRef } from "react";
import { Document as DocumentType } from "../../types";

interface KnowledgeBaseNodeData {
	label: string;
	onDelete?: (id: string) => void;
	onDataChange?: (
		id: string,
		field: string,
		value: string
	) => void;
	onFileUpload?: (node_id: string, file: File) => void;
	onFileRemove?: (node_id: string, file: File) => void;
	onFilesUpload?: (node_id: string, files: File[]) => void;
	onFilesToDeleteChange?: (fileId: string) => void;
	openai_api_key?: string;
	embedding_model_name?: string;
	pdf_files?: DocumentType[];
	files_to_upload?: File[];
	readOnly?: boolean;
}

export const KnowledgeBaseNode = ({
	data,
	id,
}: {
	data: KnowledgeBaseNodeData;
	id: string;
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		event.preventDefault();
		const files = Array.from(event.target.files || []);
		if (files.length > 0) {
			// Prefer batched upload to keep state consistent
			if (data.onFilesUpload) {
				data.onFilesUpload(id, files);
			} else {
				files.forEach((file) => data.onFileUpload?.(id, file));
			}
		}
		// Reset the input value to allow selecting the same files again
		if (event.target) {
			event.target.value = "";
		}
	};

	const handleFileRemove = (file: File) => {
		if (file) {
			data.onFileRemove?.(id, file);
		}
	};

	const handleDocumentRemove = (file: DocumentType) => {
		data.onFilesToDeleteChange?.(file.id);
	};

	return (
		<div className="p-1">
			<CustomHandle type="target" position={Position.Left} />
			<CustomHandle type="source" position={Position.Bottom} />
			<Card>
				<CardHeader className="pb-2 flex gap-2 flex-row items-center justify-start">
					<IoBookOutline size={40} />
					<div className="font-bold mb-2 flex-1">
						{data.label || "Knowledge Base"}
					</div>
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
				<CardContent className="flex flex-col gap-2 text-sm">
					<div className="flex items-center gap-2">
						<Label>Embedding Model:</Label>
						<Input
							value={data.embedding_model_name || ""}
							placeholder="Enter Embedding Model Name"
							className="flex-1"
							readOnly={data.readOnly}
							disabled={data.readOnly}
							onChange={(e) =>
								!data.readOnly &&
								data.onDataChange?.(
									id,
									"embedding_model_name",
									e.target.value
								)
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
								data.onDataChange?.(
									id,
									"openai_api_key",
									e.target.value
								)
							}
						/>
					</div>

					{/* PDF Upload Section */}
					{!data.readOnly && (
						<div className="flex flex-col gap-2">
							<Label>
								Upload Files({data?.files_to_upload?.length}):
							</Label>
							<div className="flex items-center gap-2">
								<input
									ref={fileInputRef}
									type="file"
									accept=".pdf"
									multiple
									onChange={handleFileChange}
									className="hidden"
								/>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleUploadClick}
									className="flex items-center gap-2"
								>
									<FaUpload size={14} />
									Upload PDFs
								</Button>
							</div>
						</div>
					)}
					{data.files_to_upload &&
						data.files_to_upload.length > 0 && (
							<div className="flex flex-col gap-2">
								{data.files_to_upload.map((file, index) => (
									<div
										key={index}
										className="flex items-center justify-between gap-3 cursor-default"
									>
										<div
											key={index}
											className="inline-flex text-sm items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-md w-full"
										>
											<FaFilePdf className="text-red-500" />
											<span className="truncate w-full">
												{file.name}
											</span>
											<IoClose
												className="text-red-500"
												size={16}
												onClick={() => handleFileRemove(file)}
											/>
										</div>
									</div>
								))}
							</div>
						)}

					{/* Display Uploaded Files */}
					{data.pdf_files && data.pdf_files.length > 0 && (
						<div className="flex flex-col gap-2">
							<Label className="text-sm font-medium">
								{data.readOnly
									? "Files:"
									: "Select Files to Delete:"}
							</Label>

							{data.pdf_files.map((file, index) => (
								<div
									key={index}
									className="flex items-center gap-3 cursor-pointer"
									onClick={() => handleDocumentRemove(file)}
								>
									<input
										hidden={data.readOnly}
										type="checkbox"
										className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded"
										onChange={() => handleDocumentRemove(file)}
										onClick={(e) => e.stopPropagation()}
									/>
									<div className="inline-flex text-sm items-center gap-2 px-2 py-1 bg-muted text-muted-foreground rounded-md flex-1">
										<FaFilePdf className="text-red-500" />
										<span className="truncate flex-1">
											{file.title}
										</span>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Show message when no files uploaded */}
					{(!data.pdf_files || data.pdf_files.length === 0) && (
						<div className="text-xs text-gray-500 italic p-2 rounded text-wrap">
							No PDF files uploaded yet.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
