import apiClient from "@/middleware/api";
import { ChiveProject, ChiveProjectInfo } from "@/types/ChiveProject";
import { useEffect, useState, useMemo } from "react";
import SearchIcon from '@mui/icons-material/Search';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import { Link } from "react-router-dom";
import { formatDate } from "@/utils/date";

type SortType = 'latest' | 'name';
type ViewType = 'grid' | 'list';

export default function ProjectsPage() {
	const [projects, setProjects] = useState<ChiveProjectInfo[]>([]);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [sortType, setSortType] = useState<SortType>('latest');
	const [viewType, setViewType] = useState<ViewType>('grid');

	useEffect(() => {
		const fetchProjects = async () => {
			const res = await apiClient.get('/projects/infos');
			if (res.status != 200) {
				console.error("Could not fetch projects");
				return;
			}
			setProjects(res.data.projects);
		};

		fetchProjects();
	}, []);

	const filteredAndSortedProjects = useMemo(() => {
		let filtered = projects.filter(project =>
			project.title.toLowerCase().includes(searchQuery.toLowerCase())
		);

		if (sortType === 'name') {
			filtered.sort((a, b) => a.title.localeCompare(b.title));
		} else {
			filtered.sort((a, b) => {
				const dateA = new Date(a.updatedAt).getTime();
				const dateB = new Date(b.updatedAt).getTime();
				return dateB - dateA;
			});
		}

		return filtered;
	}, [projects, searchQuery, sortType]);

	return (
		<div className="flex-1 p-8 overflow-auto justify-center">
			{/* Header with search, sort, and view controls */}
			<div className="mb-6 space-y-4 flex flex-row justify-center gap-40">
				{/* Search bar */}
				<div className="relative max-w-md">
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
					<input
						type="text"
						placeholder="Search projects..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
					/>
				</div>

				{/* Sort buttons */}
				<div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
					<button
						onClick={() => setSortType('latest')}
						className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition ${
							sortType === 'latest'
								? 'bg-white/20 text-white'
								: 'text-white/70 hover:bg-white/10'
						}`}
					>
						<AccessTimeIcon className="w-4 h-4" />
						Sort by Latest
					</button>
					<button
						onClick={() => setSortType('name')}
						className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition ${
							sortType === 'name'
								? 'bg-white/20 text-white'
								: 'text-white/70 hover:bg-white/10'
						}`}
					>
						<SortByAlphaIcon className="w-4 h-4" />
						Sort by Name
					</button>
				</div>

				{/* View toggle */}
				<div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
					<button
						onClick={() => setViewType('grid')}
						className={`p-2 rounded-md transition ${
							viewType === 'grid'
								? 'bg-white/20 text-white'
								: 'text-white/70 hover:bg-white/10'
						}`}
						title="Grid view"
					>
						<GridViewIcon className="w-5 h-5" />
					</button>
					<button
						onClick={() => setViewType('list')}
						className={`p-2 rounded-md transition ${
							viewType === 'list'
								? 'bg-white/20 text-white'
								: 'text-white/70 hover:bg-white/10'
						}`}
						title="List view"
					>
						<ViewListIcon className="w-5 h-5" />
					</button>
				</div>
			</div>

			{/* Projects display */}
			{filteredAndSortedProjects.length === 0 ? (
				<div className="text-center text-white/60 py-12">
					{searchQuery ? 'No projects found matching your search.' : 'No projects yet.'}
				</div>
			) : viewType === 'grid' ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
					{filteredAndSortedProjects.map((project) => (
						<Link
							key={project.id}
							to={`/editor/${project.id}`}
							className="group relative bg-white/10 rounded-lg border border-white/20 p-4 cursor-pointer transition-all duration-200 hover:bg-white/15 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1 hover:border-white/30"
						>
							{/* Project icon/thumbnail */}
							<div className="aspect-square bg-linear-to-br from-emerald-400/20 to-green-500/20 rounded-md mb-3 flex items-center justify-center">
								<div className="text-2xl text-white/60">📄</div>
							</div>
							{/* Project title */}
							<div className="font-medium text-white text-sm truncate mb-1">
								{project.title}
							</div>
							{/* Project date */}
							<div className="text-xs text-white/50">
								{formatDate(project.updatedAt)}
							</div>
						</Link>
					))}
				</div>
			) : (
				<div className="space-y-2">
					{filteredAndSortedProjects.map((project) => (
						<Link
							key={project.id}
							to={`/editor/${project.id}`}
							className="group flex items-center gap-4 bg-white/10 rounded-lg border border-white/20 p-4 cursor-pointer transition-all duration-200 hover:bg-white/15 hover:shadow-lg hover:shadow-emerald-500/20 hover:border-white/30"
						>
							{/* Project icon */}
							<div className="w-12 h-12 bg-linear-to-br from-emerald-400/20 to-green-500/20 rounded-md flex items-center justify-center shrink-0">
								<div className="text-xl text-white/60">📄</div>
							</div>
							{/* Project details */}
							<div className="flex-1 min-w-0">
								<div className="font-medium text-white mb-1 truncate">
									{project.title}
								</div>
								<div className="text-sm text-white/50">
									Last modified: {formatDate(project.updatedAt)}
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}