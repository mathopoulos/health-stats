'use client';

import { useState, useEffect } from 'react';
import type { UploadedFile } from '../services';

export interface UseUploadedFilesReturn {
  // File management state
  uploadedFiles: UploadedFile[];
  selectedFiles: Set<string>;
  isLoadingFiles: boolean;
  
  // File management handlers
  fetchUploadedFiles: () => void;
  deleteSelectedFiles: () => void;
  toggleSelectAllFiles: () => void;
  toggleFileSelection: (fileId: string) => void;
  isFileSelected: (fileId: string) => boolean;
  handleDeleteFile: (fileId: string) => void;
}

export function useUploadedFiles(): UseUploadedFilesReturn {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const fetchUploadedFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch('/api/uploads');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.files) {
          setUploadedFiles(data.files);
        }
      }
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return;

    try {
      // Delete files one by one since the API expects individual DELETE requests
      const deletePromises = Array.from(selectedFiles).map(async (fileId) => {
        const encodedFileId = encodeURIComponent(fileId);
        const response = await fetch(`/api/uploads/${encodedFileId}`, {
          method: 'DELETE',
        });
        return { fileId, success: response.ok };
      });

      const results = await Promise.all(deletePromises);
      
      // Filter out successfully deleted files
      const successfullyDeleted = results
        .filter(result => result.success)
        .map(result => result.fileId);

      if (successfullyDeleted.length > 0) {
        setUploadedFiles(prev => 
          prev.filter(file => !successfullyDeleted.includes(file.id))
        );
        setSelectedFiles(new Set());
      }
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  };

  const toggleSelectAllFiles = () => {
    if (selectedFiles.size === uploadedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(uploadedFiles.map(file => file.id)));
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const isFileSelected = (fileId: string) => {
    return selectedFiles.has(fileId);
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const encodedFileId = encodeURIComponent(fileId);
      const response = await fetch(`/api/uploads/${encodedFileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
        setSelectedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // Load files on mount
  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  return {
    uploadedFiles,
    selectedFiles,
    isLoadingFiles,
    fetchUploadedFiles,
    deleteSelectedFiles,
    toggleSelectAllFiles,
    toggleFileSelection,
    isFileSelected,
    handleDeleteFile,
  };
}
