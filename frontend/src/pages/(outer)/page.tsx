export default function HomePage() {
	return (
		<div className="max-w-7xl mx-auto py-20 px-6">
			{/* Hero */}
			<section className="text-white text-center">
				<h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
					Build OpenCV pipelines visually.
				</h1>
				<p className="mt-6 text-lg max-w-3xl mx-auto text-emerald-100/90">
					Chive is a fast, responsive visual editor for computer vision
					pipelines — edit graphs, preview results, export clean code, and
					fork open-source pipelines from the community.
				</p>

				<div className="mt-8 flex justify-center gap-4">
					<a
						href="/editor"
						className="inline-block rounded-md text-black bg-emerald-400 hover:bg-emerald-300 duration-100 px-6 py-3 font-semibold shadow-lg"
					>
						Try the editor
					</a>

					<a
						href="/pipelines"
						className="inline-block rounded-md border border-white/20 px-6 py-3 hover:bg-white/5 duration-100"
					>
						Explore pipelines
					</a>
				</div>
			</section>

			{/* Features */}
			<section className="mt-20">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="bg-slate-900/30 rounded-2xl p-6">
						<h3 className="text-xl font-semibold">Visual Editor</h3>
						<p className="mt-3 text-sm text-emerald-100/85">
							Drag, connect and tune nodes with instant previews.
						</p>
					</div>

					<div className="bg-slate-900/30 rounded-2xl p-6">
						<h3 className="text-xl font-semibold">Export to Code</h3>
						<p className="mt-3 text-sm text-emerald-100/85">
							One-click export generates clean Python or C++ OpenCV code from
							your visual graph.
						</p>
					</div>

					<div className="bg-slate-900/30 rounded-2xl p-6">
						<h3 className="text-xl font-semibold">Open Ecosystem</h3>
						<p className="mt-3 text-sm text-emerald-100/85">
							Browse community pipelines, fork, and compose building blocks to
							quickly prototype new CV ideas.
						</p>
					</div>
				</div>
			</section>

		</div>
	);
}
