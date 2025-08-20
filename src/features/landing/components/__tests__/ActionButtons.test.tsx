import { render, screen, fireEvent } from '@testing-library/react';
import ActionButtons from '../ActionButtons';
import { HeroConfig } from '../types';
import * as buttonActions from '../utils/button-actions';
import * as useSmoothScroll from '../hooks/useSmoothScroll';

// Mock the custom hooks and utilities
jest.mock('../hooks/useSmoothScroll');
jest.mock('../utils/button-actions');

const mockScrollToSection = jest.fn();
const mockExtractButtonActions = jest.spyOn(buttonActions, 'extractButtonActions');
const mockCreateButtonActionHandler = jest.spyOn(buttonActions, 'createButtonActionHandler');

// Mock hook return
(useSmoothScroll.useSmoothScroll as jest.Mock).mockReturnValue({
  scrollToSection: mockScrollToSection,
});

const mockConfig: HeroConfig = {
  title: {
    line1: 'Test Line 1',
    line2: 'Test Line 2',
    highlightedWord: 'test',
  },
  buttons: {
    primary: {
      text: 'Get Started',
      href: '/auth/checkout',
    },
    secondary: {
      text: 'Learn More',
      action: 'scroll',
      target: 'how-it-works-section',
    },
  },
};

describe('ActionButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockExtractButtonActions.mockReturnValue({
      primary: {
        action: 'link' as const,
        href: '/auth/checkout',
      },
      secondary: {
        action: 'scroll' as const,
        target: 'how-it-works-section',
      },
    });

    mockCreateButtonActionHandler.mockReturnValue(jest.fn());
  });

  it('renders both primary and secondary buttons', () => {
    render(<ActionButtons config={mockConfig} />);

    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
  });

  it('displays correct button text from config', () => {
    render(<ActionButtons config={mockConfig} />);

    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('primary button has correct href', () => {
    render(<ActionButtons config={mockConfig} />);

    const primaryButton = screen.getByRole('button', { name: /get started/i });
    expect(primaryButton).toHaveAttribute('href', '/auth/checkout');
  });

  it('extracts button actions from config on render', () => {
    render(<ActionButtons config={mockConfig} />);

    expect(mockExtractButtonActions).toHaveBeenCalledWith(mockConfig);
  });

  it('creates secondary button action handler with scroll function', () => {
    render(<ActionButtons config={mockConfig} />);

    expect(mockCreateButtonActionHandler).toHaveBeenCalledWith(
      {
        action: 'scroll',
        target: 'how-it-works-section',
      },
      mockScrollToSection
    );
  });

  it('calls button action handler when secondary button is clicked', () => {
    const mockHandler = jest.fn();
    mockCreateButtonActionHandler.mockReturnValue(mockHandler);

    render(<ActionButtons config={mockConfig} />);

    const secondaryButton = screen.getByRole('button', { name: /learn more/i });
    fireEvent.click(secondaryButton);

    expect(mockHandler).toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<ActionButtons config={mockConfig} />);

    const primaryButton = screen.getByRole('button', { name: /get started/i });
    const secondaryButton = screen.getByRole('button', { name: /learn more/i });

    expect(primaryButton).toHaveAttribute('aria-label');
    expect(secondaryButton).toHaveAttribute('aria-label');
  });

  it('applies custom className', () => {
    const { container } = render(<ActionButtons config={mockConfig} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles different secondary button actions', () => {
    const configWithLink: HeroConfig = {
      ...mockConfig,
      buttons: {
        ...mockConfig.buttons,
        secondary: {
          text: 'External Link',
          action: 'link',
          href: 'https://example.com',
        },
      },
    };

    mockExtractButtonActions.mockReturnValue({
      primary: {
        action: 'link' as const,
        href: '/auth/checkout',
      },
      secondary: {
        action: 'link' as const,
        href: 'https://example.com',
      },
    });

    render(<ActionButtons config={configWithLink} />);

    expect(mockCreateButtonActionHandler).toHaveBeenCalledWith(
      {
        action: 'link',
        href: 'https://example.com',
      },
      mockScrollToSection
    );
  });

  it('renders section with proper semantic markup', () => {
    render(<ActionButtons config={mockConfig} />);

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'action-buttons-section');
  });

  it('includes visual arrow indicators', () => {
    render(<ActionButtons config={mockConfig} />);

    // Check for arrow characters in buttons
    expect(screen.getByText('→')).toBeInTheDocument();
    
    // Check for SVG arrow in secondary button
    const svgIcon = document.querySelector('svg path[d*="M19 9l-7 7-7-7"]');
    expect(svgIcon).toBeInTheDocument();
  });
});
