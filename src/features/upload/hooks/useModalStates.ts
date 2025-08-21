'use client';

import { useState } from 'react';

export interface UseModalStatesReturn {
  // Modal states
  isAddWorkoutProtocolModalOpen: boolean;
  setIsAddWorkoutProtocolModalOpen: (open: boolean) => void;
  isAddSupplementProtocolModalOpen: boolean;
  setIsAddSupplementProtocolModalOpen: (open: boolean) => void;
  isEditSupplementProtocolModalOpen: boolean;
  setIsEditSupplementProtocolModalOpen: (open: boolean) => void;
  isAddExperimentModalOpen: boolean;
  setIsAddExperimentModalOpen: (open: boolean) => void;
  isEditExperimentModalOpen: boolean;
  setIsEditExperimentModalOpen: (open: boolean) => void;
  
  // Helper functions
  closeAllModals: () => void;
}

export function useModalStates(): UseModalStatesReturn {
  const [isAddWorkoutProtocolModalOpen, setIsAddWorkoutProtocolModalOpen] = useState(false);
  const [isAddSupplementProtocolModalOpen, setIsAddSupplementProtocolModalOpen] = useState(false);
  const [isEditSupplementProtocolModalOpen, setIsEditSupplementProtocolModalOpen] = useState(false);
  const [isAddExperimentModalOpen, setIsAddExperimentModalOpen] = useState(false);
  const [isEditExperimentModalOpen, setIsEditExperimentModalOpen] = useState(false);

  const closeAllModals = () => {
    setIsAddWorkoutProtocolModalOpen(false);
    setIsAddSupplementProtocolModalOpen(false);
    setIsEditSupplementProtocolModalOpen(false);
    setIsAddExperimentModalOpen(false);
    setIsEditExperimentModalOpen(false);
  };

  return {
    isAddWorkoutProtocolModalOpen,
    setIsAddWorkoutProtocolModalOpen,
    isAddSupplementProtocolModalOpen,
    setIsAddSupplementProtocolModalOpen,
    isEditSupplementProtocolModalOpen,
    setIsEditSupplementProtocolModalOpen,
    isAddExperimentModalOpen,
    setIsAddExperimentModalOpen,
    isEditExperimentModalOpen,
    setIsEditExperimentModalOpen,
    closeAllModals,
  };
}
