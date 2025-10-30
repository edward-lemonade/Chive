import { useCallback } from 'react';
import { CvNode, CvNodeType } from '@/types/CvNode';
import useEditorStore from '../store';

function ChiveNode(props: CvNode) {
	const { id, data, selected } = props;
	const updateNode = useEditorStore(useCallback(state => (updatedData: Partial<typeof data>) => {
		const nodes = state.nodes;
		const updatedNodes = nodes.map((n: CvNode) => 
			n.id === id ? { ...n, data: { ...n.data, ...updatedData } } : n
		);
		state.setNodes(updatedNodes);
	}, [id]));

	const onNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			updateNode({ name: e.target.value });
		},
		[updateNode]
	);

	const onTypeChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const newCvNodeType = Number(e.target.value) as CvNodeType;
			updateNode({ cvNodeType: newCvNodeType });
		},
		[updateNode]
	);

	return (
		<div className={`flex flex-col gap-2 bg-emerald-950 p-2 border-2 ${
			selected ? ' border-white/80' : 'border-white/20'
		}`}>
			<input
				className="nodrag w-40 bg-transparent text-green-100 text-sm font-medium focus:outline-none hover:bg-white/5 px-2 py-1 transition-colors focus:ring-2 focus:ring-blue-500"
				value={data.name}
				onChange={onNameChange}
				placeholder="Node name"
			/>

			<select
				className="nodrag w-40 bg-transparent text-green-100 text-sm px-2 py-1 border border-white/10 hover:bg-white/5"
				value={data.cvNodeType}
				onChange={onTypeChange}
			>
				<option value={CvNodeType.Source}>Source</option>
				<option value={CvNodeType.Display}>Display</option>
			</select>
		</div>
	);
}

export default ChiveNode;
