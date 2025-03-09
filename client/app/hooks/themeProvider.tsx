import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: Theme;
}

interface ThemeProviderState {
	theme: Theme;
	usedColor: 'dark' | 'light';
	setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
	theme: 'system',
	usedColor: 'light',
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	children,
	defaultTheme = 'system',
	...props
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(defaultTheme);
	const [usedColor, setUsedColor] = useState<'dark' | 'light'>('light');

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove('light', 'dark');

		if (theme === 'system') {
			const systemTheme = window.matchMedia(
				'(prefers-color-scheme: dark)'
			).matches
				? 'dark'
				: 'light';

			root.classList.add(systemTheme);
			setUsedColor(systemTheme);
			return;
		}

		root.classList.add(theme);
		setUsedColor(theme);
	}, [theme]);

	const value = {
		theme,
		usedColor,
		setTheme: (theme: Theme) => {
			setTheme(theme);
		},
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error('useTheme must be used within a ThemeProvider');

	return context;
}
