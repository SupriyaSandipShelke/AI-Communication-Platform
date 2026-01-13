import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'gradient' | 'glassmorphism' | 'modern' | 'minimal';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    // Load theme from localStorage or API
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Try to fetch from API
      fetchThemeFromAPI();
    }
  }, []);

  const fetchThemeFromAPI = async () => {
    try {
      const response = await fetch('/api/user/ui/theme');
      const data = await response.json();
      if (data.success && data.theme) {
        setThemeState(data.theme);
        applyTheme(data.theme);
      }
    } catch (error) {
      console.warn('Failed to fetch theme from API:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Save to API
    try {
      await fetch('/api/user/ui/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (error) {
      console.warn('Failed to save theme to API:', error);
    }
  };

  const applyTheme = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Add class for specific theme behaviors
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-gradient', 'theme-glassmorphism', 'theme-modern', 'theme-minimal');
    document.body.classList.add(`theme-${theme}`);
  };

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'gradient', 'glassmorphism', 'modern', 'minimal'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
