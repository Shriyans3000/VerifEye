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
  declared_quantity?: string | null;
  calculated_total_quantity?: string | null;
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

export interface ReadabilityRegion {
  ocr_id: number;
  image_index: number;
  text: string;
  confidence: number;
  bbox: any;
  height_px: number;
  width_px: number;
  normalized_height_pct: number;
  area_px: number;
  contrast: number;
  contrast_rating: string;
  sharpness: number;
  sharpness_rating: string;
  readability_status: string;
  reason: string;
}

export interface ReadabilitySummary {
  overall_status: string;
  total_regions: number;
  readable_count: number;
  review_count: number;
  small_text_count: number;
  low_contrast_count: number;
  blurry_count: number;
  low_confidence_count: number;
  average_text_height_px: number;
  smallest_detected_text_px: number;
  average_confidence: number;
  physical_font_size: {
    status: string;
    reason: string;
  };
}

export interface ReadabilityData {
  summary: ReadabilitySummary;
  regions: ReadabilityRegion[];
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
  readability?: ReadabilityData;
  meta?: InspectionMeta;
}

export interface HealthResponse {
  status: string;
  service: string;
}
