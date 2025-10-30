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