import { Link, Outlet } from "react-router";
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';

export default function AppLayout() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-emerald-950 to-green-200 text-white flex flex-row">
			<div className="w-20 flex flex-col items-center justify-start gap-6 pt-8 bg-gradient-to-b from-emerald-900 to-green-100">
				<div className="flex flex-col items-center gap-2">
					<Link
						to="/editor"
						className="w-12 h-12 flex items-center justify-center rounded-lg text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 transition"
					>
						<AddIcon />
					</Link>
					<div className="text-xs text-center">
						Create
					</div>
				</div>

				<div className="flex flex-col items-center gap-2">
					<Link
						to="/projects"
						className="w-12 h-12 flex items-center justify-center rounded-lg text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 transition"
					>
						<FolderIcon />
					</Link>
					<div className="text-xs text-center">
						Projects
					</div>
				</div>
			</div>

			<Outlet/>
		</div>
	)
}