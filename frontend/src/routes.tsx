import { createBrowserRouter } from 'react-router-dom'
import OuterLayout from './pages/(outer)/layout'
import HomePage from './pages/(outer)/page'
import EditorPage from './pages/editor/page'

const router = createBrowserRouter([
	{ path: '/', element: <OuterLayout />, children: [
		{ index: true, element: <HomePage /> },
	],},
	{ path: '/editor', element: <EditorPage /> },
])

export default router
