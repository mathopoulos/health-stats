'use client';

import { useEffect } from 'react';
import { useTheme } from '@providers/ThemeProvider';

interface UseIframeThemeSyncOptions {
  iframeId: string;
}

export function useIframeThemeSync({ iframeId }: UseIframeThemeSyncOptions) {
  const { theme, toggleTheme } = useTheme();

  // Listen for theme changes from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'IFRAME_THEME_CHANGE' && event.data.theme) {
        // Only update if the theme is different to avoid infinite loops
        if (event.data.theme !== theme) {
          toggleTheme();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [theme, toggleTheme]);

  // Sync theme with iframe when component mounts or theme changes
  useEffect(() => {
    const syncIframeTheme = () => {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage(
            { type: 'THEME_CHANGE', theme }, 
            '*'
          );
        } catch (error) {
          // Silently handle cases where iframe might not be ready
          console.log('Theme sync with iframe failed:', error);
        }
      }
    };

    // Sync immediately - no delay needed for theme changes
    syncIframeTheme();

    // Also sync when iframe loads (for initial setup)
    const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    if (iframe) {
      const handleLoad = () => {
        syncIframeTheme();
      };
      iframe.addEventListener('load', handleLoad);
      
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [theme, iframeId]);

  return { theme };
}