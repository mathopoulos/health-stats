'use client';

import { useState, useRef, DragEvent } from 'react';

export interface UseFileUploadReturn {
  // Drag & Drop state
  isDragging: boolean;
  
  // File upload state
  inputFileRef: React.RefObject<HTMLInputElement>;
  isFileLoading: boolean;
  setIsFileLoading: (loading: boolean) => void;
  fileKey: number;
  setFileKey: (key: number | ((prev: number) => number)) => void;
  error: string | null;
  setError: (error: string | null) => void;
  uploading: boolean;
  progress: number;
  uploadSuccess: boolean;
  setUploadSuccess: (success: boolean) => void;
  
  // Event handlers
  handleDragEnter: (e: DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const inputFileRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (inputFileRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        inputFileRef.current.files = dt.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        inputFileRef.current.dispatchEvent(event);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file = inputFileRef.current?.files?.[0];
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.xml') && !file.name.endsWith('.fit')) {
      setError('Please upload an XML or FIT file');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'health-data');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadSuccess(true);
      setProgress(100);
      
      // Reset file input
      if (inputFileRef.current) {
        inputFileRef.current.value = '';
        setFileKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return {
    isDragging,
    inputFileRef,
    isFileLoading,
    setIsFileLoading,
    fileKey,
    setFileKey,
    error,
    setError,
    uploading,
    progress,
    uploadSuccess,
    setUploadSuccess,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleSubmit,
  };
}
