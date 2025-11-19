import { create } from 'zustand';
import { Edge, addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

import { CvNode, CvNodeType } from '@/types/CvNode';
import { EditorState } from '@/types/EditorState';

export const defaultNode: CvNode = {
	id: "1",
	position: { x: 0, y: 0 },
	type: 'cvNode',
	data: {
		name: "Source Node",
		cvNodeType: CvNodeType.Source,
		params: {}
	},
}

const starterNodes: CvNode[] = [defaultNode];
const starterEdges: Edge[] = [];

export const useEditorStore = create<EditorState>((set, get) => ({
	nodes: starterNodes,
	edges: starterEdges,
	selectedNode: null,
	setNodes: (nodes) => {
		set({ nodes });
	},
	setSelectedNode: (node) => {
		set((state) => ({
			selectedNode: node,
			nodes: state.nodes.map(n => ({
				...n,
				selected: n.id === node?.id
			}))
		}));
	},
	setEdges: (edges) => {
		set({ edges });
	},

	// Events

	onNodesChange: (changes) => {
		set({
			nodes: applyNodeChanges(changes, get().nodes),
		});
	},
	onEdgesChange: (changes) => {
		set({
			edges: applyEdgeChanges(changes, get().edges),
		});
	},
	onConnect: (connection) => {
		set({
			edges: addEdge(connection, get().edges),
		});
	},
}));

export default useEditorStore;
