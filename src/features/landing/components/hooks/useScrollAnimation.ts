'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollAnimationConfig } from '../types';

export function useScrollAnimation(config: ScrollAnimationConfig) {
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Cleanup function to disconnect observer
  const cleanupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Initialize or re-initialize observer when config changes
  useEffect(() => {
    // Check for IntersectionObserver support
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      console.warn('IntersectionObserver not supported, scroll animations disabled');
      return;
    }

    // Clean up existing observer
    cleanupObserver();

    // Validate config
    if (config.threshold < 0 || config.threshold > 1) {
      console.warn('Invalid threshold value, using default 0.3');
      config.threshold = 0.3;
    }

    try {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const sectionIndexAttr = entry.target.getAttribute('data-section');
            if (!sectionIndexAttr) {
              console.warn('Element missing data-section attribute');
              return;
            }

            const sectionIndex = parseInt(sectionIndexAttr, 10);
            if (isNaN(sectionIndex)) {
              console.warn('Invalid data-section value:', sectionIndexAttr);
              return;
            }

            if (entry.isIntersecting) {
              setVisibleSections(prev => new Set([...prev, sectionIndex]));
            }
          });
        },
        {
          threshold: config.threshold,
          rootMargin: config.rootMargin
        }
      );

      // Observe existing elements
      sectionRefs.current.forEach((ref, index) => {
        if (ref && observerRef.current) {
          try {
            observerRef.current.observe(ref);
          } catch (error) {
            console.warn(`Failed to observe element at index ${index}:`, error);
          }
        }
      });
    } catch (error) {
      console.error('Failed to create IntersectionObserver:', error);
    }

    // Cleanup on unmount or config change
    return cleanupObserver;
  }, [config.threshold, config.rootMargin, cleanupObserver]);

  // Enhanced setSectionRef with better error handling
  const setSectionRef = useCallback((index: number) => {
    return (el: HTMLDivElement | null) => {
      // Unobserve old element if it exists
      const oldRef = sectionRefs.current[index];
      if (oldRef && observerRef.current) {
        try {
          observerRef.current.unobserve(oldRef);
        } catch (error) {
          console.warn(`Failed to unobserve element at index ${index}:`, error);
        }
      }

      // Store new ref
      sectionRefs.current[index] = el;

      // Observe new element if it exists
      if (el && observerRef.current) {
        try {
          observerRef.current.observe(el);
        } catch (error) {
          console.warn(`Failed to observe new element at index ${index}:`, error);
        }
      }
    };
  }, []);

  // Manual cleanup function for external use
  const cleanup = useCallback(() => {
    cleanupObserver();
    setVisibleSections(new Set());
    sectionRefs.current = [];
  }, [cleanupObserver]);

  return {
    visibleSections,
    setSectionRef,
    sectionRefs,
    cleanup
  };
}