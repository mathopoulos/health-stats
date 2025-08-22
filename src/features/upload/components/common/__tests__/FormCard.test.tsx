import React from 'react';
import { render, screen } from '@testing-library/react';
import FormCard from '../FormCard';

describe('FormCard', () => {
  describe('Basic rendering', () => {
    it('renders title and children', () => {
      render(
        <FormCard title="Test Form">
          <p>Form content</p>
        </FormCard>
      );

      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText('Form content')).toBeInTheDocument();
    });

    it('applies base styling classes', () => {
      const { container } = render(
        <FormCard title="Test Form">
          <p>Form content</p>
        </FormCard>
      );

      const formCard = container.firstChild as HTMLElement;
      expect(formCard).toHaveClass(
        'bg-white',
        'dark:bg-gray-800',
        'rounded-lg',
        'shadow-sm',
        'p-6'
      );
    });

    it('renders title with correct styling', () => {
      render(
        <FormCard title="Test Form">
          <p>Form content</p>
        </FormCard>
      );

      const title = screen.getByText('Test Form');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass(
        'text-lg',
        'font-medium',
        'text-gray-900',
        'dark:text-white',
        'mb-4'
      );
    });
  });

  describe('Description handling', () => {
    it('renders description when provided', () => {
      const description = 'This is a form description';
      render(
        <FormCard title="Test Form" description={description}>
          <p>Form content</p>
        </FormCard>
      );

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('applies correct styling to description', () => {
      const description = 'This is a form description';
      render(
        <FormCard title="Test Form" description={description}>
          <p>Form content</p>
        </FormCard>
      );

      const descriptionElement = screen.getByText(description);
      expect(descriptionElement.tagName).toBe('P');
      expect(descriptionElement).toHaveClass(
        'text-gray-600',
        'dark:text-gray-400',
        'mb-6'
      );
    });

    it('does not render description when not provided', () => {
      render(
        <FormCard title="Test Form">
          <p>Form content</p>
        </FormCard>
      );

      // Should not have any p tag with description classes
      const paragraphs = screen.getAllByRole('paragraph');
      const descriptionP = paragraphs.find(p => 
        p.classList.contains('text-gray-600') && 
        p.classList.contains('mb-6')
      );
      expect(descriptionP).toBeUndefined();
    });

    it('does not render description when empty string', () => {
      render(
        <FormCard title="Test Form" description="">
          <p>Form content</p>
        </FormCard>
      );

      // Should not render description paragraph for empty string
      const paragraphs = screen.getAllByRole('paragraph');
      const descriptionP = paragraphs.find(p => 
        p.classList.contains('text-gray-600') && 
        p.classList.contains('mb-6')
      );
      expect(descriptionP).toBeUndefined();
    });
  });

  describe('Custom className', () => {
    it('applies custom className when provided', () => {
      const customClass = 'custom-form-card';
      const { container } = render(
        <FormCard title="Test Form" className={customClass}>
          <p>Form content</p>
        </FormCard>
      );

      const formCard = container.firstChild as HTMLElement;
      expect(formCard).toHaveClass(customClass);
    });

    it('combines custom className with base classes', () => {
      const customClass = 'custom-form-card another-class';
      const { container } = render(
        <FormCard title="Test Form" className={customClass}>
          <p>Form content</p>
        </FormCard>
      );

      const formCard = container.firstChild as HTMLElement;
      expect(formCard).toHaveClass(
        'bg-white',
        'dark:bg-gray-800',
        'rounded-lg',
        'shadow-sm',
        'p-6',
        'custom-form-card',
        'another-class'
      );
    });

    it('works without custom className (default empty string)', () => {
      const { container } = render(
        <FormCard title="Test Form">
          <p>Form content</p>
        </FormCard>
      );

      const formCard = container.firstChild as HTMLElement;
      expect(formCard).toHaveClass(
        'bg-white',
        'dark:bg-gray-800',
        'rounded-lg',
        'shadow-sm',
        'p-6'
      );
    });
  });

  describe('Children rendering', () => {
    it('renders simple text children', () => {
      render(
        <FormCard title="Test Form">
          Simple text content
        </FormCard>
      );

      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('renders complex JSX children', () => {
      render(
        <FormCard title="Test Form">
          <div>
            <input type="text" placeholder="Name" />
            <button>Submit</button>
            <span>Helper text</span>
          </div>
        </FormCard>
      );

      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByText('Helper text')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <FormCard title="Test Form">
          <p>First paragraph</p>
          <p>Second paragraph</p>
          <button>Action button</button>
        </FormCard>
      );

      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
      expect(screen.getByText('Action button')).toBeInTheDocument();
    });

    it('handles null/undefined children gracefully', () => {
      render(
        <FormCard title="Test Form">
          {null}
          {undefined}
          <p>Visible content</p>
        </FormCard>
      );

      expect(screen.getByText('Visible content')).toBeInTheDocument();
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  describe('Complete examples', () => {
    it('renders form card with all props', () => {
      render(
        <FormCard 
          title="User Registration" 
          description="Please fill out the form below to create your account"
          className="max-w-md mx-auto"
        >
          <form>
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <button type="submit">Register</button>
          </form>
        </FormCard>
      );

      expect(screen.getByText('User Registration')).toBeInTheDocument();
      expect(screen.getByText('Please fill out the form below to create your account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('renders minimal form card with only required props', () => {
      render(
        <FormCard title="Simple Form">
          <input type="text" />
        </FormCard>
      );

      expect(screen.getByText('Simple Form')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles very long title', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines and should still be rendered correctly';
      render(
        <FormCard title={longTitle}>
          <p>Content</p>
        </FormCard>
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles very long description', () => {
      const longDescription = 'This is a very long description that might wrap to multiple lines and should still be rendered correctly with proper styling and spacing';
      render(
        <FormCard title="Form" description={longDescription}>
          <p>Content</p>
        </FormCard>
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles special characters in title and description', () => {
      const specialTitle = 'Form & Settings (100% Complete) ✓';
      const specialDescription = 'Use symbols: @#$%^&*()_+-=[]{}|;:,.<>?';
      
      render(
        <FormCard title={specialTitle} description={specialDescription}>
          <p>Content</p>
        </FormCard>
      );

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
      expect(screen.getByText(specialDescription)).toBeInTheDocument();
    });
  });
});