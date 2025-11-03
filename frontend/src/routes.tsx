import { createBrowserRouter } from 'react-router-dom'
import OuterLayout from './pages/(outer)/layout'
import HomePage from './pages/(outer)/home/page'
import EditorPage from './pages/editor/page'
import RegisterPage from './pages/(auth)/register/page'
import LoginPage from './pages/(auth)/login/page'
import AppLayout from './pages/(app)/layout'
import ProjectsPage from './pages/(app)/projects/page'


const router = createBrowserRouter([
	{ path: '/', element: <OuterLayout />, children: [
		{ index: true, element: <HomePage /> },
	],},
	{ path: '/editor/:id', element: <EditorPage /> },  // With id
	{ path: '/editor', element: <EditorPage /> },      // Without id
	{ path: '/register', element: <RegisterPage /> },
	{ path: '/login', element: <LoginPage /> },

	{ path: '/', element: <AppLayout />, children: [
		{ path: 'projects', element: <ProjectsPage /> },
	],},
])

export default router
