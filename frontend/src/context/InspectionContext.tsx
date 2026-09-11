import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalyzeResponse } from '../types/api';
import { analyzePackageLabel, getImageUrl } from '../services/api';

interface InspectionContextType {
  currentInspection: AnalyzeResponse | null;
  imageFile: File | null;
  imageFiles: File[];
  imageUrl: string | null;
  imageUrls: string[];
  isAnalyzing: boolean;
  errorMessage: string | null;
  performAnalysis: (files: File | File[]) => Promise<boolean>;
  setInspectionData: (data: AnalyzeResponse, files?: File | File[]) => void;
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

  const setInspectionData = (data: AnalyzeResponse, files?: File | File[]) => {
    // Ensure image_urls are always populated — reconstruct from image_file_ids if missing
    const enrichedData = { ...data };
    if (
      (!enrichedData.image_urls || enrichedData.image_urls.length === 0) &&
      enrichedData.image_file_ids &&
      enrichedData.image_file_ids.length > 0
    ) {
      enrichedData.image_urls = enrichedData.image_file_ids.map(
        (fid) => getImageUrl(fid)
      );
    }

    setCurrentInspection(enrichedData);
    const arr = files ? (Array.isArray(files) ? files : [files]) : [];
    setImageFiles(arr);
    setErrorMessage(null);

    // If files are missing or empty, but data has image_urls from MongoDB, rehydrate real File objects
    if (enrichedData.image_urls && enrichedData.image_urls.length > 0 && (arr.length === 0 || arr.every((f) => f.size === 0))) {
      Promise.all(
        enrichedData.image_urls.map(async (url, idx) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return null;
            const blob = await res.blob();
            const filename = (enrichedData.filename && idx === 0) ? enrichedData.filename : `package_label_${idx + 1}.png`;
            return new File([blob], filename, { type: blob.type || 'image/png' });
          } catch {
            return null;
          }
        })
      ).then((rehydrated) => {
        const validFiles = rehydrated.filter((f): f is File => f !== null && f.size > 0);
        if (validFiles.length > 0) {
          setImageFiles(validFiles);
        }
      });
    }
  };

  const clearSession = () => {
    setCurrentInspection(null);
    setImageFiles([]);
    setErrorMessage(null);
    setIsAnalyzing(false);
  };

  const primaryImageUrl = (currentInspection?.image_urls && currentInspection.image_urls[0]) || null;
  const allImageUrls = currentInspection?.image_urls || [];

  return (
    <InspectionContext.Provider
      value={{
        currentInspection,
        imageFile: imageFiles[0] || null,
        imageFiles,
        imageUrl: primaryImageUrl,
        imageUrls: allImageUrls,
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
