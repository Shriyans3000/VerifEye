import axios from 'axios';
import { AnalyzeResponse, HealthResponse } from '../types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // PaddleOCR + LLM can take up to 30-45 seconds
});

export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await client.get<HealthResponse>('/health');
    return response.status === 200 && response.data?.status === 'ok';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export const analyzePackageLabel = async (file: File): Promise<AnalyzeResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await client.post<AnalyzeResponse>('/api/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Malformed response received from the backend inspection server.');
    }

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error('Unable to connect to the VerifEye inspection server. Please check that the backend service is available.');
      }

      const status = error.response.status;
      const detail = error.response.data?.detail;

      if (status === 400) {
        throw new Error(detail || 'Invalid image file uploaded. Please select a valid JPG, PNG, or WEBP label image.');
      } else if (status === 422) {
        throw new Error(detail || 'The package image could not be processed by OCR. Please upload a clearer photograph.');
      } else if (status === 500) {
        throw new Error(detail || 'Inspection pipeline encountered a processing error. Please retry or contact support.');
      }
    }

    throw new Error(error.message || 'An unexpected error occurred while analyzing the image.');
  }
};

export const fetchInspections = async (limit: number = 20, skip: number = 0): Promise<AnalyzeResponse[]> => {
  try {
    const response = await client.get<AnalyzeResponse[]>('/api/inspections', {
      params: { limit, skip }
    });
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch inspections history:', error);
    return [];
  }
};

export const fetchInspectionById = async (id: string): Promise<AnalyzeResponse | null> => {
  try {
    const response = await client.get<AnalyzeResponse>(`/api/inspections/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch inspection ${id}:`, error);
    return null;
  }
};

