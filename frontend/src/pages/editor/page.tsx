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

	// Debounced auto-save
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		if (!isLoaded) return;
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		saveTimeoutRef.current = setTimeout(() => {
			saveProject();
		}, 2000);

		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [nodes, edges, title, isLoaded, saveProject]);

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
				<div className="border-b border-white/30 p-2 flex items-center justify-between">	
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

				{/* Custom Menu Dropdown */}
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
				<div className="border-b border-white/30 p-2">		
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full bg-transparent p-2 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-white/5 transition-colors"
						placeholder="Untitled Project"
					/>
				</div>
				
				{/* Nodes List */}
				<div className="border-b border-white/30 p-2 flex flex-col flex-1 min-h-0">
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