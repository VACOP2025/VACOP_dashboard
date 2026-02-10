import React, { createContext, useContext, useMemo, useState } from 'react';

type RobotConnectionContextValue = {
  isRobotConnected: boolean;
  setRobotConnected: (v: boolean) => void;
  toggleRobotConnected: () => void;
};

const RobotConnectionContext = createContext<RobotConnectionContextValue | null>(null);

export function RobotConnectionProvider({ children }: { children: React.ReactNode }) {
  const [isRobotConnected, setRobotConnected] = useState(false);

  const value = useMemo(
    () => ({
      isRobotConnected,
      setRobotConnected,
      toggleRobotConnected: () => setRobotConnected((v) => !v),
    }),
    [isRobotConnected]
  );

  return (
    <RobotConnectionContext.Provider value={value}>
      {children}
    </RobotConnectionContext.Provider>
  );
}

export function useRobotConnection() {
  const ctx = useContext(RobotConnectionContext);
  if (!ctx) {
    throw new Error('useRobotConnection must be used within <RobotConnectionProvider>');
  }
  return ctx;
}
