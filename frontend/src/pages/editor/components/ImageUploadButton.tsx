import { useState, useRef } from 'react';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloseIcon from '@mui/icons-material/Close';
import apiClient from '@/middleware/api';

type ImageUploadModalProps = {
	id: number,
}

export default function ImageUploadModal({
	id,
}: ImageUploadModalProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
			file.type.startsWith('image/')
		);
		
		setFiles(prev => [...prev, ...droppedFiles]);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(e.target.files || []).filter(file =>
			file.type.startsWith('image/')
		);
		
		setFiles(prev => [...prev, ...selectedFiles]);
	};

	const handleUpload = async () => {
		if (files.length === 0) return;

		setUploading(true);

		try {
			const formData = new FormData();
			files.forEach((file, index) => {
				formData.append(`images`, file);
			});

			const res = await apiClient.post(`/pipe`, formData, {
				params: {
					id
				},
				responseType: 'blob',
			});

			if (res.status === 200) {
				const blob = new Blob([res.data], { type: 'application/zip' });
				
				// download link
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `processed-images-${Date.now()}.zip`; // Filename for the download
				
				// trigger download
				document.body.appendChild(link);
				link.click();
				
				// cleanup
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);				
				console.log('Download successful');
				setFiles([]);
				setIsOpen(false);
			} else {
				console.error('Upload failed');
				alert('Upload failed. Please try again.');
			}
		} catch (error) {
			console.error('Upload error:', error);
			alert('An error occurred during upload.');
		} finally {
			setUploading(false);
		}
	};

	return (
		<>
			{/* Trigger Button */}
			<button
				onClick={() => setIsOpen(true)}
				className="flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 text-green-100 border-2 border-white/20"
			>
				<FileUploadIcon className="mr-2"/>
				Test Images
			</button>

			{/* Modal */}
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
					<div className="bg-linear-to-b from-green-950 to-emerald-900 border border-white/30 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between p-6 border-b border-white/30">
							<h2 className="text-2xl font-semibold text-green-100">Upload Test Images</h2>
							<button
								onClick={() => setIsOpen(false)}
								className="text-green-100 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
							>
								<CloseIcon/>
							</button>
						</div>

						{/* Content */}
						<div className="flex-1 overflow-y-auto p-6">
							{/* Drop Zone */}
							<div
								onDragEnter={handleDragEnter}
								onDragLeave={handleDragLeave}
								onDragOver={handleDragOver}
								onDrop={handleDrop}
								className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
									isDragging
										? 'border-emerald-400 bg-emerald-400/10'
										: 'border-white/30 bg-white/5'
								}`}
							>
								<FileUploadIcon className='opacity-70 size-60' sx={{ fontSize: 60 }}/>
								<p className="text-green-100 text-lg mb-2">
									Drag and drop images here
								</p>
								<p className="text-green-100/70 text-sm mb-4">or</p>
								<button
									onClick={() => fileInputRef.current?.click()}
									className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
								>
									Browse Files
								</button>
								<input
									ref={fileInputRef}
									type="file"
									multiple
									accept="image/*"
									onChange={handleFileSelect}
									className="hidden"
								/>
							</div>

							{/* File List */}
							{files.length > 0 && (
								<div className="mt-6">
									<h3 className="text-green-100 font-semibold">
										Selected Files ({files.length})
									</h3>
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="flex items-center justify-end gap-3 p-6 border-t border-white/30">
							<button
								onClick={() => {
									setFiles([]);
									setIsOpen(false);
								}}
								className="px-6 py-2 bg-white/10 hover:bg-white/20 text-green-100 rounded-lg transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleUpload}
								disabled={files.length === 0 || uploading}
								className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors gap-2 flex items-center"
							>
								{uploading ? (
									<>
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										Uploading...
									</>
								) : (
									<>
										<FileUploadIcon/>
										Upload
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}