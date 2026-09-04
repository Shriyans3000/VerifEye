import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalyzeResponse } from '../types/api';
import { analyzePackageLabel } from '../services/api';

interface InspectionContextType {
  currentInspection: AnalyzeResponse | null;
  imageFile: File | null;
  isAnalyzing: boolean;
  errorMessage: string | null;
  performAnalysis: (file: File) => Promise<boolean>;
  setInspectionData: (data: AnalyzeResponse, file: File) => void;
  clearSession: () => void;
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

export const InspectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentInspection, setCurrentInspection] = useState<AnalyzeResponse | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performAnalysis = async (file: File): Promise<boolean> => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setImageFile(file);

    try {
      const response = await analyzePackageLabel(file);
      setCurrentInspection(response);
      return true;
    } catch (err: any) {
      console.error('Inspection analysis error in Context:', err);
      setErrorMessage(
        err.message || 'Unable to analyze this image. Please try another clear package-label photograph.'
      );
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const setInspectionData = (data: AnalyzeResponse, file: File) => {
    setCurrentInspection(data);
    setImageFile(file);
    setErrorMessage(null);
  };

  const clearSession = () => {
    setCurrentInspection(null);
    setImageFile(null);
    setErrorMessage(null);
    setIsAnalyzing(false);
  };

  return (
    <InspectionContext.Provider
      value={{
        currentInspection,
        imageFile,
        isAnalyzing,
        errorMessage,
        performAnalysis,
        setInspectionData,
        clearSession,
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
};

export const useInspection = (): InspectionContextType => {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspection must be used within an InspectionProvider');
  }
  return context;
};
