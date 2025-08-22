import { renderHook, act } from '@testing-library/react';
import { useHelpExpansion, UseHelpExpansionReturn } from '../useHelpExpansion';

describe('useHelpExpansion', () => {
  describe('Initial State', () => {
    it('should initialize with isHelpExpanded as false', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      expect(result.current.isHelpExpanded).toBe(false);
    });

    it('should return the correct interface structure', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      expect(result.current).toHaveProperty('isHelpExpanded');
      expect(result.current).toHaveProperty('setIsHelpExpanded');
      expect(typeof result.current.isHelpExpanded).toBe('boolean');
      expect(typeof result.current.setIsHelpExpanded).toBe('function');
    });

    it('should return stable reference types', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      const initialIsHelpExpanded = result.current.isHelpExpanded;
      const initialSetIsHelpExpanded = result.current.setIsHelpExpanded;
      
      // The setter function should be stable across renders
      expect(typeof initialSetIsHelpExpanded).toBe('function');
      expect(initialIsHelpExpanded).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should update isHelpExpanded to true when setIsHelpExpanded is called with true', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      act(() => {
        result.current.setIsHelpExpanded(true);
      });
      
      expect(result.current.isHelpExpanded).toBe(true);
    });

    it('should update isHelpExpanded to false when setIsHelpExpanded is called with false', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      // First set it to true
      act(() => {
        result.current.setIsHelpExpanded(true);
      });
      
      // Then set it back to false
      act(() => {
        result.current.setIsHelpExpanded(false);
      });
      
      expect(result.current.isHelpExpanded).toBe(false);
    });

    it('should handle multiple state changes correctly', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      // Initially false
      expect(result.current.isHelpExpanded).toBe(false);
      
      // Set to true
      act(() => {
        result.current.setIsHelpExpanded(true);
      });
      expect(result.current.isHelpExpanded).toBe(true);
      
      // Set to false
      act(() => {
        result.current.setIsHelpExpanded(false);
      });
      expect(result.current.isHelpExpanded).toBe(false);
      
      // Set to true again
      act(() => {
        result.current.setIsHelpExpanded(true);
      });
      expect(result.current.isHelpExpanded).toBe(true);
    });

    it('should handle consecutive calls with the same value', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      // Set to true multiple times
      act(() => {
        result.current.setIsHelpExpanded(true);
      });
      expect(result.current.isHelpExpanded).toBe(true);
      
      act(() => {
        result.current.setIsHelpExpanded(true);
      });
      expect(result.current.isHelpExpanded).toBe(true);
      
      // Set to false multiple times
      act(() => {
        result.current.setIsHelpExpanded(false);
      });
      expect(result.current.isHelpExpanded).toBe(false);
      
      act(() => {
        result.current.setIsHelpExpanded(false);
      });
      expect(result.current.isHelpExpanded).toBe(false);
    });
  });

  describe('Hook Behavior', () => {
    it('should maintain state independence between different hook instances', () => {
      const { result: result1 } = renderHook(() => useHelpExpansion());
      const { result: result2 } = renderHook(() => useHelpExpansion());
      
      // Both should start as false
      expect(result1.current.isHelpExpanded).toBe(false);
      expect(result2.current.isHelpExpanded).toBe(false);
      
      // Change first instance
      act(() => {
        result1.current.setIsHelpExpanded(true);
      });
      
      // First should be true, second should still be false
      expect(result1.current.isHelpExpanded).toBe(true);
      expect(result2.current.isHelpExpanded).toBe(false);
      
      // Change second instance
      act(() => {
        result2.current.setIsHelpExpanded(true);
      });
      
      // Both should now be true, but independently
      expect(result1.current.isHelpExpanded).toBe(true);
      expect(result2.current.isHelpExpanded).toBe(true);
    });

    it('should work correctly with re-renders', () => {
      let rerenderCount = 0;
      const { result, rerender } = renderHook(() => {
        rerenderCount++;
        return useHelpExpansion();
      });
      
      expect(rerenderCount).toBe(1);
      expect(result.current.isHelpExpanded).toBe(false);
      
      // Change state
      act(() => {
        result.current.setIsHelpExpanded(true);
      });
      
      expect(result.current.isHelpExpanded).toBe(true);
      
      // Force rerender
      rerender();
      
      // State should persist through rerenders
      expect(result.current.isHelpExpanded).toBe(true);
      expect(rerenderCount).toBe(3); // Initial + state change + manual rerender
    });

    it('should provide a stable setter function reference', () => {
      const { result, rerender } = renderHook(() => useHelpExpansion());
      
      const initialSetter = result.current.setIsHelpExpanded;
      
      // Trigger a state change
      act(() => {
        result.current.setIsHelpExpanded(true);
      });
      
      const setterAfterStateChange = result.current.setIsHelpExpanded;
      
      // Force a rerender
      rerender();
      
      const setterAfterRerender = result.current.setIsHelpExpanded;
      
      // All setter references should be the same (React useState behavior)
      expect(setterAfterStateChange).toBe(initialSetter);
      expect(setterAfterRerender).toBe(initialSetter);
    });
  });

  describe('TypeScript Interface Compliance', () => {
    it('should match the UseHelpExpansionReturn interface', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      // Type assertion to ensure the interface is properly implemented
      const hookResult: UseHelpExpansionReturn = result.current;
      
      expect(typeof hookResult.isHelpExpanded).toBe('boolean');
      expect(typeof hookResult.setIsHelpExpanded).toBe('function');
    });

    it('should have the correct return type structure', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      // Verify all required properties exist
      const requiredProps = ['isHelpExpanded', 'setIsHelpExpanded'];
      const actualProps = Object.keys(result.current);
      
      requiredProps.forEach(prop => {
        expect(actualProps).toContain(prop);
      });
      
      // Should only have the expected properties
      expect(actualProps).toHaveLength(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle rapid successive calls', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      // Rapidly toggle state multiple times
      act(() => {
        result.current.setIsHelpExpanded(true);
        result.current.setIsHelpExpanded(false);
        result.current.setIsHelpExpanded(true);
        result.current.setIsHelpExpanded(false);
        result.current.setIsHelpExpanded(true);
      });
      
      // Final state should be true
      expect(result.current.isHelpExpanded).toBe(true);
    });

    it('should work in different execution contexts', () => {
      // Test multiple hook instances in sequence
      for (let i = 0; i < 3; i++) {
        const { result } = renderHook(() => useHelpExpansion());
        
        expect(result.current.isHelpExpanded).toBe(false);
        
        act(() => {
          result.current.setIsHelpExpanded(true);
        });
        
        expect(result.current.isHelpExpanded).toBe(true);
      }
    });

    it('should maintain correct state through component lifecycle', () => {
      const { result, unmount } = renderHook(() => useHelpExpansion());
      
      // Set state before unmount
      act(() => {
        result.current.setIsHelpExpanded(true);
      });
      
      expect(result.current.isHelpExpanded).toBe(true);
      
      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Functional Testing', () => {
    it('should work as expected in a typical usage scenario', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      // Simulate typical user interaction: initially collapsed
      expect(result.current.isHelpExpanded).toBe(false);
      
      // User clicks to expand help
      act(() => {
        result.current.setIsHelpExpanded(true);
      });
      expect(result.current.isHelpExpanded).toBe(true);
      
      // User clicks again to collapse help
      act(() => {
        result.current.setIsHelpExpanded(false);
      });
      expect(result.current.isHelpExpanded).toBe(false);
    });

    it('should support boolean toggle functionality', () => {
      const { result } = renderHook(() => useHelpExpansion());
      
      const toggle = () => {
        result.current.setIsHelpExpanded(!result.current.isHelpExpanded);
      };
      
      // Initial state
      expect(result.current.isHelpExpanded).toBe(false);
      
      // Toggle on
      act(() => {
        toggle();
      });
      expect(result.current.isHelpExpanded).toBe(true);
      
      // Toggle off
      act(() => {
        toggle();
      });
      expect(result.current.isHelpExpanded).toBe(false);
    });
  });
});
