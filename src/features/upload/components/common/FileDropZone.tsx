import React from 'react';

interface FileDropZoneProps {
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick: () => void;
  accept?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function FileDropZone({
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onClick,
  disabled = false,
  children,
  className = '',
}: FileDropZoneProps) {
  const baseClasses = 'border-2 border-dashed rounded-lg p-8 text-center transition-colors';
  const dragClasses = isDragging 
    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
    : 'border-gray-300 dark:border-gray-700';
  const cursorClasses = disabled ? 'cursor-not-allowed' : 'cursor-pointer';
  
  return (
    <div
      onDragEnter={disabled ? undefined : onDragEnter}
      onDragLeave={disabled ? undefined : onDragLeave}
      onDragOver={disabled ? undefined : onDragOver}
      onDrop={disabled ? undefined : onDrop}
      onClick={disabled ? undefined : onClick}
      className={`${baseClasses} ${dragClasses} ${cursorClasses} ${className}`}
    >
      {children}
    </div>
  );
}
