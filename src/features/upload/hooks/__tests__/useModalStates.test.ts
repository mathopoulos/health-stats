import { renderHook, act } from '@testing-library/react';
import { useModalStates } from '../useModalStates';

describe('useModalStates', () => {
  it('initializes with all modals closed', () => {
    const { result } = renderHook(() => useModalStates());

    expect(result.current.isAddExperimentModalOpen).toBe(false);
    expect(result.current.isEditExperimentModalOpen).toBe(false);
    expect(result.current.isAddSupplementProtocolModalOpen).toBe(false);
    expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
    expect(result.current.isEditSupplementProtocolModalOpen).toBe(false);
  });

  it('updates isAddExperimentModalOpen state correctly', () => {
    const { result } = renderHook(() => useModalStates());

    act(() => {
      result.current.setIsAddExperimentModalOpen(true);
    });

    expect(result.current.isAddExperimentModalOpen).toBe(true);

    act(() => {
      result.current.setIsAddExperimentModalOpen(false);
    });

    expect(result.current.isAddExperimentModalOpen).toBe(false);
  });

  it('updates multiple modal states independently', () => {
    const { result } = renderHook(() => useModalStates());

    act(() => {
      result.current.setIsAddSupplementProtocolModalOpen(true);
      result.current.setIsAddWorkoutProtocolModalOpen(true);
    });

    expect(result.current.isAddSupplementProtocolModalOpen).toBe(true);
    expect(result.current.isAddWorkoutProtocolModalOpen).toBe(true);
    expect(result.current.isAddExperimentModalOpen).toBe(false);
  });

  it('closes all modals when closeAllModals is called', () => {
    const { result } = renderHook(() => useModalStates());

    // First open some modals
    act(() => {
      result.current.setIsAddExperimentModalOpen(true);
      result.current.setIsAddSupplementProtocolModalOpen(true);
      result.current.setIsEditExperimentModalOpen(true);
    });

    // Then close all
    act(() => {
      result.current.closeAllModals();
    });

    expect(result.current.isAddExperimentModalOpen).toBe(false);
    expect(result.current.isAddSupplementProtocolModalOpen).toBe(false);
    expect(result.current.isEditExperimentModalOpen).toBe(false);
    expect(result.current.isAddWorkoutProtocolModalOpen).toBe(false);
    expect(result.current.isEditSupplementProtocolModalOpen).toBe(false);
  });
});
