import { render, screen } from '@testing-library/react';
import Home from './page';

// Mock the theme toggle component since it's not the focus of this test
jest.mock('@components/ThemeToggleClient', () => {
  return function MockThemeToggle() {
    return <div data-testid="theme-toggle">Theme Toggle</div>;
  };
});

// Mock the landing components since they're tested separately
jest.mock('@features/landing', () => ({
  LifetimeOfferBanner: () => <div data-testid="lifetime-offer-banner">Lifetime Offer Banner</div>,
  Navigation: () => <div data-testid="navigation">Navigation</div>,
  HeroSection: () => <div data-testid="hero-section">Hero Section</div>,
  DashboardPreview: () => <div data-testid="dashboard-preview">Dashboard Preview</div>,
  ActionButtons: () => <div data-testid="action-buttons">Action Buttons</div>,
  HowItWorksSection: () => <div data-testid="how-it-works">How It Works</div>,
  PricingSection: () => <div data-testid="pricing-section">Pricing Section</div>,
  Footer: () => <div data-testid="footer">Footer</div>,
  heroConfig: { title: 'Test Title' },
  stepsConfig: [],
  pricingConfig: {},
  dashboardPreviewConfig: {}
}));

describe('Marketing Landing Page', () => {
  it('renders all main sections of the landing page', () => {
    render(<Home />);

    // Check that main page structure is present
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByLabelText('Health Stats landing page')).toBeInTheDocument();

    // Verify all major sections are rendered
    expect(screen.getByTestId('lifetime-offer-banner')).toBeInTheDocument();
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-preview')).toBeInTheDocument();
    expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Home />);

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-label', 'Health Stats landing page');
  });

  it('includes background decorative elements', () => {
    render(<Home />);

    // Background elements should have aria-hidden for accessibility
    const backgroundElements = document.querySelectorAll('[aria-hidden="true"]');
    expect(backgroundElements.length).toBeGreaterThan(0);
  });
});
