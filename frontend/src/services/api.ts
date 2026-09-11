import axios from 'axios';
import { AnalyzeResponse, HealthResponse, BrandRepository } from '../types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000, // 10 minutes timeout for dense/complex package label processing
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

// ADD — start
export const fetchDirectories = async (): Promise<string[]> => {
  try {
    const response = await client.get<{ directories: string[] }>('/directories');
    return response.data?.directories || [];
  } catch (error) {
    console.error('Failed to fetch directories:', error);
    return [];
  }
};

export const saveReportToDirectory = async (
  directory: string,
  report: Record<string, unknown>
): Promise<boolean> => {
  const response = await client.post<{ saved: boolean }>('/reports/save', { directory, report });
  return response.status === 200 && response.data?.saved === true;
};

export const saveReportWithFile = async (
  directory: string,
  report: Record<string, unknown>,
  pdfBlob: Blob,
  pdfFilename: string
): Promise<{ saved: boolean; directory: string; report: Record<string, unknown> }> => {  // CHANGED — return saved doc (has pdf_file_id) instead of just boolean
  const formData = new FormData();
  formData.append('directory', directory);
  formData.append('report', JSON.stringify(report));
  formData.append('file', pdfBlob, pdfFilename);

  const response = await client.post<{ saved: boolean; directory: string; report: Record<string, unknown> }>(
    '/reports/save-with-file',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const getReportPdfUrl = (fileId: string): string => `${API_BASE_URL}/reports/pdf/${fileId}`;
export const getImageUrl = (fileId: string): string => `${API_BASE_URL}/images/${fileId}`;

export interface SavedReportSummary {  // ADD
  report_id?: string;
  inspection_id?: string;
  filename?: string;
  status?: string;
  compliance_score?: number;
  pdf_file_id?: string;
  pdf_filename?: string;
  image_file_ids?: string[];
  image_urls?: string[];
  timestamp?: string;
  created_at?: string;
}

export const fetchReportsInDirectory = async (directory: string): Promise<SavedReportSummary[]> => {  // ADD
  try {
    const response = await client.get<{ directory: string; reports: SavedReportSummary[] }>(
      `/reports/${encodeURIComponent(directory)}`
    );
    return response.data?.reports || [];
  } catch (error) {
    console.error(`Failed to fetch reports in directory '${directory}':`, error);
    return [];
  }
};

export interface OfficerAuthResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    roleTitle: string;
    badgeId: string;
    jurisdiction: string;
    clearanceLevel: string;
    avatarColor?: string;
    badgeBg?: string;
    badgeBorder?: string;
    badgeText?: string;
    capabilities?: string[];
    token?: string;
  };
}

export const loginOfficer = async (credentials: {
  email: string;
  password: string;
}): Promise<OfficerAuthResponse> => {
  const response = await client.post<OfficerAuthResponse>('/auth/login', credentials);
  return response.data;
};

export const registerOfficer = async (data: {
  email: string;
  password: string;
  name: string;
  role?: string;
  badge_id?: string;
  jurisdiction?: string;
}): Promise<OfficerAuthResponse> => {
  const response = await client.post<OfficerAuthResponse>('/auth/register', data);
  return response.data;
};

export const fetchRegisteredOfficers = async (): Promise<any[]> => {
  try {
    const response = await client.get<{ success: boolean; officers: any[] }>('/auth/officers');
    return response.data?.officers || [];
  } catch (err) {
    console.error('Failed to fetch registered officers:', err);
    return [];
  }
};
// ADD — end