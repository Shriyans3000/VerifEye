export interface RepositoryProductInspection {
  inspection_id: string;
  timestamp: string;
  officer_name: string;
  badge_id: string;
  status: 'PASS' | 'NON_COMPLIANT' | 'REVIEW_REQUIRED';
  compliance_score: number;
  filename: string;
  images?: string[];
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
    review_required: number;
  };
  product: {
    product_name: string;
    manufacturer: string;
    manufacturer_address: string;
    country_of_origin: string;
    mrp: string;
    net_quantity: string;
    unit_sale_price: string;
    packed_date: string;
    manufacturing_date: string | null;
    expiry_date: string | null;
    use_by_date: string | null;
    best_before: string;
    batch_number: string;
    consumer_care: {
      phone: string;
      email: string;
    };
    tax_inclusive_mrp: boolean;
    fssai_number: string;
    dimensions: string | null;
  };
  checks: Array<{
    rule_name: string;
    field?: string;
    status: 'PASS' | 'FAIL' | 'REVIEW' | 'MISSING';
    severity: 'none' | 'info' | 'medium' | 'high';
    extracted_value: any;
    reason: string;
    evidence: any[];
  }>;
  validation_checks: Array<{
    rule_name: string;
    status: 'PASS' | 'FAIL' | 'REVIEW';
    severity: 'none' | 'info' | 'medium' | 'high';
    extracted_value: any;
    reason: string;
    evidence: any[];
  }>;
  readability?: {
    summary: {
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
    };
    regions: any[];
  };
}

export interface RepositoryProduct {
  id: string;
  name: string;
  category: string;
  netQuantity: string;
  mrp: string;
  fssaiNumber: string;
  inspections: RepositoryProductInspection[];
}

export interface RepositoryBrand {
  id: string;
  name: string;
  manufacturer: string;
  headquarters: string;
  fssaiLicense: string;
  category: string;
  totalInspections: number;
  complianceRate: number; // e.g. 92%
  products: RepositoryProduct[];
}

