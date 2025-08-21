import React from 'react';
import { render, screen } from '@testing-library/react';
import MobileHeader from '../MobileHeader';

describe('MobileHeader', () => {
  it('renders mobile header correctly', () => {
    render(<MobileHeader />);
    
    expect(screen.getByText('revly')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('applies correct styling classes', () => {
    const { container } = render(<MobileHeader />);
    
    const headerDiv = container.firstChild as HTMLElement;
    expect(headerDiv).toHaveClass('md:hidden');
  });
});
