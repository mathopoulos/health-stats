import { render, screen } from '@testing-library/react';
import PricingSection from '../PricingSection';
import { PricingTier } from '../types';

// Mock the sub-components since they're tested separately
jest.mock('../PricingHeader', () => {
  return function MockPricingHeader() {
    return <div data-testid="pricing-header">Pricing Header</div>;
  };
});

jest.mock('../PricingCard', () => {
  return function MockPricingCard() {
    return <div data-testid="pricing-card">Pricing Card</div>;
  };
});

jest.mock('../FeatureList', () => {
  return function MockFeatureList() {
    return <div data-testid="feature-list">Feature List</div>;
  };
});

const mockPricingData: PricingTier = {
  id: 'test-tier',
  name: 'revly',
  tagline: 'Test tagline',
  price: {
    amount: '$29.99',
    currency: 'USD',
    billing: 'One-time payment',
  },
  cta: {
    text: 'Get Access',
    href: '/checkout',
  },
  features: [
    {
      id: 'feature-1',
      title: 'Test Feature',
      description: 'Test description',
      icon: { type: 'checkmark' }
    }
  ],
};

describe('PricingSection', () => {
  it('renders the pricing section with all components', () => {
    render(<PricingSection pricing={mockPricingData} />);

    // Check that the main section is rendered by ID
    const section = document.getElementById('pricing-section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('role', 'region');
    expect(section).toHaveAttribute('aria-labelledby', 'pricing-title');

    // Verify all sub-components are rendered
    expect(screen.getByTestId('pricing-header')).toBeInTheDocument();
    expect(screen.getByTestId('pricing-card')).toBeInTheDocument();
    expect(screen.getByTestId('feature-list')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <PricingSection pricing={mockPricingData} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper responsive layout classes', () => {
    render(<PricingSection pricing={mockPricingData} />);

    const section = document.getElementById('pricing-section');
    expect(section).toHaveClass(
      'mt-0',
      'mb-16',
      'sm:mb-24',
      'px-8',
      'sm:px-12',
      'lg:px-20',
      'xl:px-32',
      'py-8',
      'sm:py-12'
    );
  });

  it('includes proper semantic structure for accessibility', () => {
    render(<PricingSection pricing={mockPricingData} />);

    // Check for features section with proper labeling
    const featuresSection = screen.getByLabelText('Product Features');
    expect(featuresSection).toBeInTheDocument();
    expect(featuresSection).toHaveAttribute('aria-labelledby', 'features-title');

    // Check for hidden features title
    const featuresTitle = document.querySelector('#features-title');
    expect(featuresTitle).toBeInTheDocument();
    expect(featuresTitle).toHaveClass('sr-only');
  });

  it('has proper grid layout for pricing card and features', () => {
    render(<PricingSection pricing={mockPricingData} />);

    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toHaveClass(
      'grid-cols-1',
      'lg:grid-cols-2',
      'gap-8',
      'lg:gap-12',
      'items-start'
    );
  });
});
