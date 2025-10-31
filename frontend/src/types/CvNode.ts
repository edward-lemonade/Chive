import { Node } from "@xyflow/react";

export interface CvNode extends Node {
	data: {
		name: string;
		cvNodeType: CvNodeType;
	}
}

export enum CvNodeType {
	Source,
	Display,	
}

export interface CvNodeConfig {
	inputs: number,
	outputs: number,
	props?: Record<string, string>,
}

export const CV_NODE_CONFIGS: Record<CvNodeType, CvNodeConfig> = {
	[CvNodeType.Source]: {
		inputs: 0,
		outputs: 1,
	},
	[CvNodeType.Display]: {
		inputs: 1,
		outputs: 0,
	}
}