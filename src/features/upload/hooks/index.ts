// FitnessTab hooks
export { useFileUpload, type UseFileUploadReturn } from './useFileUpload';
export { useFileProcessing, type UseFileProcessingReturn } from './useFileProcessing';
export { useUploadedFiles, type UseUploadedFilesReturn } from './useUploadedFiles';
export { useHelpExpansion, type UseHelpExpansionReturn } from './useHelpExpansion';

// ProfileTab hooks
export { useProfileForm, type UseProfileFormReturn } from './useProfileForm';
export { useImageUpload, type UseImageUploadReturn } from './useImageUpload';
export { useAccountDeletion, type UseAccountDeletionReturn } from './useAccountDeletion';

// ProtocolsTab hooks
export { useDietProtocol, type UseDietProtocolReturn } from './useDietProtocol';
export { useWorkoutProtocols, type UseWorkoutProtocolsReturn } from './useWorkoutProtocols';
export { useSupplementProtocols, type UseSupplementProtocolsReturn } from './useSupplementProtocols';
export { useExperiments, type UseExperimentsReturn } from './useExperiments';
export { useProtocolModals, type ModalType, type UseProtocolModalsReturn } from './useProtocolModals';
export { 
  useProtocolOperations, 
  type UseProtocolOperationsReturn,
  type ExperimentData
} from './useProtocolOperations';

// Session management hooks
export { useSessionRecovery } from './useSessionRecovery';
