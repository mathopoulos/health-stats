import { render, screen } from '@testing-library/react';
import PricingHeader from '../PricingHeader';

describe('PricingHeader', () => {
  it('renders the main heading with correct text', () => {
    render(<PricingHeader />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Everything you need to optimize your health');
  });

  it('has proper heading ID for accessibility', () => {
    render(<PricingHeader />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('id', 'pricing-title');
  });

  it('includes highlighted text with gradient styling', () => {
    render(<PricingHeader />);

    const highlightedText = screen.getByText('optimize your health');
    expect(highlightedText).toHaveClass(
      'bg-gradient-to-r',
      'from-indigo-600',
      'to-purple-600',
      'dark:from-indigo-400',
      'dark:to-purple-400',
      'text-transparent',
      'bg-clip-text'
    );
  });

  it('applies custom className when provided', () => {
    const { container } = render(<PricingHeader className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper responsive text sizing classes', () => {
    render(<PricingHeader />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass(
      'text-3xl',
      'sm:text-4xl',
      'md:text-5xl'
    );
  });

  it('has proper dark mode styling classes', () => {
    render(<PricingHeader />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass(
      'text-gray-900',
      'dark:text-white'
    );
  });

  it('has proper margin and layout classes', () => {
    const { container } = render(<PricingHeader />);
    
    expect(container.firstChild).toHaveClass(
      'text-center',
      'mb-12',
      'sm:mb-16'
    );
  });
});
