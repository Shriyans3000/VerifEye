import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalyzeResponse } from '../types/api';
import { analyzePackageLabel } from '../services/api';

interface InspectionContextType {
  currentInspection: AnalyzeResponse | null;
  imageFile: File | null;
  imageFiles: File[];
  isAnalyzing: boolean;
  errorMessage: string | null;
  performAnalysis: (files: File | File[]) => Promise<boolean>;
  setInspectionData: (data: AnalyzeResponse, files: File | File[]) => void;
  clearSession: () => void;
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

export const InspectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentInspection, setCurrentInspection] = useState<AnalyzeResponse | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performAnalysis = async (files: File | File[]): Promise<boolean> => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    const arr = Array.isArray(files) ? files : [files];
    setImageFiles(arr);

    try {
      const response = await analyzePackageLabel(arr);
      setCurrentInspection(response);
      return true;
    } catch (err: any) {
      console.error('Inspection analysis error in Context:', err);
      setErrorMessage(
        err.message || 'Unable to analyze the package images. Please try uploading clear label photographs.'
      );
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const setInspectionData = (data: AnalyzeResponse, files: File | File[]) => {
    setCurrentInspection(data);
    const arr = Array.isArray(files) ? files : [files];
    setImageFiles(arr);
    setErrorMessage(null);
  };

  const clearSession = () => {
    setCurrentInspection(null);
    setImageFiles([]);
    setErrorMessage(null);
    setIsAnalyzing(false);
  };

  return (
    <InspectionContext.Provider
      value={{
        currentInspection,
        imageFile: imageFiles[0] || null,
        imageFiles,
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
