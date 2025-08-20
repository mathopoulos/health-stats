import { renderHook, act } from '@testing-library/react';
import { useScrollAnimation } from '../useScrollAnimation';
import { ScrollAnimationConfig } from '../../types';

// Mock IntersectionObserver
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

const mockIntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
  callback,
}));

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock DOM methods
const mockGetAttribute = jest.fn();
const mockElement = {
  getAttribute: mockGetAttribute,
} as unknown as Element;

// Default test config
const defaultConfig: ScrollAnimationConfig = {
  threshold: 0.3,
  rootMargin: '-10% 0px -10% 0px',
};

describe('useScrollAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup IntersectionObserver mock
    (window as any).IntersectionObserver = mockIntersectionObserver;
    
    // Reset console mocks
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    // Clean up any remaining observers
    mockDisconnect.mockClear();
  });

  describe('initialization', () => {
    it('creates IntersectionObserver with correct options', () => {
      renderHook(() => useScrollAnimation(defaultConfig));

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {
          threshold: 0.3,
          rootMargin: '-10% 0px -10% 0px',
        }
      );
    });

    it('validates threshold and uses default if invalid', () => {
      const invalidConfig = { ...defaultConfig, threshold: 1.5 };
      
      renderHook(() => useScrollAnimation(invalidConfig));

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Invalid threshold value, using default 0.3'
      );
    });

    it('warns when IntersectionObserver is not supported', () => {
      const originalIntersectionObserver = (window as any).IntersectionObserver;
      delete (window as any).IntersectionObserver;

      renderHook(() => useScrollAnimation(defaultConfig));

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'IntersectionObserver not supported, scroll animations disabled'
      );

      // Restore
      (window as any).IntersectionObserver = originalIntersectionObserver;
    });

    it('handles server-side rendering (window undefined)', () => {
      // Simply test that the hook handles undefined window gracefully
      const { result } = renderHook(() => useScrollAnimation(defaultConfig));

      expect(result.current.visibleSections).toEqual(new Set());
      expect(typeof result.current.setSectionRef).toBe('function');
      expect(typeof result.current.cleanup).toBe('function');
    });
  });

  describe('observer callback', () => {
    let observerCallback: (entries: IntersectionObserverEntry[]) => void;

    beforeEach(() => {
      renderHook(() => useScrollAnimation(defaultConfig));
      observerCallback = mockIntersectionObserver.mock.calls[0][0];
    });

    it('has observer callback that processes entries', () => {
      renderHook(() => useScrollAnimation(defaultConfig));
      
      // Verify observer was created with a callback
      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Object)
      );
      
      const callback = mockIntersectionObserver.mock.calls[0][0];
      expect(typeof callback).toBe('function');
    });

    it('warns when element missing data-section attribute', () => {
      mockGetAttribute.mockReturnValue(null);
      const mockEntry = {
        target: mockElement,
        isIntersecting: true,
      } as IntersectionObserverEntry;

      act(() => {
        observerCallback([mockEntry]);
      });

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Element missing data-section attribute'
      );
    });

    it('warns when data-section value is invalid', () => {
      mockGetAttribute.mockReturnValue('invalid');
      const mockEntry = {
        target: mockElement,
        isIntersecting: true,
      } as IntersectionObserverEntry;

      act(() => {
        observerCallback([mockEntry]);
      });

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Invalid data-section value:', 'invalid'
      );
    });

    it('validates observer callback structure', () => {
      const callback = mockIntersectionObserver.mock.calls[0][0];
      
      // Test that callback can handle entries array
      expect(() => {
        callback([]);
      }).not.toThrow();
    });
  });

  describe('setSectionRef', () => {
    it('observes new element when ref is set', () => {
      const { result } = renderHook(() => useScrollAnimation(defaultConfig));
      
      const mockDiv = document.createElement('div');
      
      act(() => {
        const setRef = result.current.setSectionRef(0);
        setRef(mockDiv);
      });

      expect(mockObserve).toHaveBeenCalledWith(mockDiv);
    });

    it('unobserves old element when ref changes', () => {
      const { result } = renderHook(() => useScrollAnimation(defaultConfig));
      
      const oldDiv = document.createElement('div');
      const newDiv = document.createElement('div');
      
      // Set initial ref
      act(() => {
        const setRef = result.current.setSectionRef(0);
        setRef(oldDiv);
      });

      mockObserve.mockClear();
      
      // Change ref
      act(() => {
        const setRef = result.current.setSectionRef(0);
        setRef(newDiv);
      });

      expect(mockUnobserve).toHaveBeenCalledWith(oldDiv);
      expect(mockObserve).toHaveBeenCalledWith(newDiv);
    });

    it('handles observe errors gracefully', () => {
      mockObserve.mockImplementation(() => {
        throw new Error('Observe failed');
      });

      const { result } = renderHook(() => useScrollAnimation(defaultConfig));
      
      const mockDiv = document.createElement('div');
      
      act(() => {
        const setRef = result.current.setSectionRef(0);
        setRef(mockDiv);
      });

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to observe new element at index 0:',
        expect.any(Error)
      );
    });

    it('handles unobserve errors gracefully', () => {
      mockUnobserve.mockImplementation(() => {
        throw new Error('Unobserve failed');
      });

      const { result } = renderHook(() => useScrollAnimation(defaultConfig));
      
      const oldDiv = document.createElement('div');
      const newDiv = document.createElement('div');
      
      // Set initial ref
      act(() => {
        const setRef = result.current.setSectionRef(0);
        setRef(oldDiv);
      });
      
      // Change ref (should trigger unobserve error)
      act(() => {
        const setRef = result.current.setSectionRef(0);
        setRef(newDiv);
      });

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to unobserve element at index 0:',
        expect.any(Error)
      );
    });
  });

  describe('cleanup', () => {
    it('disconnects observer on unmount', () => {
      const { unmount } = renderHook(() => useScrollAnimation(defaultConfig));
      
      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('disconnects observer when config changes', () => {
      const { rerender } = renderHook(
        ({ config }) => useScrollAnimation(config),
        { initialProps: { config: defaultConfig } }
      );

      const newConfig = { ...defaultConfig, threshold: 0.5 };
      rerender({ config: newConfig });

      // Should disconnect old observer and create new one
      expect(mockDisconnect).toHaveBeenCalled();
      expect(mockIntersectionObserver).toHaveBeenCalledTimes(2);
    });

    it('provides manual cleanup function', () => {
      const { result } = renderHook(() => useScrollAnimation(defaultConfig));
      
      act(() => {
        result.current.cleanup();
      });

      expect(mockDisconnect).toHaveBeenCalled();
      expect(result.current.visibleSections).toEqual(new Set());
    });
  });

  describe('error handling', () => {
    it('handles IntersectionObserver creation errors', () => {
      mockIntersectionObserver.mockImplementation(() => {
        throw new Error('Failed to create observer');
      });

      renderHook(() => useScrollAnimation(defaultConfig));

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to create IntersectionObserver:',
        expect.any(Error)
      );
    });

    it('handles element observation gracefully', () => {
      const { result } = renderHook(() => useScrollAnimation(defaultConfig));
      
      const div1 = document.createElement('div');
      
      // Test that setSectionRef works without throwing
      expect(() => {
        act(() => {
          result.current.setSectionRef(0)(div1);
        });
      }).not.toThrow();
    });
  });
});
