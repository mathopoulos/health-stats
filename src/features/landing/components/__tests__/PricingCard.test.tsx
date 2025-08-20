import { render, screen } from '@testing-library/react';
import PricingCard from '../PricingCard';
import { PricingTier } from '../types';

const mockPricingData: PricingTier = {
  id: 'test-tier',
  name: 'revly',
  tagline: 'It\'s time you own your health.',
  price: {
    amount: '$29.99',
    currency: 'USD',
    billing: 'One-time payment • Lifetime access',
  },
  cta: {
    text: 'Get Beta Access',
    href: '/auth/checkout',
  },
  features: [], // Features not used in PricingCard component
};

describe('PricingCard', () => {
  it('renders pricing tier name as heading', () => {
    render(<PricingCard pricing={mockPricingData} />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('revly');
    expect(heading).toHaveAttribute('id', 'pricing-card-title');
  });

  it('displays the tagline', () => {
    render(<PricingCard pricing={mockPricingData} />);

    expect(screen.getByText('It\'s time you own your health.')).toBeInTheDocument();
  });

  it('displays the price amount with proper aria-label', () => {
    render(<PricingCard pricing={mockPricingData} />);

    const priceElement = screen.getByText('$29.99');
    expect(priceElement).toBeInTheDocument();
    expect(priceElement).toHaveAttribute('aria-label', 'Price: $29.99');
  });

  it('displays the billing information', () => {
    render(<PricingCard pricing={mockPricingData} />);

    expect(screen.getByText('One-time payment • Lifetime access')).toBeInTheDocument();
  });

  it('renders CTA button with correct href and text', () => {
    render(<PricingCard pricing={mockPricingData} />);

    const ctaButton = screen.getByRole('button', { name: /get beta access/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/auth/checkout');
    expect(ctaButton).toHaveTextContent('Get Beta Access');
  });

  it('has proper accessibility attributes', () => {
    render(<PricingCard pricing={mockPricingData} />);

    const card = screen.getByRole('region');
    expect(card).toHaveAttribute('aria-labelledby', 'pricing-card-title');

    const ctaButton = screen.getByRole('button', { name: /get beta access/i });
    expect(ctaButton).toHaveAttribute('aria-label', expect.stringContaining('Navigate to checkout'));
  });

  it('includes visual arrow indicator in CTA button', () => {
    render(<PricingCard pricing={mockPricingData} />);

    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(<PricingCard pricing={mockPricingData} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper styling classes for card appearance', () => {
    const { container } = render(<PricingCard pricing={mockPricingData} />);
    
    const card = container.firstChild;
    expect(card).toHaveClass(
      'bg-white/40',
      'dark:bg-gray-900/40',
      'backdrop-blur-lg',
      'rounded-2xl',
      'border',
      'border-gray-200/50',
      'dark:border-gray-800/50'
    );
  });

  it('has hover effects classes', () => {
    const { container } = render(<PricingCard pricing={mockPricingData} />);
    
    const card = container.firstChild;
    expect(card).toHaveClass(
      'hover:border-indigo-500/50',
      'transition-all',
      'duration-300',
      'hover:shadow-xl',
      'hover:scale-[1.02]'
    );
  });

  it('renders name with gradient styling', () => {
    render(<PricingCard pricing={mockPricingData} />);

    const nameHeading = screen.getByRole('heading', { level: 3 });
    expect(nameHeading).toHaveClass(
      'bg-gradient-to-r',
      'from-indigo-600',
      'via-purple-500',
      'to-indigo-600',
      'dark:from-indigo-400',
      'dark:via-purple-400',
      'dark:to-indigo-400',
      'text-transparent',
      'bg-clip-text'
    );
  });

  it('handles different pricing data correctly', () => {
    const differentPricing: PricingTier = {
      ...mockPricingData,
      name: 'Pro Plan',
      tagline: 'For serious health enthusiasts.',
      price: {
        amount: '$99.99',
        currency: 'USD',
        billing: 'Monthly subscription',
      },
      cta: {
        text: 'Start Pro Trial',
        href: '/pro-checkout',
      },
    };

    render(<PricingCard pricing={differentPricing} />);

    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('For serious health enthusiasts.')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('Monthly subscription')).toBeInTheDocument();
    
    const ctaButton = screen.getByRole('button', { name: /start pro trial/i });
    expect(ctaButton).toHaveAttribute('href', '/pro-checkout');
  });

  it('has proper focus styles for accessibility', () => {
    render(<PricingCard pricing={mockPricingData} />);

    const ctaButton = screen.getByRole('button', { name: /get beta access/i });
    expect(ctaButton).toHaveClass(
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-indigo-500',
      'focus:ring-offset-2'
    );
  });
});
