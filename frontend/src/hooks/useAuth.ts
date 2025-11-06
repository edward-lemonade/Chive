import { useState, useEffect } from 'react';


export function useAuth(): boolean {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
		return !!localStorage.getItem('token');
	});

	useEffect(() => {
		const checkAuth = () => {
			setIsAuthenticated(!!localStorage.getItem('token'));
		};

		// storage changes (when token is added/removed in other tabs)
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'token') {
				checkAuth();
			}
		};

		// custom events (when api.ts clears the token in the same tab)
		const handleCustomStorageChange = () => {
			checkAuth();
		};

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('token-cleared', handleCustomStorageChange);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('token-cleared', handleCustomStorageChange);
		};
	}, []);

	return isAuthenticated;
}

