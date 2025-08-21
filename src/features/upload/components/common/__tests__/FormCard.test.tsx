import React from 'react';
import { render, screen } from '@testing-library/react';
import FormCard from '../FormCard';

describe('FormCard', () => {
  it('renders with title and children', () => {
    render(
      <FormCard title="Test Title">
        <p>Test content</p>
      </FormCard>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('always renders title as required prop', () => {
    render(
      <FormCard title="Required Title">
        <p>Test content</p>
      </FormCard>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Required Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <FormCard title="Test Title" description="Test description">
        <p>Test content</p>
      </FormCard>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default card styles', () => {
    render(
      <FormCard title="Test Title">
        <p>Test content</p>
      </FormCard>
    );
    
    const card = screen.getByText('Test Title').closest('div');
    expect(card).toHaveClass('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-sm');
  });

  it('applies custom className when provided', () => {
    render(
      <FormCard title="Test Title" className="custom-card-class">
        <p>Test content</p>
      </FormCard>
    );
    
    const card = screen.getByText('Test Title').closest('div');
    expect(card).toHaveClass('custom-card-class');
  });

  it('combines custom className with default styles', () => {
    render(
      <FormCard title="Test Title" className="custom-card-class">
        <p>Test content</p>
      </FormCard>
    );
    
    const card = screen.getByText('Test Title').closest('div');
    expect(card).toHaveClass('bg-white', 'dark:bg-gray-800', 'custom-card-class');
  });

  it('renders title as heading with correct level', () => {
    render(
      <FormCard title="Test Title">
        <p>Test content</p>
      </FormCard>
    );
    
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Test Title');
  });

  it('applies correct heading styles', () => {
    render(
      <FormCard title="Test Title">
        <p>Test content</p>
      </FormCard>
    );
    
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveClass('text-lg', 'font-medium', 'text-gray-900', 'dark:text-white');
  });

  it('applies correct description styles', () => {
    render(
      <FormCard title="Test Title" description="Test description">
        <p>Test content</p>
      </FormCard>
    );
    
    const description = screen.getByText('Test description');
    expect(description).toHaveClass('text-gray-600', 'dark:text-gray-400', 'mb-6');
  });

  it('renders complex children correctly', () => {
    render(
      <FormCard title="Test Title">
        <div>
          <label htmlFor="test-input">Label</label>
          <input id="test-input" type="text" />
          <button>Submit</button>
        </div>
      </FormCard>
    );
    
    expect(screen.getByLabelText('Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles empty children gracefully', () => {
    render(
      <FormCard title="Test Title">
        {null}
      </FormCard>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders with proper semantic structure', () => {
    render(
      <FormCard title="Profile Settings" description="Update your profile information">
        <form>
          <input type="text" placeholder="Name" />
        </form>
      </FormCard>
    );
    
    const card = screen.getByText('Profile Settings').closest('div');
    const header = screen.getByText('Profile Settings').parentElement;
    const content = screen.getByRole('textbox').closest('div');
    
    expect(card).toBeInTheDocument();
    expect(header).toBeInTheDocument();
    expect(content).toBeInTheDocument();
  });

  it('supports nested form elements', () => {
    render(
      <FormCard title="Contact Form">
        <form>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
          </div>
          <div>
            <label htmlFor="message">Message</label>
            <textarea id="message" />
          </div>
          <button type="submit">Send</button>
        </form>
      </FormCard>
    );
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('applies dark mode styles correctly', () => {
    render(
      <FormCard title="Test Title" description="Test description">
        <p>Test content</p>
      </FormCard>
    );
    
    const card = screen.getByText('Test Title').closest('div');
    const title = screen.getByText('Test Title');
    const description = screen.getByText('Test description');
    
    expect(card).toHaveClass('dark:bg-gray-800');
    expect(title).toHaveClass('dark:text-white');
    expect(description).toHaveClass('dark:text-gray-400');
  });

  it('maintains proper spacing between elements', () => {
    render(
      <FormCard title="Test Title" description="Test description">
        <p>Test content</p>
      </FormCard>
    );
    
    const card = screen.getByText('Test Title').closest('div');
    const title = screen.getByText('Test Title');
    const description = screen.getByText('Test description');
    
    expect(card).toHaveClass('p-6');
    expect(title).toHaveClass('mb-4');
    expect(description).toHaveClass('mb-6');
  });
});
