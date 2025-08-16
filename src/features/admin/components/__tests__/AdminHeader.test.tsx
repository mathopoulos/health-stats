import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { AdminHeader } from '../AdminHeader';

// Mock ThemeToggle component
jest.mock('@components/ThemeToggle', () => {
  return function MockThemeToggle() {
    return <div data-testid="theme-toggle">Theme Toggle</div>;
  };
});

describe('AdminHeader', () => {
  it('should render admin header with title and description', () => {
    render(<AdminHeader userEmail="admin@example.com" />);
    
    expect(screen.getByText('Admin - User Management')).toBeInTheDocument();
    expect(screen.getByText('Manage all user accounts')).toBeInTheDocument();
  });

  it('should display user email', () => {
    const email = 'admin@example.com';
    render(<AdminHeader userEmail={email} />);
    
    expect(screen.getByText(email)).toBeInTheDocument();
  });

  it('should render theme toggle component', () => {
    render(<AdminHeader userEmail="admin@example.com" />);
    
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('should handle empty email gracefully', () => {
    render(<AdminHeader userEmail="" />);
    
    expect(screen.getByText('Admin - User Management')).toBeInTheDocument();
    // Empty email should render without crashing
    const container = screen.getByText('Admin - User Management').closest('div');
    expect(container).toBeInTheDocument();
  });
});