export const MOCK_REPOSITORY_DATA: RepositoryBrand[] = [
  {
    id: 'parle',
    name: 'Parle Products',
    manufacturer: 'Parle Products Pvt. Ltd.',
    headquarters: 'Vile Parle East, Mumbai, Maharashtra 400057',
    fssaiLicense: '10013022002253',
    category: 'Biscuits & Confectionery',
    totalInspections: 8,
    complianceRate: 91.5,
    products: [
      {
        id: 'parle-g-gluco-800g',
        name: 'Parle-G Original Gluco Biscuits',
        category: 'Biscuits',
        netQuantity: '800 g',
        mrp: '₹80.00',
        fssaiNumber: '10013022002253',
        inspections: [
          {
            inspection_id: 'insp_parle_001',
            timestamp: '2026-08-28T10:15:00Z',
            officer_name: 'Inspector Rajesh Kumar',
            badge_id: 'LM-DEL-8921',
            status: 'PASS',
            compliance_score: 96.0,
            filename: 'parle_g_front_back.png',
            summary: {
              total_checks: 12,
              passed: 11,
              failed: 0,
              review_required: 1,
            },
            product: {
              product_name: 'Parle-G Gluco Biscuits',
              manufacturer: 'Parle Products Pvt. Ltd.',
              manufacturer_address: 'North Level Crossing, Vile Parle East, Mumbai 400057',
              country_of_origin: 'India',
              mrp: '80.00',
              net_quantity: '800 g',
              unit_sale_price: '₹0.10 per g',
              packed_date: '2026-07-20',
              manufacturing_date: '2026-07-20',
              expiry_date: null,
              use_by_date: null,
              best_before: '6 months from packaging',
              batch_number: 'KR29CB',
              consumer_care: {
                phone: '1800222012',
                email: 'consumercare@parle.biz',
              },
              tax_inclusive_mrp: true,
              fssai_number: '10013022002253',
              dimensions: null,
            },
            checks: [
              {
                rule_name: 'MRP & Taxes Declaration',
                field: 'mrp',
                status: 'PASS',
                severity: 'none',
                extracted_value: '80.00 (Incl. of all taxes)',
                reason: 'Standard price clearly declared with tax inclusivity affirmation.',
                evidence: [{ ocr_id: 1, text: 'MRP Rs. 80.00 INCL. OF ALL TAXES', confidence: 0.98, bbox: [20, 40, 180, 60] }],
              },
              {
                rule_name: 'Net Quantity Declaration',
                field: 'net_quantity',
                status: 'PASS',
                severity: 'none',
                extracted_value: '800 g',
                reason: 'Standard metric unit (g) declared unambiguously.',
                evidence: [{ ocr_id: 2, text: 'Net Qty: 800 g', confidence: 0.99, bbox: [20, 70, 150, 90] }],
              },
              {
                rule_name: 'Unit Sale Price (USP)',
                field: 'unit_sale_price',
                status: 'PASS',
                severity: 'none',
                extracted_value: '₹0.10 / g',
                reason: 'Declared pursuant to Rule 6(11) for packages > 200g.',
                evidence: [{ ocr_id: 3, text: 'USP Rs. 0.10 / g', confidence: 0.95, bbox: [20, 100, 160, 120] }],
              },
              {
                rule_name: 'Manufacturer & Packer Address',
                field: 'manufacturer_address',
                status: 'PASS',
                severity: 'none',
                extracted_value: 'Vile Parle East, Mumbai 400057',
                reason: 'Full postal address and state/PIN declared.',
                evidence: [{ ocr_id: 4, text: 'Parle Products Pvt Ltd, Vile Parle East, Mumbai 400057', confidence: 0.94, bbox: [20, 130, 300, 150] }],
              },
              {
                rule_name: 'Country of Origin',
                field: 'country_of_origin',
                status: 'PASS',
                severity: 'none',
                extracted_value: 'India',
                reason: 'Product of India declared on primary panel.',
                evidence: [{ ocr_id: 5, text: 'Made in India', confidence: 0.99, bbox: [20, 160, 140, 180] }],
              },
              {
                rule_name: 'Manufacture / Pack Date',
                field: 'packed_date',
                status: 'PASS',
                severity: 'none',
                extracted_value: '2026-07-20',
                reason: 'Month and year of manufacture/packaging present.',
                evidence: [{ ocr_id: 6, text: 'PKD. 20/07/2026', confidence: 0.92, bbox: [20, 190, 170, 210] }],
              },
              {
                rule_name: 'Best Before / Expiry Date',
                field: 'best_before',
                status: 'PASS',
                severity: 'none',
                extracted_value: '6 months from packaging',
                reason: 'Standard shelf life declared.',
                evidence: [{ ocr_id: 7, text: 'BEST BEFORE 6 MONTHS FROM PKG', confidence: 0.93, bbox: [20, 220, 280, 240] }],
              },
              {
                rule_name: 'Lot / Batch Number',
                field: 'batch_number',
                status: 'PASS',
                severity: 'none',
                extracted_value: 'KR29CB',
                reason: 'Batch identification code present on crimp seal.',
                evidence: [{ ocr_id: 8, text: 'BATCH: KR29CB', confidence: 0.91, bbox: [20, 250, 160, 270] }],
              },
              {
                rule_name: 'Consumer Care Details',
                field: 'consumer_care',
                status: 'PASS',
                severity: 'none',
                extracted_value: '1800222012 / consumercare@parle.biz',
                reason: 'Toll-free phone number and official support email provided.',
                evidence: [{ ocr_id: 9, text: 'Consumer Care: 1800-222-012, consumercare@parle.biz', confidence: 0.96, bbox: [20, 280, 350, 300] }],
              },
              {
                rule_name: 'FSSAI License Registration',
                field: 'fssai_number',
                status: 'PASS',
                severity: 'none',
                extracted_value: '10013022002253',
                reason: 'Valid 14-digit FSSAI central license number.',
                evidence: [{ ocr_id: 10, text: 'Lic. No. 10013022002253', confidence: 0.97, bbox: [20, 310, 210, 330] }],
              },
              {
                rule_name: 'Generic Product Name',
                field: 'product_name',
                status: 'PASS',
                severity: 'none',
                extracted_value: 'Biscuits',
                reason: 'Generic descriptor prominently displayed on principal display panel.',
                evidence: [{ ocr_id: 11, text: 'GLUCO BISCUITS', confidence: 0.99, bbox: [20, 340, 180, 360] }],
              },
              {
                rule_name: 'Dimensions (if applicable)',
                field: 'dimensions',
                status: 'REVIEW',
                severity: 'info',
                extracted_value: null,
                reason: 'Dimensions optional for volumetric weight-packed commodities.',
                evidence: [],
              },
            ],
            validation_checks: [],
            readability: {
              summary: {
                overall_status: 'PASS',
                total_regions: 11,
                readable_count: 10,
                review_count: 1,
                small_text_count: 1,
                low_contrast_count: 0,
                blurry_count: 0,
                low_confidence_count: 0,
                average_text_height_px: 24.5,
                smallest_detected_text_px: 13,
                average_confidence: 0.952,
                physical_font_size: {
                  status: 'NOT CALIBRATED',
                  reason: 'Image does not contain a physical scale reference. Statutory physical font size in millimetres cannot be determined without physical calibration.',
                },
              },
              regions: [],
            },
          },
          {
            inspection_id: 'insp_parle_002',
            timestamp: '2026-06-12T14:30:00Z',
            officer_name: 'Dy. Controller Meenakshi Sundaram',
            badge_id: 'LM-HQ-4412',
            status: 'PASS',
            compliance_score: 94.0,
            filename: 'parle_g_batch_june.png',
            summary: {
              total_checks: 12,
              passed: 11,
              failed: 0,
              review_required: 1,
            },
            product: {
              product_name: 'Parle-G Gluco Biscuits',
              manufacturer: 'Parle Products Pvt. Ltd.',
              manufacturer_address: 'North Level Crossing, Vile Parle East, Mumbai 400057',
              country_of_origin: 'India',
              mrp: '80.00',
              net_quantity: '800 g',
              unit_sale_price: '₹0.10 per g',
              packed_date: '2026-05-18',
              manufacturing_date: '2026-05-18',
              expiry_date: null,
              use_by_date: null,
              best_before: '6 months',
              batch_number: 'JN18A1',
              consumer_care: {
                phone: '1800222012',
                email: 'consumercare@parle.biz',
              },
              tax_inclusive_mrp: true,
              fssai_number: '10013022002253',
              dimensions: null,
            },
            checks: [],
            validation_checks: [],
          },
        ],
      },
    ],
  },
  {
    id: 'balaji',
    name: 'Balaji Wafers',
    manufacturer: 'Balaji Wafers Pvt. Ltd.',
    headquarters: 'Vajdi (Vad), Kalawad Road, Rajkot, Gujarat 360005',
    fssaiLicense: '10012021000063',
    category: 'Snacks & Savouries',
    totalInspections: 6,
    complianceRate: 88.0,
    products: [
      {
        id: 'balaji-masala-wafers-65g',
        name: 'Balaji Masala Wafers',
        category: 'Potato Chips',
        netQuantity: '65 g',
        mrp: '₹20.00',
        fssaiNumber: '10012021000063',
        inspections: [
          {
            inspection_id: 'insp_balaji_001',
            timestamp: '2026-08-14T09:40:00Z',
            officer_name: 'Inspector Rajesh Kumar',
            badge_id: 'LM-DEL-8921',
            status: 'PASS',
            compliance_score: 91.0,
            filename: 'balaji_masala_65g.png',
            summary: {
              total_checks: 12,
              passed: 10,
              failed: 0,
              review_required: 2,
            },
            product: {
              product_name: 'Balaji Masala Wafers Potato Chips',
              manufacturer: 'Balaji Wafers Pvt. Ltd.',
              manufacturer_address: 'Survey No. 19, Kalawad Road, Vajdi (Vad), Rajkot 360005, Gujarat',
              country_of_origin: 'India',
              mrp: '20.00',
              net_quantity: '65 g',
              unit_sale_price: '₹0.31 per g',
              packed_date: '2026-07-28',
              manufacturing_date: '2026-07-28',
              expiry_date: null,
              use_by_date: null,
              best_before: '4 months from packaging',
              batch_number: 'BW-MAS-492',
              consumer_care: {
                phone: '02812783701',
                email: 'feedback@balajiwafers.com',
              },
              tax_inclusive_mrp: true,
              fssai_number: '10012021000063',
              dimensions: null,
            },
            checks: [],
            validation_checks: [],
          },
        ],
      },
    ],
  },
  {
    id: 'lays',
    name: "Lay's (PepsiCo)",
    manufacturer: 'PepsiCo India Holdings Pvt. Ltd.',
    headquarters: 'Sector 32, Gurugram, Haryana 122001',
    fssaiLicense: '10014064000435',
    category: 'Snacks & Savouries',
    totalInspections: 12,
    complianceRate: 95.0,
    products: [
      {
        id: 'lays-classic-salted-50g',
        name: "Lay's Classic Salted Potato Chips",
        category: 'Potato Chips',
        netQuantity: '50 g',
        mrp: '₹20.00',
        fssaiNumber: '10014064000435',
        inspections: [
          {
            inspection_id: 'insp_lays_001',
            timestamp: '2026-08-30T16:20:00Z',
            officer_name: 'Inspector Rajesh Kumar',
            badge_id: 'LM-DEL-8921',
            status: 'PASS',
            compliance_score: 98.0,
            filename: 'lays_classic_salted.jpg',
            summary: {
              total_checks: 12,
              passed: 12,
              failed: 0,
              review_required: 0,
            },
            product: {
              product_name: "Lay's Potato Chips Classic Salted",
              manufacturer: 'PepsiCo India Holdings Pvt. Ltd.',
              manufacturer_address: 'Level 3-6, Pioneer Square, Sector 62, Golf Course Ext Rd, Gurugram 122101',
              country_of_origin: 'India',
              mrp: '20.00',
              net_quantity: '50 g',
              unit_sale_price: '₹0.40 per g',
              packed_date: '2026-08-01',
              manufacturing_date: '2026-08-01',
              expiry_date: null,
              use_by_date: null,
              best_before: '4 months',
              batch_number: 'LK9032',
              consumer_care: {
                phone: '1800224020',
                email: 'consumer.feedback@pepsico.com',
              },
              tax_inclusive_mrp: true,
              fssai_number: '10014064000435',
              dimensions: null,
            },
            checks: [],
            validation_checks: [],
          },
        ],
      },
      {
        id: 'lays-india-magic-masala-90g',
        name: "Lay's India's Magic Masala",
        category: 'Potato Chips',
        netQuantity: '90 g',
        mrp: '₹40.00',
        fssaiNumber: '10014064000435',
        inspections: [
          {
            inspection_id: 'insp_lays_002',
            timestamp: '2026-07-15T11:05:00Z',
            officer_name: 'Dy. Controller Meenakshi Sundaram',
            badge_id: 'LM-HQ-4412',
            status: 'PASS',
            compliance_score: 95.0,
            filename: 'lays_magic_masala_front.jpg',
            summary: {
              total_checks: 12,
              passed: 11,
              failed: 0,
              review_required: 1,
            },
            product: {
              product_name: "Lay's India's Magic Masala",
              manufacturer: 'PepsiCo India Holdings Pvt. Ltd.',
              manufacturer_address: 'Level 3-6, Pioneer Square, Sector 62, Gurugram 122101',
              country_of_origin: 'India',
              mrp: '40.00',
              net_quantity: '90 g',
              unit_sale_price: '₹0.44 per g',
              packed_date: '2026-06-25',
              manufacturing_date: '2026-06-25',
              expiry_date: null,
              use_by_date: null,
              best_before: '4 months',
              batch_number: 'MM1104',
              consumer_care: {
                phone: '1800224020',
                email: 'consumer.feedback@pepsico.com',
              },
              tax_inclusive_mrp: true,
              fssai_number: '10014064000435',
              dimensions: null,
            },
            checks: [],
            validation_checks: [],
          },
        ],
      },
    ],
  },
  {
    id: 'britannia',
    name: 'Britannia Industries',
    manufacturer: 'Britannia Industries Ltd.',
    headquarters: '5/1A Hungerford Street, Kolkata, West Bengal 700017',
    fssaiLicense: '10015043001129',
    category: 'Bakery & Dairy',
    totalInspections: 9,
    complianceRate: 92.0,
    products: [
      {
        id: 'britannia-good-day-butter-200g',
        name: 'Britannia Good Day Butter Cookies',
        category: 'Cookies',
        netQuantity: '200 g',
        mrp: '₹45.00',
        fssaiNumber: '10015043001129',
        inspections: [
          {
            inspection_id: 'insp_brit_001',
            timestamp: '2026-08-19T13:45:00Z',
            officer_name: 'Inspector Rajesh Kumar',
            badge_id: 'LM-DEL-8921',
            status: 'PASS',
            compliance_score: 93.0,
            filename: 'good_day_butter.png',
            summary: {
              total_checks: 12,
              passed: 11,
              failed: 0,
              review_required: 1,
            },
            product: {
              product_name: 'Good Day Butter Cookies',
              manufacturer: 'Britannia Industries Ltd.',
              manufacturer_address: 'Prestige Shantiniketan, Whitefield, Bengaluru, Karnataka 560048',
              country_of_origin: 'India',
              mrp: '45.00',
              net_quantity: '200 g',
              unit_sale_price: '₹0.225 per g',
              packed_date: '2026-08-05',
              manufacturing_date: '2026-08-05',
              expiry_date: null,
              use_by_date: null,
              best_before: '6 months',
              batch_number: 'GD-B-998',
              consumer_care: {
                phone: '18004254449',
                email: 'feedback@britindia.com',
              },
              tax_inclusive_mrp: true,
              fssai_number: '10015043001129',
              dimensions: null,
            },
            checks: [],
            validation_checks: [],
          },
        ],
      },
    ],
  },
  {
    id: 'haldirams',
    name: "Haldiram's",
    manufacturer: 'Haldiram Snacks Pvt. Ltd.',
    headquarters: 'B-1/H-8, Mohan Co-op Industrial Estate, Mathura Road, New Delhi 110044',
    fssaiLicense: '10012011000676',
    category: 'Namkeen & Sweets',
    totalInspections: 7,
    complianceRate: 85.7,
    products: [
      {
        id: 'haldirams-aloo-bhujia-200g',
        name: "Haldiram's Aloo Bhujia",
        category: 'Namkeen',
        netQuantity: '200 g',
        mrp: '₹55.00',
        fssaiNumber: '10012011000676',
        inspections: [
          {
            inspection_id: 'insp_hald_001',
            timestamp: '2026-08-05T15:10:00Z',
            officer_name: 'Dy. Controller Meenakshi Sundaram',
            badge_id: 'LM-HQ-4412',
            status: 'REVIEW_REQUIRED',
            compliance_score: 75.0,
            filename: 'haldirams_aloo_bhujia.jpg',
            summary: {
              total_checks: 12,
              passed: 9,
              failed: 1,
              review_required: 2,
            },
            product: {
              product_name: "Haldiram's Nagpur Aloo Bhujia",
              manufacturer: 'Haldiram Snacks Pvt. Ltd.',
              manufacturer_address: 'B-1/H-8 Mohan Co-operative Ind. Area, New Delhi 110044',
              country_of_origin: 'India',
              mrp: '55.00',
              net_quantity: '200 g',
              unit_sale_price: '',
              packed_date: '2026-07-02',
              manufacturing_date: '2026-07-02',
              expiry_date: null,
              use_by_date: null,
              best_before: '5 months',
              batch_number: 'AB8041',
              consumer_care: {
                phone: '01147200000',
                email: 'support@haldiram.com',
              },
              tax_inclusive_mrp: true,
              fssai_number: '10012011000676',
              dimensions: null,
            },
            checks: [],
            validation_checks: [],
          },
        ],
      },
    ],
  },
  {
    id: 'amul',
    name: 'Amul (GCMMF)',
    manufacturer: 'Gujarat Cooperative Milk Marketing Federation Ltd.',
    headquarters: 'Amul Dairy Road, Anand, Gujarat 388001',
    fssaiLicense: '10012021000071',
    category: 'Dairy Products',
    totalInspections: 10,
    complianceRate: 98.0,
    products: [
      {
        id: 'amul-taaza-toned-milk-1l',
        name: 'Amul Taaza Homogenised Toned Milk',
        category: 'Milk & Dairy',
        netQuantity: '1 L',
        mrp: '₹72.00',
        fssaiNumber: '10012021000071',
        inspections: [
          {
            inspection_id: 'insp_amul_001',
            timestamp: '2026-08-25T08:30:00Z',
            officer_name: 'Inspector Rajesh Kumar',
            badge_id: 'LM-DEL-8921',
            status: 'PASS',
            compliance_score: 97.0,
            filename: 'amul_taaza_1l.png',
            summary: {
              total_checks: 12,
              passed: 12,
              failed: 0,
              review_required: 0,
            },
            product: {
              product_name: 'Amul Taaza Homogenised Toned Milk (UHT Treated)',
              manufacturer: 'GCMMF Ltd.',
              manufacturer_address: 'Amul Dairy Road, Anand 388001, Gujarat, India',
              country_of_origin: 'India',
              mrp: '72.00',
              net_quantity: '1 L',
              unit_sale_price: '₹72.00 per L',
              packed_date: '2026-08-10',
              manufacturing_date: '2026-08-10',
              expiry_date: '2027-02-10',
              use_by_date: null,
              best_before: '180 days',
              batch_number: 'TZ2209A',
              consumer_care: {
                phone: '18002583333',
                email: 'customercare@amul.coop',
              },
              tax_inclusive_mrp: true,
              fssai_number: '10012021000071',
              dimensions: null,
            },
            checks: [],
            validation_checks: [],
          },
        ],
      },
    ],
  },
];
