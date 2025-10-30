import {
	type Edge,
	type Node,
	type OnNodesChange,
	type OnEdgesChange,
	type OnConnect,
} from '@xyflow/react';
import { CvNode } from './CvNode';
 

export type EditorState = {
	nodes: CvNode[];
	edges: Edge[];
	onNodesChange: OnNodesChange<CvNode>;
	onEdgesChange: OnEdgesChange;
	onConnect: OnConnect;
	setNodes: (nodes: CvNode[]) => void;
	setEdges: (edges: Edge[]) => void;
	selectedNode: CvNode | null;
	setSelectedNode: (node: CvNode | null) => void;
};