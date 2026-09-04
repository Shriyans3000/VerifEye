export interface EvidenceItem {
  ocr_id: number;
  image_index?: number;
  text: string;
  confidence: number;
  bbox: number[];
}

export interface ConsumerCare {
  phone: string | null;
  email: string | null;
}

export interface ProductInformation {
  product_name: string | null;
  manufacturer: string | null;
  manufacturer_address: string | null;
  country_of_origin: string | null;
  mrp: string | null;
  net_quantity: string | null;
  unit_sale_price: string | null;
  packed_date: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  use_by_date: string | null;
  best_before: string | null;
  batch_number: string | null;
  consumer_care: ConsumerCare | null;
  tax_inclusive_mrp: boolean | null;
  fssai_number: string | null;
  dimensions: string | null;
}

export interface CheckItem {
  rule_name: string;
  field?: string;
  status: 'PASS' | 'FAIL' | 'REVIEW' | 'MISSING';
  severity: 'none' | 'info' | 'medium' | 'high';
  extracted_value: any;
  reason: string;
  evidence: EvidenceItem[];
}

export interface ValidationItem {
  rule_name: string;
  field?: string;
  status: 'PASS' | 'FAIL' | 'REVIEW';
  severity: 'none' | 'info' | 'medium' | 'high';
  extracted_value: any;
  reason: string;
  evidence: EvidenceItem[];
}

export interface InspectionSummary {
  total_checks: number;
  passed: number;
  failed: number;
  review_required: number;
}

export interface InspectionMeta {
  regions_detected: number;
  timestamp: string;
}

export interface AnalyzeResponse {
  inspection_id?: string;
  filename?: string;
  timestamp?: string;
  success: boolean;
  status: string; // 'PASS' | 'FAIL' | 'NON_COMPLIANT' | 'REVIEW_REQUIRED'
  compliance_score: number;
  summary: InspectionSummary;
  product: ProductInformation;
  checks: CheckItem[];
  validation_checks: ValidationItem[];
  meta?: InspectionMeta;
}

export interface HealthResponse {
  status: string;
  service: string;
}
