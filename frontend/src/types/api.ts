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
  food_category: string | null;
  ingredients: string | null;
  preservatives: PreservativeItem[];
}

export interface PreservativeItem {
  name: string | null;
  canonical_name?: string | null;
  ins_number?: string | null;
  amount_mg_per_kg?: number | null;
  fssai_limit_mg_per_kg?: number | null;
  status?: string;
  is_banned_in_india?: boolean;
  banned_countries?: string[];
  health_concerns?: string | null;
  risk_flag?: boolean;
  description?: string | null;
  reason?: string;
  evidence?: EvidenceItem | null;
}

export interface PreservativeAnalysis {
  reference_version?: string;
  food_category?: string | null;
  preservatives_found: PreservativeItem[];
  flagged_preservatives: PreservativeItem[];
  limit_exceeded: PreservativeItem[];
  banned_preservatives: PreservativeItem[];
  has_flagged_preservative: boolean;
  has_banned_preservative: boolean;
  has_limit_exceeded: boolean;
  critical_alert?: string | null;
  requires_manual_review: boolean;
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
  preservative_analysis?: PreservativeAnalysis;
  readability?: any;
  meta?: InspectionMeta;
}

export interface HealthResponse {
  status: string;
  service: string;
}
