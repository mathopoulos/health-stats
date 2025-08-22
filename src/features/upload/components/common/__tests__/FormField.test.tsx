import React from 'react';
import { render, screen } from '@testing-library/react';
import FormField from '../FormField';

describe('FormField', () => {
  it('renders correctly with label and children', () => {
    render(
      <FormField label="Test Label">
        <input type="text" data-testid="test-input" />
      </FormField>
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(
      <FormField label="Test Label" error="Test error message">
        <input type="text" />
      </FormField>
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows required asterisk when required is true', () => {
    render(
      <FormField label="Test Label" required>
        <input type="text" />
      </FormField>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FormField label="Test Label" className="custom-class">
        <input type="text" />
      </FormField>
    );

    const fieldDiv = container.firstChild as HTMLElement;
    expect(fieldDiv).toHaveClass('custom-class');
  });
});
