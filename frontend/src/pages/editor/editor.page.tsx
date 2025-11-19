import { useCallback, useState, useRef, useEffect } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, Edge, useOnSelectionChange, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import { ChiveProject } from "@/types/ChiveProject";
import { v4 } from "uuid";
import apiClient from "@/middleware/api";
import { useNavigate, useParams } from "react-router-dom";
import useEditorStore, { defaultNode } from './store';
import Brand from "@/components/Brand";
import { CvNode, CvNodeType } from "@/types/CvNode";
import ChiveNode from "./components/ChiveNode";
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloseIcon from '@mui/icons-material/Close';

const nodeTypes = { cvNode: ChiveNode };


function EditorContent() {
	const [title, setTitle] = useState<string>("Untitled Project");
	const params = useParams(); 
	const id = Number(params.id)
	const [isLoaded, setIsLoaded] = useState(false);

	const navigate = useNavigate();
	const { screenToFlowPosition } = useReactFlow();
	const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges, selectedNode, setSelectedNode } = useEditorStore();

	const [menuOpen, setMenuOpen] = useState(false);
	const menuAnchorRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	const [project, setProject] = useState<ChiveProject|null>(null);

	// Initial page load
	useEffect(() => {
		const fetchProjectData = async () => {
			const res = await apiClient.get(`/project/load?id=${id}`);
			if (res.status != 200) {
				console.error("Error fetching project data");
				setIsLoaded(true); // Still set loaded even on error to show the UI
				return
			}

			const p = res.data;
			
			setProject(p);
			setNodes(p.data.nodes);
			setEdges(p.data.edges);
			setTitle(p.title);
			setIsLoaded(true);
		}

		if (id) {
			fetchProjectData();
		} else {
			setIsLoaded(true);
		}
	}, [id])

	const addNewNode = (cvNodeType: CvNodeType = CvNodeType.Source) => {
		const viewportCenter = {
			x: window.innerWidth / 2,
			y: window.innerHeight / 2,
		};
		const position = screenToFlowPosition(viewportCenter);
		
		const id = v4();
		const newNode: CvNode = {
			...defaultNode,
			id,
			position,
			data: {
				...defaultNode.data,
				name: "New Node",
			}
		};

		setNodes(nodes.concat(newNode));
	};

	const handleSelectionChange = useCallback((params: { nodes: CvNode[], edges: Edge[] }) => {
		setSelectedNode(params.nodes.length ? params.nodes[0] : null);
	}, [setSelectedNode]);
	useOnSelectionChange({onChange: handleSelectionChange});

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				event.target instanceof Node &&
				menuAnchorRef.current &&
				!menuAnchorRef.current.contains(event.target) &&
				menuRef.current &&
				!menuRef.current.contains(event.target)
			) {
				setMenuOpen(false);
			}
		};

		if (menuOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [menuOpen]);


	const jsonProject = useCallback((): ChiveProject => {
		if (!project) {
			let newProject = {
				id: 0,
				title,
				data: {
					nodes,
					edges,
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
			return {...newProject, updatedAt: new Date().toISOString()};
		} else {
			return {...project, title, data: { nodes, edges }, updatedAt: new Date().toISOString()};
		}
	}, [project, title, nodes, edges]);

	const saveProject = useCallback(async () => {
		const json = jsonProject();
		const res = await apiClient.post('/project/save', json);
		if (res.status === 200) {
			console.log("Project saved successfully");

			if (res.data.project && res.data.project.id) {
				const savedProject = res.data.project;
				setProject(prev => {
					if (!prev || prev.id === 0) {
						return {
							...json,
							id: savedProject.id,
							createdAt: savedProject.createdAt,
							updatedAt: savedProject.updatedAt,
						};
					} else {
						return {
							...prev,
							title: savedProject.title,
							updatedAt: savedProject.updatedAt,
						};
					}
				});
			}
		} else {
			console.error("Failed to save project");
		}
	}, [jsonProject]);


	const handleSave = async () => {
		await saveProject();
		setMenuOpen(false);
	}

	const handleSaveAndExit = async () => {
		await saveProject();
		navigate("/projects");
	}

	const handleExit = () => {
		navigate("/projects");
	}

	const ImageUploadModal = useCallback(() => {
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
				files.forEach((file) => {
					formData.append(`images`, file);
				});
				formData.append(`data`, JSON.stringify({
					nodes: nodes,
					edges: edges,
				}))

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
	}, [])

	return (
		<div className="h-screen w-screen flex bg-transparent overflow-hidden relative">
			{/* Loading overlay */}
			{!isLoaded && (
				<div className="absolute inset-0 z-9999 bg-black/50 backdrop-blur-sm flex items-center justify-center">
					<div className="flex flex-col items-center gap-4">
						{/* Spinner */}
						<div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
						{/* Loading text */}
						<p className="text-white text-lg font-medium">Loading project...</p>
					</div>
				</div>
			)}

			{/* Left permanent sidebar */}
			<aside className="w-64 bg-black/20 border-r border-white flex flex-col bg-linear-to-b from-green-950 to-emerald-900">
				<div className="border-b border-white/30 px-2 py-4 flex items-center justify-between">	
					<Brand sizeClass="text-2xl" />
					<button
						ref={menuAnchorRef}
						onClick={() => setMenuOpen(!menuOpen)}
						className="text-green-100 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
						aria-label="Menu"
					>
						<MenuIcon fontSize="small" />
					</button>
				</div>

				{/* Menu Dropdown */}
				{menuOpen && (
					<div ref={menuRef} className="absolute left-2 top-16 z-50 bg-linear-to-b from-emerald-900 to-green-950 border border-white/30 rounded-md shadow-xl w-56">
						<button
							onClick={handleSave}
							className="w-full text-left px-4 py-3 text-green-100 hover:bg-white/10 hover:text-white transition-colors border-b border-white/10"
						>
							Save
						</button>
						<button
							onClick={handleSaveAndExit}
							className="w-full text-left px-4 py-3 text-green-100 hover:bg-white/10 hover:text-white transition-colors border-b border-white/10"
						>
							Save and Exit
						</button>
						<button
							onClick={handleExit}
							className="w-full text-left px-4 py-3 text-green-100 hover:bg-white/10 hover:text-white transition-colors"
						>
							Exit
						</button>
					</div>
				)}

				{/* Title */}			
				<div className="border-b border-white/30 px-2 py-4">		
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full bg-transparent p-2 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-white/5 transition-colors"
						placeholder="Untitled Project"
					/>
				</div>
				
				{/* Nodes List */}
				<div className="border-b border-white/30 px-2 py-4 flex flex-col flex-1 min-h-0">
					<h3 className="text-green-100 font-semibold mb-4">Nodes</h3>
					<div className="flex flex-col p-2 bg-black/20 gap-2 overflow-y-auto min-h-0 flex-1 scrollbar-thin scrollbar-track-black/20 scrollbar-thumb-white/20">
						{nodes.map((node) => (
							<button 
								key={node.id} 
								onClick={() => setSelectedNode(node)}
								className={`text-left px-3 py-0 bg-white/5 hover:bg-white/10 ${
									node.selected ? 'text-green-100 ring-1 ring-blue-500' : 'text-green-100/50'
								}`}
							>
								{node.data.name}
							</button>
						))}
					</div>

					<button
						onClick={() => addNewNode()}
						className="flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 text-green-100 border-2 border-white/20 mt-4"
					>
						<AddIcon className="mr-2" />
						Add Node
					</button>
				</div>

				{/* Image Upload -> Pipeline Button */}
				<div className="border-b border-white/30 px-2 py-4 flex flex-col flex-1 min-h-0">
					<ImageUploadModal/>
				</div>
			</aside>

			{/* Center: React Flow canvas */}
			<div className="flex-1 relative overflow-hidden">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes as any}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					colorMode="dark"
					fitView
					defaultViewport={{x: 0, y: 0, zoom: 0.1}}
					defaultEdgeOptions={{}}
				>
					<Background bgColor='#001814' color='rgba(255,255,255,0.5)' gap={24} />
					<Controls />
				</ReactFlow>

				{/* Right sidebar that appears when node is selected */}
				<aside
					className={`absolute top-0 right-0 h-full w-64 bg-linear-to-b from-green-950 to-emerald-900 border-l border-white/30 p-4 transition-transform duration-300 ${
						selectedNode != null ? "translate-x-0" : "translate-x-full"
					}`}
				>
					{selectedNode && (
						<div className="flex flex-col gap-4">
							<div className="flex items-center justify-between">
								<h3 className="text-green-100 font-semibold text-lg">Node Properties</h3>
								<button
									onClick={() => setSelectedNode(null)}
									className="text-green-100 hover:text-white px-2 py-1 rounded-md hover:bg-white/10"
								>
									✕
								</button>
							</div>
						</div>
					)}
				</aside>
			</div>
		</div>
	);
}

export default function EditorPage() {
	return (
		<ReactFlowProvider>
			<EditorContent />
		</ReactFlowProvider>
	);
}