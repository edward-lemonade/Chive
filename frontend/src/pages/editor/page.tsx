import { useCallback, useState } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, Node, Edge, useOnSelectionChange, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import AddIcon from '@mui/icons-material/Add';import { ChiveProject } from "@/types/ChiveProject";
import { v4 } from "uuid";
import axios from "axios";
import useEditorStore, { defaultNode } from './store';
import Brand from "@/components/Brand";
import { CvNode, CvNodeType } from "@/types/CvNode";
import ChiveNode from "./components/ChiveNode";

const nodeTypes = { cvNode: ChiveNode };

function EditorContent() {
	const [title, setTitle] = useState<string>("Untitled Project");
	const { 
		nodes, edges, 
		onNodesChange, onEdgesChange, onConnect, 
		setNodes, setEdges, 
		selectedNode, setSelectedNode
	} = useEditorStore();
	const { screenToFlowPosition } = useReactFlow();

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


	// Load / Export

	let project: ChiveProject | null = null;
	const loadProject = (projectData: ChiveProject) => {
		setTitle(projectData.title);
		setNodes(projectData.data.nodes);
		setEdges(projectData.data.edges);	
		project = projectData;
	}
	const exportProject = (): ChiveProject => {
		if (!project) {
			project = {
				id: v4(),
				title,
				data: {
					nodes,
					edges,
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
		}
		return {...project, updatedAt: new Date().toISOString()};
	};
	const saveProject = async () => {
		const json = exportProject();
		const res = await axios.post(`${process.env.API_URL}/api/projects/save`, json);
		if (res.status === 200) {
			console.log("Project saved successfully");
		} else {
			console.error("Failed to save project");
		}
	}

	return (
		<div className="h-screen w-screen flex bg-transparent overflow-hidden relative">
			{/* Left permanent sidebar */}
			<aside className="w-64 bg-black/20 border-r border-white flex flex-col bg-linear-to-b from-green-950 to-emerald-900">
				<div className="border-b border-white/30 p-2">	
					<Brand sizeClass="text-2xl" />
				</div>

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
				<div className="border-b border-white/30 p-2 flex flex-col p-3 flex-1 min-h-0">
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