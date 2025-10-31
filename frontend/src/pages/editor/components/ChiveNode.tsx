import { useCallback, useMemo } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { CvNode, CV_NODE_CONFIGS, CvNodeType } from '@/types/CvNode';
import useEditorStore from '../store';


function ChiveNode(props: CvNode) {
	const { id, data, selected } = props;
	const CONFIG = useMemo(() => CV_NODE_CONFIGS[data.cvNodeType], [data.cvNodeType]);

	const updateNodeHandles = useUpdateNodeInternals();

	const updateNode = useEditorStore(useCallback(state => (updatedData: Partial<typeof data>) => {
		const nodes = state.nodes;
		const updatedNodes = nodes.map((n: CvNode) => 
			n.id === id ? { ...n, data: { ...n.data, ...updatedData } } : n
		);
		state.setNodes(updatedNodes);
	}, [id]));

	const onNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {updateNode({ name: e.target.value });},
		[updateNode]
	);
	const onTypeChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {updateNode({ cvNodeType: Number(e.target.value) as CvNodeType });},
		[updateNode]
	);

	const handles = useMemo(() => {
		const makeHandles = (count: number, side: 'left' | 'right') => {
			if (count <= 0) return null;
			updateNodeHandles(id);
			return Array.from({ length: count }).map((_, i) => {
				const topPct = ((i + 1) / (count + 1)) * 100;
				const isLeft = side === 'left';
				return (
					<Handle
						key={`${side === 'left' ? 'in' : 'out'}-${i}`}
						type={isLeft ? 'target' : 'source'}
						id={`${side === 'left' ? 'in' : 'out'}-${i}`}
						position={isLeft ? Position.Left : Position.Right}
						style={{ 
							top: `${topPct}%`, 
							background: isLeft ? '#F59E0B' : '#3B82F6',
							width: '8px',
							height: '8px',
							border: '0px',
						}}
						className="nodrag rounded-full hover:ring-2 hover:ring-white/80"
					/>
				);
			});
		};

		return {
			left: makeHandles(CONFIG.inputs ?? 0, 'left'),
			right: makeHandles(CONFIG.outputs ?? 0, 'right'),
		};
	}, [CONFIG.inputs, CONFIG.outputs, updateNodeHandles]);


	return (
		<>
			<style>{`
				.chive-node-select option { 
					background-color: #000 !important; 
					color: #D1FAE5 !important; 
				}
				.chive-node-select option:hover {
					background-color: #111 !important;
					color: #FFFFFF !important;
				}
				.chive-node-select option:checked,
				.chive-node-select option[selected] {
					background-color: #111133 !important; 
					color: #FFFFFF !important;
				}
				.chive-node-select option:focus {
					outline: 2px solid rgba(255,255,255,0.12) !important;
				}
			`}</style>
			<div className={`relative flex flex-col gap-2 bg-emerald-950 p-2 border-2 ${
				selected ? ' border-white/80' : 'border-white/20'
			}`}>
				{handles.left}
				{handles.right}
				<input
					className="nodrag w-40 bg-transparent text-green-100 text-sm font-medium focus:outline-none hover:bg-white/5 px-2 py-1 transition-colors focus:ring-2 focus:ring-blue-500"
					value={data.name}
					onChange={onNameChange}
					placeholder="Node name"
				/>

				<select
					className="nodrag w-40 bg-transparent text-green-100 text-sm px-2 py-1 border border-white/10 hover:bg-white/5 chive-node-select"
					value={data.cvNodeType}
					onChange={onTypeChange}
				>
					<option value={CvNodeType.Source}>Source</option>
					<option value={CvNodeType.Display}>Display</option>
				</select>
			</div>
		</>
	);
}

export default ChiveNode;
