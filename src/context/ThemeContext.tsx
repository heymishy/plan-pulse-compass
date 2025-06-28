import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'enterprise' | 'corporate' | 'system';
export type ResolvedTheme = 'light' | 'dark' | 'enterprise' | 'corporate';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  themes: Array<{
    value: Theme;
    label: string;
    description: string;
    preview: string;
  }>;
  isSystemTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const themes = [
  {
    value: 'system' as Theme,
    label: 'System',
    description: 'Follows your system preference',
    preview: 'auto',
  },
  {
    value: 'light' as Theme,
    label: 'Light',
    description: 'Clean and bright interface',
    preview: 'light',
  },
  {
    value: 'dark' as Theme,
    label: 'Dark',
    description: 'Easy on the eyes in low light',
    preview: 'dark',
  },
  {
    value: 'enterprise' as Theme,
    label: 'Enterprise Blue',
    description: 'Professional blue tones',
    preview: 'enterprise',
  },
  {
    value: 'corporate' as Theme,
    label: 'Corporate Gray',
    description: 'Sophisticated gray palette',
    preview: 'corporate',
  },
];

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem('app-theme');
    return (stored as Theme) || 'system';
  } catch {
    return 'system';
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    getSystemTheme
  );

  // Calculate resolved theme (actual theme being applied)
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;
  const isSystemTheme = theme === 'system';

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove('light', 'dark', 'enterprise', 'corporate');

    // Add the resolved theme class
    root.classList.add(resolvedTheme);

    // Set data attribute for CSS targeting
    root.setAttribute('data-theme', resolvedTheme);

    // Set system theme indicator
    if (isSystemTheme) {
      root.setAttribute('data-system-theme', 'true');
    } else {
      root.removeAttribute('data-system-theme');
    }
  }, [resolvedTheme, isSystemTheme]);

  // Persist theme preference
  useEffect(() => {
    try {
      localStorage.setItem('app-theme', theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        themes,
        isSystemTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
