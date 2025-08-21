import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FileDropZone from '../FileDropZone';

describe('FileDropZone', () => {
  const mockProps = {
    isDragging: false,
    onDragEnter: jest.fn(),
    onDragLeave: jest.fn(),
    onDragOver: jest.fn(),
    onDrop: jest.fn(),
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders children content', () => {
      render(
        <FileDropZone {...mockProps}>
          <p>Drop files here</p>
        </FileDropZone>
      );

      expect(screen.getByText('Drop files here')).toBeInTheDocument();
    });

    it('applies base classes for styling', () => {
      const { container } = render(
        <FileDropZone {...mockProps}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      expect(dropZone).toHaveClass(
        'border-2',
        'border-dashed',
        'rounded-lg',
        'p-8',
        'text-center',
        'transition-colors'
      );
    });

    it('applies custom className when provided', () => {
      const customClass = 'custom-drop-zone';
      const { container } = render(
        <FileDropZone {...mockProps} className={customClass}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      expect(dropZone).toHaveClass(customClass);
    });
  });

  describe('Drag state styling', () => {
    it('applies default border styling when not dragging', () => {
      const { container } = render(
        <FileDropZone {...mockProps} isDragging={false}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      expect(dropZone).toHaveClass('border-gray-300', 'dark:border-gray-700');
      expect(dropZone).not.toHaveClass('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20');
    });

    it('applies dragging styling when isDragging is true', () => {
      const { container } = render(
        <FileDropZone {...mockProps} isDragging={true}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      expect(dropZone).toHaveClass('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20');
      expect(dropZone).not.toHaveClass('border-gray-300', 'dark:border-gray-700');
    });
  });

  describe('Disabled state', () => {
    it('applies cursor-pointer class when not disabled', () => {
      const { container } = render(
        <FileDropZone {...mockProps} disabled={false}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      expect(dropZone).toHaveClass('cursor-pointer');
      expect(dropZone).not.toHaveClass('cursor-not-allowed');
    });

    it('applies cursor-not-allowed class when disabled', () => {
      const { container } = render(
        <FileDropZone {...mockProps} disabled={true}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      expect(dropZone).toHaveClass('cursor-not-allowed');
      expect(dropZone).not.toHaveClass('cursor-pointer');
    });

    it('uses default disabled state (false) when not specified', () => {
      const { container } = render(
        <FileDropZone {...mockProps}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      expect(dropZone).toHaveClass('cursor-pointer');
    });
  });

  describe('Event handling - enabled state', () => {
    it('calls onDragEnter when drag enter event occurs', () => {
      const { container } = render(
        <FileDropZone {...mockProps}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      fireEvent.dragEnter(dropZone);
      expect(mockProps.onDragEnter).toHaveBeenCalled();
    });

    it('calls onDragLeave when drag leave event occurs', () => {
      const { container } = render(
        <FileDropZone {...mockProps}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      fireEvent.dragLeave(dropZone);
      expect(mockProps.onDragLeave).toHaveBeenCalled();
    });

    it('calls onDragOver when drag over event occurs', () => {
      const { container } = render(
        <FileDropZone {...mockProps}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      fireEvent.dragOver(dropZone);
      expect(mockProps.onDragOver).toHaveBeenCalled();
    });

    it('calls onDrop when drop event occurs', () => {
      const { container } = render(
        <FileDropZone {...mockProps}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      fireEvent.drop(dropZone);
      expect(mockProps.onDrop).toHaveBeenCalled();
    });

    it('calls onClick when click event occurs', () => {
      const { container } = render(
        <FileDropZone {...mockProps}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      fireEvent.click(dropZone);
      expect(mockProps.onClick).toHaveBeenCalled();
    });
  });

  describe('Event handling - disabled state', () => {
    it('does not call onDragEnter when disabled', () => {
      const { container } = render(
        <FileDropZone {...mockProps} disabled={true}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      fireEvent.dragEnter(dropZone);
      expect(mockProps.onDragEnter).not.toHaveBeenCalled();
    });

    it('does not call onDragLeave when disabled', () => {
      const { container } = render(
        <FileDropZone {...mockProps} disabled={true}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      fireEvent.dragLeave(dropZone);
      expect(mockProps.onDragLeave).not.toHaveBeenCalled();
    });

    it('does not call onDragOver when disabled', () => {
      const { container } = render(
        <FileDropZone {...mockProps} disabled={true}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      fireEvent.dragOver(dropZone);
      expect(mockProps.onDragOver).not.toHaveBeenCalled();
    });

    it('does not call onDrop when disabled', () => {
      const { container } = render(
        <FileDropZone {...mockProps} disabled={true}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      fireEvent.drop(dropZone);
      expect(mockProps.onDrop).not.toHaveBeenCalled();
    });

    it('does not call onClick when disabled', () => {
      const { container } = render(
        <FileDropZone {...mockProps} disabled={true}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      fireEvent.click(dropZone);
      expect(mockProps.onClick).not.toHaveBeenCalled();
    });
  });

  describe('Combined styling states', () => {
    it('applies correct classes when dragging and disabled', () => {
      const { container } = render(
        <FileDropZone {...mockProps} isDragging={true} disabled={true}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      // Should show dragging state even when disabled
      expect(dropZone).toHaveClass('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20');
      // Should show disabled cursor
      expect(dropZone).toHaveClass('cursor-not-allowed');
    });

    it('applies correct classes when dragging and enabled', () => {
      const { container } = render(
        <FileDropZone {...mockProps} isDragging={true} disabled={false}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      // Should show dragging state
      expect(dropZone).toHaveClass('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20');
      // Should show pointer cursor
      expect(dropZone).toHaveClass('cursor-pointer');
    });

    it('applies custom className along with state classes', () => {
      const customClass = 'my-custom-class';
      const { container } = render(
        <FileDropZone 
          {...mockProps} 
          isDragging={true} 
          disabled={true}
          className={customClass}
        >
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      expect(dropZone).toHaveClass(
        customClass,
        'border-indigo-500',
        'cursor-not-allowed',
        'border-2',
        'border-dashed'
      );
    });
  });

  describe('Edge cases', () => {
    it('handles complex children content', () => {
      render(
        <FileDropZone {...mockProps}>
          <div>
            <h3>Upload Files</h3>
            <p>Drag and drop files here</p>
            <button>Browse</button>
          </div>
        </FileDropZone>
      );

      expect(screen.getByText('Upload Files')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop files here')).toBeInTheDocument();
      expect(screen.getByText('Browse')).toBeInTheDocument();
    });

    it('handles empty children gracefully', () => {
      const { container } = render(
        <FileDropZone {...mockProps}>
          {null}
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      expect(dropZone).toBeInTheDocument();
      expect(dropZone).toHaveClass('border-2', 'border-dashed');
    });

    it('works without custom className', () => {
      const { container } = render(
        <FileDropZone {...mockProps}>
          <p>Content</p>
        </FileDropZone>
      );

      const dropZone = container.firstChild as HTMLElement;
      expect(dropZone).toBeInTheDocument();
      // Should have base classes but not break without custom className
      expect(dropZone).toHaveClass('border-2', 'border-dashed', 'cursor-pointer');
    });

    it('handles accept prop (interface compliance)', () => {
      // accept prop is in interface but not used in implementation
      // This test ensures the prop doesn't cause runtime errors
      expect(() => {
        render(
          <FileDropZone {...mockProps} accept=".jpg,.png">
            <p>Content</p>
          </FileDropZone>
        );
      }).not.toThrow();
    });
  });
});
