import { renderHook, act } from '@testing-library/react';
import { useProtocolModals, ModalType } from '../useProtocolModals';

describe('useProtocolModals', () => {
  describe('Initial State', () => {
    it('should initialize all modals as closed', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(false);
      expect(result.current.isAddExperimentModalOpen).toBe(false);
      expect(result.current.isEditExperimentModalOpen).toBe(false);
      expect(result.current.isEditSupplementProtocolModalOpen).toBe(false);
    });

    it('should return all required functions', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      expect(typeof result.current.openModal).toBe('function');
      expect(typeof result.current.closeModal).toBe('function');
      expect(typeof result.current.closeAllModals).toBe('function');
      expect(typeof result.current.setIsAddWorkoutProtocolModalOpen).toBe('function');
      expect(typeof result.current.setIsAddSupplementProtocolModalOpen).toBe('function');
      expect(typeof result.current.setIsAddExperimentModalOpen).toBe('function');
      expect(typeof result.current.setIsEditExperimentModalOpen).toBe('function');
      expect(typeof result.current.setIsEditSupplementProtocolModalOpen).toBe('function');
    });
  });

  describe('openModal', () => {
    it('should open add-workout modal', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      act(() => {
        result.current.openModal('add-workout');
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(true);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(false);
      expect(result.current.isAddExperimentModalOpen).toBe(false);
      expect(result.current.isEditExperimentModalOpen).toBe(false);
      expect(result.current.isEditSupplementProtocolModalOpen).toBe(false);
    });

    it('should open add-supplement modal', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      act(() => {
        result.current.openModal('add-supplement');
      });
      
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(true);
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
    });

    it('should open add-experiment modal', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      act(() => {
        result.current.openModal('add-experiment');
      });
      
      expect(result.current.isAddExperimentModalOpen).toBe(true);
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
    });

    it('should open edit-experiment modal', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      act(() => {
        result.current.openModal('edit-experiment');
      });
      
      expect(result.current.isEditExperimentModalOpen).toBe(true);
      expect(result.current.isAddExperimentModalOpen).toBe(false);
    });

    it('should open edit-supplement modal', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      act(() => {
        result.current.openModal('edit-supplement');
      });
      
      expect(result.current.isEditSupplementProtocolModalOpen).toBe(true);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(false);
    });

    it('should allow multiple modals to be open simultaneously', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      act(() => {
        result.current.openModal('add-workout');
        result.current.openModal('add-supplement');
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(true);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(true);
    });
  });

  describe('closeModal', () => {
    it('should close specific modal', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      act(() => {
        result.current.openModal('add-workout');
        result.current.openModal('add-supplement');
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(true);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(true);
      
      act(() => {
        result.current.closeModal('add-workout');
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(true);
    });

    it('should close all modal types', () => {
      const { result } = renderHook(() => useProtocolModals());
      const modalTypes: ModalType[] = ['add-workout', 'add-supplement', 'add-experiment', 'edit-experiment', 'edit-supplement'];
      
      // Open all modals
      act(() => {
        modalTypes.forEach(type => result.current.openModal(type));
      });
      
      // Verify all are open
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(true);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(true);
      expect(result.current.isAddExperimentModalOpen).toBe(true);
      expect(result.current.isEditExperimentModalOpen).toBe(true);
      expect(result.current.isEditSupplementProtocolModalOpen).toBe(true);
      
      // Close each one
      act(() => {
        modalTypes.forEach(type => result.current.closeModal(type));
      });
      
      // Verify all are closed
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(false);
      expect(result.current.isAddExperimentModalOpen).toBe(false);
      expect(result.current.isEditExperimentModalOpen).toBe(false);
      expect(result.current.isEditSupplementProtocolModalOpen).toBe(false);
    });
  });

  describe('closeAllModals', () => {
    it('should close all modals at once', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      // Open all modals
      act(() => {
        result.current.openModal('add-workout');
        result.current.openModal('add-supplement');
        result.current.openModal('add-experiment');
        result.current.openModal('edit-experiment');
        result.current.openModal('edit-supplement');
      });
      
      // Verify all are open
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(true);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(true);
      expect(result.current.isAddExperimentModalOpen).toBe(true);
      expect(result.current.isEditExperimentModalOpen).toBe(true);
      expect(result.current.isEditSupplementProtocolModalOpen).toBe(true);
      
      // Close all at once
      act(() => {
        result.current.closeAllModals();
      });
      
      // Verify all are closed
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(false);
      expect(result.current.isAddExperimentModalOpen).toBe(false);
      expect(result.current.isEditExperimentModalOpen).toBe(false);
      expect(result.current.isEditSupplementProtocolModalOpen).toBe(false);
    });
  });

  describe('Backward Compatibility Setters', () => {
    it('should work with individual setter functions', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      act(() => {
        result.current.setIsAddWorkoutProtocolModalOpen(true);
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(true);
      
      act(() => {
        result.current.setIsAddWorkoutProtocolModalOpen(false);
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
    });

    it('should maintain independence between setters', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      act(() => {
        result.current.setIsAddWorkoutProtocolModalOpen(true);
        result.current.setIsAddSupplementProtocolModalOpen(true);
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(true);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(true);
      
      act(() => {
        result.current.setIsAddWorkoutProtocolModalOpen(false);
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(true);
    });
  });

  describe('Hook Stability', () => {
    it('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => useProtocolModals());
      
      const initialOpenModal = result.current.openModal;
      const initialCloseModal = result.current.closeModal;
      const initialCloseAllModals = result.current.closeAllModals;
      
      // Trigger state change
      act(() => {
        result.current.openModal('add-workout');
      });
      
      rerender();
      
      // Function references should remain stable
      expect(result.current.openModal).toBe(initialOpenModal);
      expect(result.current.closeModal).toBe(initialCloseModal);
      expect(result.current.closeAllModals).toBe(initialCloseAllModals);
    });
  });

  describe('Edge Cases', () => {
    it('should handle closing already closed modals gracefully', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      // All modals start closed
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
      
      // Closing already closed modal should not cause issues
      act(() => {
        result.current.closeModal('add-workout');
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
    });

    it('should handle opening already open modals gracefully', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      // Open modal
      act(() => {
        result.current.openModal('add-workout');
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(true);
      
      // Opening already open modal should not cause issues
      act(() => {
        result.current.openModal('add-workout');
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(true);
    });

    it('should handle rapid open/close operations', () => {
      const { result } = renderHook(() => useProtocolModals());
      
      act(() => {
        result.current.openModal('add-workout');
        result.current.closeModal('add-workout');
        result.current.openModal('add-workout');
        result.current.closeAllModals();
        result.current.openModal('add-supplement');
      });
      
      expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
      expect(result.current.isAddSupplementProtocolModalOpen).toBe(true);
    });
  });
});

