import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Brand from '@/components/Brand';
import apiClient from '@/middleware/api';

export default function LoginPage() {
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const res = await apiClient.post(`/auth/login`, JSON.stringify({ username, password }));

			if (res.status != 200) {
				setError('Login failed');
				setLoading(false);
				return;
			}

			// Store token in localStorage
			if (res.data.token) {
				localStorage.setItem('token', res.data.token);
				navigate('/projects');
			}
		} catch (err) {
			setError('Failed to connect to server');
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-b from-emerald-950 to-green-200 text-white flex flex-col">
			{/* Top Navbar */}
			<nav className="sticky top-0 h-20 z-50 bg-black/30 backdrop-blur-3xl">
				<div className="h-full max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
					<Brand sizeClass="text-4xl sm:text-4xl md:text-5xl" />
					<div className="hidden md:flex items-center space-x-4">
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
					</div>
				</div>
			</nav>

			{/* Page Content */}
			<main className="flex-1 flex items-center justify-center px-6 py-12">
				<div className="w-full max-w-md">
					<div className="bg-slate-900/30 rounded-2xl p-8 backdrop-blur-sm">
						<h2 className="text-3xl font-bold text-center mb-2">Welcome Back</h2>
						<p className="text-center text-emerald-100/90 mb-8">
							Sign in to continue building
						</p>

						<form onSubmit={handleSubmit} className="space-y-6">
							<div>
								<label htmlFor="username" className="block text-sm font-medium mb-2">
									Username
								</label>
								<input
									id="username"
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
									className="w-full px-4 py-3 rounded-md bg-black/20 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
									placeholder="Enter your username"
								/>
							</div>

							<div>
								<label htmlFor="password" className="block text-sm font-medium mb-2">
									Password
								</label>
								<input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="w-full px-4 py-3 rounded-md bg-black/20 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
									placeholder="Enter your password"
								/>
							</div>

							{error && (
								<div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm">
									{error}
								</div>
							)}

							<button
								type="submit"
								disabled={loading}
								className="w-full rounded-md text-black bg-emerald-400 hover:bg-emerald-300 duration-100 px-6 py-3 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
							>
								{loading ? 'Signing In...' : 'Log In'}
							</button>

							<p className="text-center text-sm text-white/70">
								Don't have an account?{' '}
								<Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
									Register
								</Link>
							</p>
						</form>
					</div>
				</div>
			</main>
		</div>
	);
}

