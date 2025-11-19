import { Node } from "@xyflow/react";

export interface CvNode<T extends CvNodeType = CvNodeType> extends Node {
	data: {
		name: string;
		cvNodeType: CvNodeType;
		params: CvNodeParamsMap[T];
	}
}

export interface CvNodeConfig<T extends CvNodeType = CvNodeType> {
	cvNodeType: CvNodeType,
	displayName: string,
	inputs: number,
	outputs: number,
	params: CvNodeParamsMap[T],
}

// ===============================================================================================

export enum CvNodeType {
	Source,
	Output,
	Blur,
	DeepFry,
}
export const CV_NODE_CONFIGS: {
  	[K in CvNodeType]: CvNodeConfig<K>
} = {
	[CvNodeType.Source]: {
		cvNodeType: CvNodeType.Source,
		displayName: "Source",
		inputs: 0,
		outputs: 1,
		params: {},
	},
	[CvNodeType.Output]: {
		cvNodeType: CvNodeType.Output,
		displayName: "Output",
		inputs: 1,
		outputs: 0,
		params: {},
	},
	[CvNodeType.Blur]: {
		cvNodeType: CvNodeType.Blur,
		displayName: "Blur",
		inputs: 1,
		outputs: 1,
		params: {
			size: 5
		},
	},
	[CvNodeType.DeepFry]: {
		cvNodeType: CvNodeType.DeepFry,
		displayName: "Deep Fry",
		inputs: 1,
		outputs: 1,
		params: {},
	},
}

export type CvNodeParamsMap = {
	[CvNodeType.Source]: {};
	[CvNodeType.Output]: {};
	[CvNodeType.Blur]: {
		size: number
	};
	[CvNodeType.DeepFry]: {};
};