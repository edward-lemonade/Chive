import { createBrowserRouter, Navigate } from 'react-router-dom'
import OuterLayout from './pages/(outer)/layout'
import HomePage from './pages/(outer)/home.page'
import EditorPage from './pages/editor/editor.page'
import RegisterPage from './pages/(auth)/register.page'
import LoginPage from './pages/(auth)/login.page'
import AppLayout from './pages/(app)/layout'
import ProjectsPage from './pages/(app)/projects.page'
import { useAuth } from './hooks/useAuth'

// Auth guard: redirect to login if not authenticated
function AuthGuard({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useAuth();
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}
	return <>{children}</>;
}

// Guest guard: redirect to projects if already authenticated
function GuestGuard({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useAuth();
	if (isAuthenticated) {
		return <Navigate to="/projects" replace />;
	}
	return <>{children}</>;
}

const router = createBrowserRouter([
	{ path: '/', element: <OuterLayout />, children: [
		{ index: true, element: <HomePage /> },
	],},
	{ path: '/editor/:id', element: <AuthGuard><EditorPage /></AuthGuard> },
	{ path: '/editor', element: <AuthGuard><EditorPage /></AuthGuard> },
	{ path: '/register', element: <GuestGuard><RegisterPage /></GuestGuard> },
	{ path: '/login', element: <GuestGuard><LoginPage /></GuestGuard> },

	{ path: '/', element: <AuthGuard><AppLayout /></AuthGuard>, children: [
		{ path: 'projects', element: <ProjectsPage /> },
	],},
])

export default router
