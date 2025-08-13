'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function to get initial theme
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    // Check localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'dark'; // Default fallback
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  // Handle initial setup after mount
  useEffect(() => {
    setMounted(true);
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      
      // Notify all iframes about theme change immediately
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if (iframe.contentWindow) {
          try {
            iframe.contentWindow.postMessage(
              { type: 'THEME_CHANGE', theme }, 
              '*'
            );
          } catch (error) {
            // Silently handle cases where iframe might not be ready
            console.log('Failed to notify iframe of theme change:', error);
          }
        }
      });
    }
  }, [theme, mounted]);

  // Listen for theme changes from parent window (when in iframe)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'THEME_CHANGE' && event.data.theme) {
        const newTheme = event.data.theme as Theme;
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
    };

    // Listen for localStorage changes (cross-tab sync)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'theme' && event.newValue) {
        const newTheme = event.newValue as Theme;
        setTheme(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // If we're in an iframe, notify the parent window
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          { type: 'IFRAME_THEME_CHANGE', theme: newTheme }, 
          '*'
        );
      } catch (error) {
        console.log('Failed to notify parent of theme change:', error);
      }
    }
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 