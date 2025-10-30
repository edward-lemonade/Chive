import { Edge } from "@xyflow/react"
import { CvNode } from "./CvNode"

export interface ChiveProject {
	id: string,
	title: string,
	data: {
		nodes: CvNode[],
		edges: Edge[],
	},
	createdAt: string,
	updatedAt: string,
}