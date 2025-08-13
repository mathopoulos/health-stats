'use client';

import React, { createContext, useContext, useState } from 'react';

interface WeeklyWorkoutContextType {
  workoutCount: number;
  setWorkoutCount: (count: number) => void;
}

const WeeklyWorkoutContext = createContext<WeeklyWorkoutContextType | undefined>(undefined);

export function WeeklyWorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workoutCount, setWorkoutCount] = useState(0);

  return (
    <WeeklyWorkoutContext.Provider value={{ workoutCount, setWorkoutCount }}>
      {children}
    </WeeklyWorkoutContext.Provider>
  );
}

export function useWeeklyWorkout() {
  const context = useContext(WeeklyWorkoutContext);
  if (context === undefined) {
    throw new Error('useWeeklyWorkout must be used within a WeeklyWorkoutProvider');
  }
  return context;
} 