import axios from 'axios';
import { AnalyzeResponse, HealthResponse, BrandRepository } from '../types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // PaddleOCR + LLM can take up to 30-60 seconds for large labels
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

export const analyzePackageLabel = async (files: File | File[]): Promise<AnalyzeResponse> => {
  const formData = new FormData();
  const fileArray = Array.isArray(files) ? files : [files];

  if (fileArray.length === 1) {
    formData.append('file', fileArray[0]);
  } else {
    fileArray.forEach((f) => {
      formData.append('files', f);
    });
  }

  try {
    const response = await client.post<AnalyzeResponse>('/analyze', formData, {
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
      if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
        throw new Error('Inspection timed out while processing image. Please try again with a clearer or smaller package photo.');
      }

      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }

      if (!error.response) {
        throw new Error('Unable to connect to the VerifEye inspection server. Please check that the backend service is available.');
      }

      const status = error.response.status;

      if (status === 400) {
        throw new Error('Invalid image file uploaded. Please select a valid JPG, PNG, or WEBP label image.');
      } else if (status === 422) {
        throw new Error('The package image could not be processed by OCR. Please upload a clearer photograph.');
      } else if (status === 500) {
        throw new Error('Inspection pipeline encountered a processing error. Please retry or contact support.');
      }
    }

    throw new Error(error.message || 'An unexpected error occurred while analyzing the image.');
  }
};

export const fetchInspections = async (
  limit: number = 50,
  skip: number = 0,
  q?: string
): Promise<AnalyzeResponse[]> => {
  try {
    const params: Record<string, any> = { limit, skip };
    if (q && q.trim()) {
      params.q = q.trim();
    }
    const response = await client.get<AnalyzeResponse[]>('/inspections', {
      params,
    });
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch inspections history:', error);
    return [];
  }
};

export const fetchInspectionById = async (id: string): Promise<AnalyzeResponse | null> => {
  try {
    const response = await client.get<AnalyzeResponse>(`/inspections/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch inspection ${id}:`, error);
    return null;
  }
};

export const fetchBrandRepositories = async (q?: string): Promise<BrandRepository[]> => {
  try {
    const params: Record<string, any> = {};
    if (q && q.trim()) {
      params.q = q.trim();
    }
    const response = await client.get<BrandRepository[]>('/repositories', {
      params,
    });
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch brand repositories:', error);
    return [];
  }
};

export const fetchBrandRepositoryById = async (repoId: string): Promise<BrandRepository | null> => {
  try {
    const response = await client.get<BrandRepository>(`/repositories/${encodeURIComponent(repoId)}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch brand repository ${repoId}:`, error);
    return null;
  }
};

export const createBrandRepository = async (data: Partial<BrandRepository> & { initial_product?: any }): Promise<BrandRepository> => {
  try {
    const response = await client.post<BrandRepository>('/repositories', data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create brand repository:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create brand repository.');
  }
};

export const addInspectionToRepository = async (
  repoId: string,
  inspectionId: string,
  inspectionData?: any
): Promise<{ success: boolean; message: string; repository_id: string; brand_name: string }> => {
  try {
    const response = await client.post(`/repositories/${encodeURIComponent(repoId)}/inspections`, {
      inspection_id: inspectionId,
      inspection: inspectionData,
    });
    return response.data;
  } catch (error: any) {
    console.error(`Failed to add inspection to repository ${repoId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to link inspection to repository.');
  }
};


