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
	paramSpecs: {[K in keyof CvNodeParamsMap[T]]: ParamSpec<CvNodeParamsMap[T][K]>}
}

// ===============================================================================================

export enum ParamControlStyle {
	IntBox,
	NumBox,
	IntSlider,
	NumSlider,
	Toggle,
}
export interface ParamSpec<T> {
	displayName: string,
	description: string,
	controlStyle: ParamControlStyle,
	default: T,

	min?: number,
	max?: number,
	options?: T[],
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
		paramSpecs: {},
	},
	[CvNodeType.Output]: {
		cvNodeType: CvNodeType.Output,
		displayName: "Output",
		inputs: 1,
		outputs: 0,
		paramSpecs: {},
	},
	[CvNodeType.Blur]: {
		cvNodeType: CvNodeType.Blur,
		displayName: "Blur",
		inputs: 1,
		outputs: 1,
		paramSpecs: {
			size: {
				displayName: "Kernel size",
				description: "The higher the value, the stronger the blur",
				controlStyle: ParamControlStyle.IntBox,

				default: 5,
				min: 1,
			}
		},
	},
	[CvNodeType.DeepFry]: {
		cvNodeType: CvNodeType.DeepFry,
		displayName: "Deep Fry",
		inputs: 1,
		outputs: 1,
		paramSpecs: {},
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

export function buildDefaultParams<T extends CvNodeType>(
    type: T
): CvNodeParamsMap[T] {
    const paramSpecs = CV_NODE_CONFIGS[type].paramSpecs;
    const result = {} as CvNodeParamsMap[T];

    for (const key in paramSpecs) {
        const spec = paramSpecs[key];
        result[key] = spec.default;
    }

    return result;
}
