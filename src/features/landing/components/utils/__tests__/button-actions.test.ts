import {
  executeButtonAction,
  createButtonActionHandler,
  isValidButtonAction,
  extractButtonActions,
} from '../button-actions';
import { HeroConfig } from '../../types';

// Mock window.location and window.open
const mockLocation = {
  href: '',
};
const mockOpen = jest.fn();

// Store original values
const originalLocation = window.location;
const originalOpen = window.open;

// Mock window properties
beforeAll(() => {
  delete (window as any).location;
  delete (window as any).open;
  window.location = mockLocation as any;
  window.open = mockOpen;
});

afterAll(() => {
  window.location = originalLocation;
  window.open = originalOpen;
});

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock document.getElementById
const mockGetElementById = jest.spyOn(document, 'getElementById');
const mockScrollIntoView = jest.fn();

describe('button-actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = '';
  });

  describe('executeButtonAction', () => {
    describe('scroll action', () => {
      it('calls custom scroll function when provided', () => {
        const mockScrollFunction = jest.fn();
        
        executeButtonAction(
          { action: 'scroll', target: 'test-section' },
          mockScrollFunction
        );

        expect(mockScrollFunction).toHaveBeenCalledWith('test-section');
      });

      it('uses default scroll behavior when no custom function provided', () => {
        const mockElement = {
          scrollIntoView: mockScrollIntoView,
        } as unknown as HTMLElement;

        mockGetElementById.mockReturnValue(mockElement);

        executeButtonAction({ action: 'scroll', target: 'test-section' });

        expect(mockGetElementById).toHaveBeenCalledWith('test-section');
        expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
      });

      it('warns when target element is not found', () => {
        mockGetElementById.mockReturnValue(null);

        executeButtonAction({ action: 'scroll', target: 'nonexistent-section' });

        expect(mockConsoleWarn).toHaveBeenCalledWith(
          'Target element with ID "nonexistent-section" not found'
        );
      });

      it('warns when target is missing', () => {
        executeButtonAction({ action: 'scroll' });

        expect(mockConsoleWarn).toHaveBeenCalledWith(
          'Scroll action requires a target element ID'
        );
      });
    });

    describe('link action', () => {
      it('handles internal links without throwing', () => {
        // Test that internal links don't throw errors
        expect(() => {
          executeButtonAction({ action: 'link', href: '/internal-page' });
        }).not.toThrow();
        
        expect(() => {
          executeButtonAction({ action: 'link', href: '/auth/checkout' });
        }).not.toThrow();
      });

      it('opens external HTTP links in new window', () => {
        executeButtonAction({ action: 'link', href: 'https://example.com' });

        expect(mockOpen).toHaveBeenCalledWith(
          'https://example.com',
          '_blank',
          'noopener,noreferrer'
        );
      });

      it('opens external protocol-relative links in new window', () => {
        executeButtonAction({ action: 'link', href: '//example.com' });

        expect(mockOpen).toHaveBeenCalledWith(
          '//example.com',
          '_blank',
          'noopener,noreferrer'
        );
      });

      it('warns when href is missing', () => {
        executeButtonAction({ action: 'link' });

        expect(mockConsoleWarn).toHaveBeenCalledWith(
          'Link action requires an href'
        );
      });
    });

    it('warns for unknown action types', () => {
      executeButtonAction({ action: 'unknown' as any });

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Unknown button action: unknown'
      );
    });
  });

  describe('createButtonActionHandler', () => {
    it('returns a function that calls executeButtonAction', () => {
      const mockScrollFunction = jest.fn();
      const actionConfig = { action: 'scroll' as const, target: 'test-section' };
      
      const handler = createButtonActionHandler(actionConfig, mockScrollFunction);
      
      expect(typeof handler).toBe('function');
      
      handler();
      
      expect(mockScrollFunction).toHaveBeenCalledWith('test-section');
    });

    it('works without scroll function', () => {
      const mockElement = {
        scrollIntoView: mockScrollIntoView,
      } as unknown as HTMLElement;

      mockGetElementById.mockReturnValue(mockElement);

      const handler = createButtonActionHandler({
        action: 'scroll',
        target: 'test-section',
      });
      
      handler();
      
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  describe('isValidButtonAction', () => {
    it('returns true for valid scroll action', () => {
      expect(isValidButtonAction({ action: 'scroll', target: 'test-section' })).toBe(true);
    });

    it('returns false for scroll action without target', () => {
      expect(isValidButtonAction({ action: 'scroll' })).toBe(false);
    });

    it('returns true for valid link action', () => {
      expect(isValidButtonAction({ action: 'link', href: '/test-page' })).toBe(true);
    });

    it('returns false for link action without href', () => {
      expect(isValidButtonAction({ action: 'link' })).toBe(false);
    });

    it('returns false for unknown action', () => {
      expect(isValidButtonAction({ action: 'unknown' as any })).toBe(false);
    });
  });

  describe('extractButtonActions', () => {
    const mockHeroConfig: HeroConfig = {
      title: {
        line1: 'Test',
        line2: 'Title',
        highlightedWord: 'Test',
      },
      buttons: {
        primary: {
          text: 'Get Started',
          href: '/checkout',
        },
        secondary: {
          text: 'Learn More',
          action: 'scroll',
          target: 'features-section',
        },
      },
    };

    it('extracts primary button action as link', () => {
      const result = extractButtonActions(mockHeroConfig);

      expect(result.primary).toEqual({
        action: 'link',
        href: '/checkout',
      });
    });

    it('extracts secondary button action with scroll', () => {
      const result = extractButtonActions(mockHeroConfig);

      expect(result.secondary).toEqual({
        action: 'scroll',
        target: 'features-section',
        href: undefined,
      });
    });

    it('handles secondary button with link action', () => {
      const configWithLinkSecondary: HeroConfig = {
        ...mockHeroConfig,
        buttons: {
          ...mockHeroConfig.buttons,
          secondary: {
            text: 'External Link',
            action: 'link',
            href: 'https://example.com',
          },
        },
      };

      const result = extractButtonActions(configWithLinkSecondary);

      expect(result.secondary).toEqual({
        action: 'link',
        target: undefined,
        href: 'https://example.com',
      });
    });
  });
});
