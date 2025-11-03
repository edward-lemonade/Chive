import { Edge } from "@xyflow/react"
import { CvNode } from "./CvNode"

export interface ChiveProject {
	id: number,
	title: string,
	creatorId?: number,
	creatorUsername?: string,
	data: {
		nodes: CvNode[],
		edges: Edge[],
	},
	createdAt: string,
	updatedAt: string,
}

export interface ChiveProjectInfo {
	id: number,
	title: string,
	creatorId?: number,
	creatorUsername?: string,
	createdAt: string,
	updatedAt: string,
}