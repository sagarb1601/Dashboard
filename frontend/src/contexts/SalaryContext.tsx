import React, { createContext, useContext, useState } from 'react';

interface SalaryContextType {
  salaryVersion: number;
  refreshSalaries: () => void;
}

const SalaryContext = createContext<SalaryContextType>({
  salaryVersion: 0,
  refreshSalaries: () => {},
});

export const SalaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salaryVersion, setSalaryVersion] = useState(0);

  const refreshSalaries = () => {
    setSalaryVersion(prev => prev + 1);
  };

  return (
    <SalaryContext.Provider value={{ salaryVersion, refreshSalaries }}>
      {children}
    </SalaryContext.Provider>
  );
};

export const useSalaryContext = () => useContext(SalaryContext); 