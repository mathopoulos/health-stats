import { useState, useCallback } from 'react';

export type ModalType = 
  | 'add-workout'
  | 'add-supplement' 
  | 'add-experiment'
  | 'edit-experiment'
  | 'edit-supplement';

export interface UseProtocolModalsReturn {
  // Modal states
  isAddWorkoutProtocolModalOpen: boolean;
  isAddSupplementProtocolModalOpen: boolean;
  isAddExperimentModalOpen: boolean;
  isEditExperimentModalOpen: boolean;
  isEditSupplementProtocolModalOpen: boolean;
  
  // Modal controls
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  closeAllModals: () => void;
  
  // Specific closers (for backward compatibility)
  setIsAddWorkoutProtocolModalOpen: (open: boolean) => void;
  setIsAddSupplementProtocolModalOpen: (open: boolean) => void;
  setIsAddExperimentModalOpen: (open: boolean) => void;
  setIsEditExperimentModalOpen: (open: boolean) => void;
  setIsEditSupplementProtocolModalOpen: (open: boolean) => void;
}

/**
 * Custom hook to manage all protocol-related modal states
 * Centralizes modal logic for better testability and maintainability
 */
export function useProtocolModals(): UseProtocolModalsReturn {
  const [isAddWorkoutProtocolModalOpen, setIsAddWorkoutProtocolModalOpen] = useState(false);
  const [isAddSupplementProtocolModalOpen, setIsAddSupplementProtocolModalOpen] = useState(false);
  const [isAddExperimentModalOpen, setIsAddExperimentModalOpen] = useState(false);
  const [isEditExperimentModalOpen, setIsEditExperimentModalOpen] = useState(false);
  const [isEditSupplementProtocolModalOpen, setIsEditSupplementProtocolModalOpen] = useState(false);

  const openModal = useCallback((type: ModalType): void => {
    switch (type) {
      case 'add-workout':
        setIsAddWorkoutProtocolModalOpen(true);
        break;
      case 'add-supplement':
        setIsAddSupplementProtocolModalOpen(true);
        break;
      case 'add-experiment':
        setIsAddExperimentModalOpen(true);
        break;
      case 'edit-experiment':
        setIsEditExperimentModalOpen(true);
        break;
      case 'edit-supplement':
        setIsEditSupplementProtocolModalOpen(true);
        break;
    }
  }, []);

  const closeModal = useCallback((type: ModalType): void => {
    switch (type) {
      case 'add-workout':
        setIsAddWorkoutProtocolModalOpen(false);
        break;
      case 'add-supplement':
        setIsAddSupplementProtocolModalOpen(false);
        break;
      case 'add-experiment':
        setIsAddExperimentModalOpen(false);
        break;
      case 'edit-experiment':
        setIsEditExperimentModalOpen(false);
        break;
      case 'edit-supplement':
        setIsEditSupplementProtocolModalOpen(false);
        break;
    }
  }, []);

  const closeAllModals = useCallback((): void => {
    setIsAddWorkoutProtocolModalOpen(false);
    setIsAddSupplementProtocolModalOpen(false);
    setIsAddExperimentModalOpen(false);
    setIsEditExperimentModalOpen(false);
    setIsEditSupplementProtocolModalOpen(false);
  }, []);

  return {
    // Modal states
    isAddWorkoutProtocolModalOpen,
    isAddSupplementProtocolModalOpen,
    isAddExperimentModalOpen,
    isEditExperimentModalOpen,
    isEditSupplementProtocolModalOpen,
    
    // Modal controls
    openModal,
    closeModal,
    closeAllModals,
    
    // Backward compatibility setters
    setIsAddWorkoutProtocolModalOpen,
    setIsAddSupplementProtocolModalOpen,
    setIsAddExperimentModalOpen,
    setIsEditExperimentModalOpen,
    setIsEditSupplementProtocolModalOpen,
  };
}
