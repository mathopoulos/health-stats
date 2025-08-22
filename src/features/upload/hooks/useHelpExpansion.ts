'use client';

import { useState } from 'react';

export interface UseHelpExpansionReturn {
  isHelpExpanded: boolean;
  setIsHelpExpanded: (expanded: boolean) => void;
}

export function useHelpExpansion(): UseHelpExpansionReturn {
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);

  return {
    isHelpExpanded,
    setIsHelpExpanded,
  };
}
