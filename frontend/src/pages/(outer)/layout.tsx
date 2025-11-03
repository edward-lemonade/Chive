import { Link, Outlet } from 'react-router';
import { useState, useEffect } from 'react';
import Brand from '../../components/Brand';

export default function OuterLayout() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		const token = localStorage.getItem('token');
		setIsAuthenticated(!!token);
	}, []);

	return (
		<div className="min-h-screen bg-linear-to-b from-emerald-950 to-green-200 text-white flex flex-col">
			{/* Top Navbar */}
			<nav className="sticky top-0 h-20 z-50 bg-black/30 backdrop-blur-3xl">
				<div className="h-full max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
					{/* Brand component (text size can be overridden via prop) */}
					<Brand sizeClass="text-4xl sm:text-4xl md:text-5xl" />

					<div className="hidden md:flex items-center space-x-4">
						{isAuthenticated ? (
							<>
								<Link
									to="/projects"
									className="px-4 py-2 rounded-md text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 transition"
								>
									Projects
								</Link>

								<Link
									to="/editor"
									className="px-4 py-2 rounded-md text-sm font-medium text-black bg-emerald-400 hover:bg-emerald-300 transition"
								>
									Editor
								</Link>
							</>
						) : (
							<>
								<Link
									to="/register"
									className="px-4 py-2 rounded-md text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 transition"
								>
									Register
								</Link>

								<Link
									to="/login"
									className="px-4 py-2 rounded-md text-sm font-medium text-black bg-emerald-400 hover:bg-emerald-300 transition"
								>
									Login
								</Link>
							</>
						)}
					</div>

				</div>
			</nav>

			{/* Page Content */}
			<main className="flex-1 px-6 py-12 max-w-7xl mx-auto">
				<Outlet />
			</main>
		</div>
	);
}