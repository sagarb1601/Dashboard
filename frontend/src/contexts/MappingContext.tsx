import React, { createContext, useContext, useState } from 'react';

interface MappingContextType {
  mappingVersion: number;
  refreshMappings: () => void;
}

const MappingContext = createContext<MappingContextType>({
  mappingVersion: 0,
  refreshMappings: () => {},
});

export const MappingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mappingVersion, setMappingVersion] = useState(0);

  const refreshMappings = () => {
    setMappingVersion(prev => prev + 1);
  };

  return (
    <MappingContext.Provider value={{ mappingVersion, refreshMappings }}>
      {children}
    </MappingContext.Provider>
  );
};

export const useMappingContext = () => useContext(MappingContext); 