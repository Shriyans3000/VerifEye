import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FlaskConical,
  AlertTriangle,
  ShieldCheck,
  Ban,
  Globe,
  Search,
  CheckCircle2,
  Info,
  Leaf,
  HeartPulse,
} from 'lucide-react';

interface PreservativeDetail {
  id: string;
  name: string;
  insNumber: string;
  category:
    | 'banned_india'
    | 'globally_restricted'
    | 'synthetic_antioxidant'
    | 'antimicrobial'
    | 'curing_agent'
    | 'acidity_regulator'
    | 'flavour_enhancer'
    | 'functional_additive';
  functionalPurpose: string;
  fssaiLimit: string;
  status: 'BANNED_IN_INDIA' | 'GLOBALLY_RESTRICTED' | 'PERMITTED_WITH_LIMITS';
  bannedIn: string[];
  healthHazards: string;
  commonFoods: string[];
  cleanAlternatives: string;
  statutoryReference: string;
}

const PRESERVATIVE_CATALOG: PreservativeDetail[] = [
  {
    id: 'potassium-bromate',
    name: 'Potassium Bromate',
    insNumber: 'INS 924a',
    category: 'banned_india',
    functionalPurpose: 'Chemical oxidizing agent and dough conditioner used to artificially accelerate gluten development and enhance bread loaf volume.',
    fssaiLimit: '0 mg/kg — Completely BANNED in India',
    status: 'BANNED_IN_INDIA',
    bannedIn: [
      'India (Banned June 2016 by FSSAI)',
      'European Union',
      'United Kingdom',
      'Canada',
      'Brazil',
      'China',
      'Australia & New Zealand',
      'Sri Lanka',
      'Nigeria',
    ],
    healthHazards: 'Classified as an IARC Group 2B probable human carcinogen. Animal bioassays prove induction of renal cell tumors, thyroid follicular adenomas, and peritoneal mesotheliomas.',
    commonFoods: ['Commercial sliced bread', 'Pav', 'Burger buns', 'Pizza bases', 'Flour conditioners'],
    cleanAlternatives: 'Ascorbic acid (Vitamin C / INS 300), fungal alpha-amylase enzyme, natural sourdough fermentation.',
    statutoryReference: 'FSSAI Notification No. P.15025/264/13-PA/FSSAI (June 20, 2016)',
  },
  {
    id: 'potassium-iodate',
    name: 'Potassium Iodate',
    insNumber: 'INS 917',
    category: 'banned_india',
    functionalPurpose: 'Flour treatment bleaching and strengthening agent.',
    fssaiLimit: '0 mg/kg — Completely BANNED in India as flour treatment agent',
    status: 'BANNED_IN_INDIA',
    bannedIn: ['India (Banned by FSSAI)', 'European Union', 'Australia', 'New Zealand'],
    healthHazards: 'Excessive iodine intake disrupts thyroid hormone synthesis, causing hyperthyroidism and autoimmune thyroiditis.',
    commonFoods: ['Bakery flours', 'Industrial dough mixes'],
    cleanAlternatives: 'Non-iodated food-grade enzymes or mechanical high-speed mixing.',
    statutoryReference: 'FSSAI Direction under Section 16(5) Food Safety and Standards Act, 2006',
  },
  {
    id: 'brominated-vegetable-oil',
    name: 'Brominated Vegetable Oil (BVO)',
    insNumber: 'INS 443',
    category: 'banned_india',
    functionalPurpose: 'Weighting and emulsifying agent used in citrus fruit drinks to prevent essential citrus oils from separating and floating to the surface.',
    fssaiLimit: '0 mg/kg — BANNED in India',
    status: 'BANNED_IN_INDIA',
    bannedIn: [
      'India (Prohibited by FSSAI)',
      'European Union',
      'United Kingdom',
      'Japan',
      'United States (FDA Final Ban effective 2024)',
    ],
    healthHazards: 'Bromine bioaccumulates in human fat tissue and brain cells. Chronic consumption is linked to neurobehavioral toxicity, memory loss, ataxia, and thyroid dysfunction.',
    commonFoods: ['Citrus flavored sodas', 'Mountain-style fizzy drinks', 'Sports drinks'],
    cleanAlternatives: 'Glycerol ester of wood rosin (ester gum / INS 445) or sucrose acetate isobutyrate (SAIB / INS 444).',
    statutoryReference: 'FSSAI Food Additives Regulations, Regulation 3.1.8',
  },
  {
    id: 'formaldehyde-formalin',
    name: 'Formaldehyde / Formalin',
    insNumber: 'Industrial',
    category: 'banned_india',
    functionalPurpose: 'Industrial antiseptic illegally sprayed on raw fish, prawns, and poultry to retard decomposition during transport.',
    fssaiLimit: '0 mg/kg — Strictly ILLEGAL in Food',
    status: 'BANNED_IN_INDIA',
    bannedIn: ['India (Zero Tolerance by FSSAI & CIFT)', 'USA (FDA)', 'European Union', 'Worldwide'],
    healthHazards: 'IARC Group 1 proven human carcinogen. Causes acute gastric mucosal corrosion, irreversible liver/renal failure, and respiratory tract malignancies.',
    commonFoods: ['Illegally adulterated wet fish', 'Prawns', 'Squid', 'Unregulated slaughter meat'],
    cleanAlternatives: 'Strict cold-chain logistics, chilled insulated slurry ice, blast freezing at -18°C.',
    statutoryReference: 'FSSAI Guidance Note on Formaldehyde Adulteration in Fish',
  },
  {
    id: 'boric-acid-borax',
    name: 'Boric Acid & Borax',
    insNumber: 'INS 284 / 285',
    category: 'banned_india',
    functionalPurpose: 'Unapproved chemical firming agent and preservative illegally applied to starch noodles, caviar, and milk products.',
    fssaiLimit: '0 mg/kg — BANNED in India',
    status: 'BANNED_IN_INDIA',
    bannedIn: ['India (Banned by FSSAI)', 'USA (FDA Banned in food)', 'European Union'],
    healthHazards: 'Reproductive and developmental toxicant. Causes gonadal atrophy, renal tubular necrosis, and systemic poisoning.',
    commonFoods: ['Illegally treated noodles', 'Adulterated dairy products'],
    cleanAlternatives: 'Natural starches, food-grade calcium chloride (INS 509).',
    statutoryReference: 'FSSAI Prohibited Substances Regulations, Schedule II',
  },
  {
    id: 'tbhq',
    name: 'TBHQ (Tertiary Butylhydroquinone)',
    insNumber: 'INS 319',
    category: 'synthetic_antioxidant',
    functionalPurpose: 'Synthetic aromatic phenolic antioxidant preventing oxidative rancidity in edible vegetable oils, namkeens, and fried snack foods.',
    fssaiLimit: '200 mg/kg (ppm) in edible oils and fats',
    status: 'GLOBALLY_RESTRICTED',
    bannedIn: [
      'Japan (Completely BANNED for use in all food products)',
      'European Union (Banned in various food categories; strictly restricted to 200 ppm in fats)',
    ],
    healthHazards: 'Precursors to gastric tumors observed in high-dose animal tests. Associated with immunological cellular dysfunction and allergic dermatosis.',
    commonFoods: ['Packaged potato chips', 'Namkeen & bhujia', 'Instant noodles', 'Biscuits & crackers', 'Deep frying oils'],
    cleanAlternatives: 'Mixed Tocopherols (Vitamin E / INS 306), Rosemary Extract (INS 392), Ascorbyl Palmitate (INS 304).',
    statutoryReference: 'FSSAI Food Additives Schedule, Appendix A, Table 3',
  },
  {
    id: 'propylparaben',
    name: 'Propylparaben / Sodium Propyl p-Hydroxybenzoate',
    insNumber: 'INS 216 / 217',
    category: 'globally_restricted',
    functionalPurpose: 'Synthetic antimicrobial paraben inhibiting bacteria and fungal growth in confections and syrup coatings.',
    fssaiLimit: '0 mg/kg (Prohibited in general food items; review required)',
    status: 'GLOBALLY_RESTRICTED',
    bannedIn: [
      'European Union (Banned in food by EFSA since 2006)',
      'United Kingdom (Banned as food additive)',
      'United States (California AB 418 Food Safety Act)',
    ],
    healthHazards: 'Proven endocrine-disrupting compound. Mimics human estrogen, accelerating breast cancer cell proliferation and lowering sperm counts.',
    commonFoods: ['Processed baked confections', 'Flavored syrups', 'Artificial food coloring solutions'],
    cleanAlternatives: 'Potassium sorbate (INS 202), cold aseptic packing, citric acid.',
    statutoryReference: 'EFSA Scientific Opinion on Parabens in Food (2006) / California AB 418',
  },
  {
    id: 'bha-bht',
    name: 'BHA & BHT (Butylated Hydroxyanisole & Hydroxytoluene)',
    insNumber: 'INS 320 / 321',
    category: 'synthetic_antioxidant',
    functionalPurpose: 'Synthetic phenolic antioxidants added to dry cereals, butter, dehydrated meats, and chewing gum to delay autoxidation of fats.',
    fssaiLimit: '200 mg/kg (ppm) individually or combined in fats',
    status: 'GLOBALLY_RESTRICTED',
    bannedIn: [
      'Japan (BANNED in foods)',
      'European Union (Banned in baby and infant foods)',
      'United Kingdom (Prohibited in infant formulations)',
      'USA (BHA listed on California Prop 65 Carcinogen Watchlist)',
    ],
    healthHazards: 'Interferes with endocrine hormones (thyroid & estrogen). Long-term rodent studies demonstrated forestomach hyperplasia and papillomas.',
    commonFoods: ['Packaged breakfast cereals', 'Chewing gum', 'Dehydrated meat snacks', 'Lard & shortening'],
    cleanAlternatives: 'Rosemary extract, green tea polyphenols, Nitrogen-flushed packaging.',
    statutoryReference: 'FSSAI Food Products Standards & Food Additives Regulations, 2011',
  },
  {
    id: 'sodium-benzoate',
    name: 'Sodium Benzoate / Benzoic Acid',
    insNumber: 'INS 211 / 210',
    category: 'antimicrobial',
    functionalPurpose: 'Class II chemical preservative inhibiting yeast, mold, and bacterial fermentation in acidic foods and beverages.',
    fssaiLimit: '600 – 750 mg/kg depending on product (Fruit juices: 600 ppm, Sauces: 750 ppm)',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: [
      'European Union (Restricted; strictly controlled when combined with Vitamin C/Ascorbic Acid)',
      'Japan (Restricted in natural health beverages)',
      'Prohibited in certified Organic foods worldwide',
    ],
    healthHazards: 'CRITICAL BENZENE HAZARD: In acidic drinks containing Vitamin C (Ascorbic Acid / INS 300), heat and light cause them to chemically react and form Benzene, a confirmed human leukemia carcinogen. Linked to childhood hyperactivity (Southampton Study).',
    commonFoods: ['Tomato ketchup & sauces', 'Carbonated soft drinks', 'Fruit squashes & cordials', 'Pickles & chutneys'],
    cleanAlternatives: 'Hot-fill pasteurization, high-pressure processing (HPP), potassium sorbate.',
    statutoryReference: 'FSSAI Regulations Table 2, Class II Preservative Limits',
  },
  {
    id: 'sulphur-dioxide-sulphites',
    name: 'Sulphur Dioxide & Sulphites',
    insNumber: 'INS 220 / 223 / 224',
    category: 'curing_agent',
    functionalPurpose: 'Antimicrobial agent and enzymatic browning inhibitor preserving the bright golden appearance of dried fruits and wines.',
    fssaiLimit: '50 – 2,000 mg/kg (Dried apricots: up to 2000 ppm; RTS beverages: 70 ppm). Must declare presence if > 10 ppm.',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: [
      'United States (FDA banned on fresh salad bars and raw produce since 1986 due to fatal asthma attacks)',
      'European Union (Banned in fresh minced meats)',
      'Australia & New Zealand (Prohibited on fresh unprocessed meats)',
    ],
    healthHazards: 'Potent acute respiratory allergen. Ingestion can trigger sudden, life-threatening asthmatic bronchospasms, anaphylaxis, and hives in sensitive individuals.',
    commonFoods: ['Dried apricots & raisins', 'Packaged wine', 'Fruit syrups', 'Pickled cocktail onions'],
    cleanAlternatives: 'Citric acid, vacuum drying, sun-drying without sulphur bleaching.',
    statutoryReference: 'FSSAI Packaging and Labelling Regulations (Mandatory Allergen Declaration)',
  },
  {
    id: 'sodium-nitrite-nitrate',
    name: 'Sodium Nitrite & Sodium Nitrate',
    insNumber: 'INS 250 / 251',
    category: 'curing_agent',
    functionalPurpose: 'Curing preservative preventing the growth of deadly neurotoxin-producing Clostridium botulinum bacteria while imparting pink color to processed meats.',
    fssaiLimit: '100 mg/kg (ppm) calculated as Sodium Nitrite',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: [
      'Denmark (Stricter national ceiling of 60 ppm enforced due to cancer risk)',
      'European Union (Strictly reduced ceilings to minimize nitrosamine formation)',
    ],
    healthHazards: 'Under high cooking heat or stomach acid, nitrites bind with dietary amines to form Nitrosamines, which are potent DNA-damaging carcinogens linked to colorectal and gastric cancers.',
    commonFoods: ['Bacon', 'Sausages', 'Salami', 'Ham', 'Canned luncheon meat'],
    cleanAlternatives: 'Cultured celery juice powder (contains natural nitrates), high-pressure processing.',
    statutoryReference: 'FSSAI Food Additives Standards, Meat and Meat Products Schedule',
  },
  {
    id: 'potassium-sorbate',
    name: 'Potassium Sorbate / Sorbic Acid',
    insNumber: 'INS 202 / 200',
    category: 'antimicrobial',
    functionalPurpose: 'Polyunsaturated fatty acid salt acting as an antimycotic agent to prevent yeast and mold spoilage.',
    fssaiLimit: '1,000 mg/kg (1,000 ppm) in dairy spreads, cheeses, and baked goods',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Permitted globally within statutory ceilings; banned only in 100% natural/organic certified lines.'],
    healthHazards: 'One of the safest synthetic preservatives because human metabolic pathways oxidize it into water and carbon dioxide like a dietary fat. Rare contact dermatitis in sensitive subjects.',
    commonFoods: ['Cheese slices & spreads', 'Yogurt fruit purees', 'Syrups & dessert sauces', 'Pancake mixes'],
    cleanAlternatives: 'Cultured milk fermentation, aseptic nitrogen sealing, sterile microfiltration.',
    statutoryReference: 'FSSAI Class II Preservatives Table, Regulation 3.1.4',
  },
  {
    id: 'calcium-propionate',
    name: 'Calcium Propionate / Propionic Acid',
    insNumber: 'INS 282 / 280',
    category: 'antimicrobial',
    functionalPurpose: 'Mold and rope-sporing bacteria inhibitor widely used in commercial bakeries to prevent sliced loaves from turning moldy.',
    fssaiLimit: '2,000 – 5,000 mg/kg (ppm) in bakery products',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Permitted in India, EU, USA, and UK within approved limits.'],
    healthHazards: 'Metabolized into propionate. Pediatric studies have noted potential behavioral irritations, sleep disturbances, or headaches in hypersensitive children.',
    commonFoods: ['Sliced sandwich bread', 'Tortillas', 'Roti wraps', 'Pizza crusts'],
    cleanAlternatives: 'Fermented wheat flour, sourdough culture, dry moisture control packaging.',
    statutoryReference: 'FSSAI Appendix A, Bakery & Cereal Products Limits',
  },
  {
    id: 'nisin',
    name: 'Nisin (Natural Bacteriocin Peptide)',
    insNumber: 'INS 234',
    category: 'antimicrobial',
    functionalPurpose: 'Naturally occurring antimicrobial peptide produced by Lactococcus lactis bacteria, targeting Gram-positive spore-forming food spoilage organisms.',
    fssaiLimit: '12.5 mg/kg (ppm) in processed cheese and dairy products',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Globally approved in over 50 countries as a safe biological food preservative.'],
    healthHazards: 'Extremely safe; broken down by human digestive enzymes (pancreatin) into harmless amino acids.',
    commonFoods: ['Processed cheese', 'Canned dairy puddings', 'Liquid egg mixes'],
    cleanAlternatives: 'Thermal pasteurization, cold aseptic packaging.',
    statutoryReference: 'FSSAI Regulations, Table 4, Bacteriocin Schedule',
  },
  {
    id: 'citric-acid',
    name: 'Citric Acid',
    insNumber: 'INS 330',
    category: 'acidity_regulator',
    functionalPurpose: 'Naturally occurring organic acid used as an acidity regulator, pH buffer, natural preservative, and antioxidant synergist.',
    fssaiLimit: 'GMP (Good Manufacturing Practice) — Permitted in food',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Approved worldwide by all food regulatory agencies (FSSAI, US FDA, EFSA, Codex).'],
    healthHazards: 'Generally Recognized as Safe (GRAS). Non-toxic natural organic metabolite. Excessive consumption in sugary sour beverages may cause minor tooth enamel demineralization.',
    commonFoods: ['Packaged potato chips', 'Namkeens & snacks', 'Fruit juices & sodas', 'Jams & jellies', 'Confectionery'],
    cleanAlternatives: 'Lemon juice concentrate, fermented apple cider vinegar, tartaric acid.',
    statutoryReference: 'FSSAI Food Additives Schedule, Table 1 (Acidity Regulators)',
  },
  {
    id: 'calcium-carbonate',
    name: 'Calcium Carbonate',
    insNumber: 'INS 170(i)',
    category: 'functional_additive',
    functionalPurpose: 'Food-grade mineral compound functioning as an anti-caking agent, firming agent, and surface finisher that absorbs moisture to prevent powder clumping.',
    fssaiLimit: 'GMP (Good Manufacturing Practice) — Permitted in food',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Permitted worldwide in food products as an approved mineral additive.'],
    healthHazards: 'Safe dietary mineral additive and calcium source. Non-toxic within Good Manufacturing Practice levels.',
    commonFoods: ['Seasoning powders', 'Spice mixes', 'Extruded snacks', 'Chewing gum bases'],
    cleanAlternatives: 'Silicon dioxide (INS 551), natural rice starch powder, tapioca starch.',
    statutoryReference: 'FSSAI Food Additives Schedule, Table 2 (Anti-Caking Agents)',
  },
  {
    id: 'disodium-guanylate',
    name: 'Disodium Guanylate',
    insNumber: 'INS 627',
    category: 'flavour_enhancer',
    functionalPurpose: 'High-potency natural purine ribonucleotide flavour enhancer produced via microbial fermentation to impart rich, savory umami taste.',
    fssaiLimit: 'GMP (Good Manufacturing Practice) — Permitted in food',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Globally approved; subject to warning recommendations for hyperuricemia / gout.'],
    healthHazards: 'Metabolized by the human body into purines, which oxidize into uric acid. Individuals suffering from gout, hyperuricemia, or uric acid kidney stones are advised to moderate intake.',
    commonFoods: ['Flavored chips', 'Instant noodles & tastemaker seasoning', 'Canned soups', 'Processed savory snacks'],
    cleanAlternatives: 'Yeast extract, naturally brewed soy sauce, dried mushroom powder (rich in natural guanylate).',
    statutoryReference: 'FSSAI Food Additives Standards, Table 5 (Flavour Enhancers)',
  },
  {
    id: 'disodium-inosinate',
    name: 'Disodium Inosinate',
    insNumber: 'INS 631',
    category: 'flavour_enhancer',
    functionalPurpose: 'Purine ribonucleotide food additive used as an intense umami flavor enhancer, typically paired synergistically with Disodium Guanylate (I+G).',
    fssaiLimit: 'GMP (Good Manufacturing Practice) — Permitted in food',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Globally approved as a standard food additive.'],
    healthHazards: 'Converts into purines and uric acid in the human digestive system; individuals with gout or hyperuricemia should monitor consumption.',
    commonFoods: ['Spiced wafers & potato chips', 'Instant noodles', 'Snack seasoning blends'],
    cleanAlternatives: 'Hydrolyzed vegetable protein, fermented mushroom extract, tomato paste powder.',
    statutoryReference: 'FSSAI Food Additives Standards, Table 5 (Flavour Enhancers)',
  },
  {
    id: 'paprika-oleoresin',
    name: 'Paprika Oleoresin / Paprika Extract',
    insNumber: 'INS 160c',
    category: 'functional_additive',
    functionalPurpose: 'Natural red carotenoid oil extract from dried sweet peppers (Capsicum annuum) containing capsanthin and capsorubin for bright red food coloring and flavor stability.',
    fssaiLimit: 'GMP (Good Manufacturing Practice) — Permitted in food',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Permitted globally as a safe natural food colorant.'],
    healthHazards: 'Completely non-toxic; rich in natural antioxidant carotenoids. Safe for all age groups.',
    commonFoods: ['Red seasoned chips', 'Tomato flavored snacks', 'Sausage casings', 'Processed cheese'],
    cleanAlternatives: 'Beetroot juice powder (INS 162), annatto extract (INS 160b).',
    statutoryReference: 'FSSAI Food Additives Schedule, Table 7 (Colouring Matter)',
  },
  {
    id: 'monosodium-glutamate',
    name: 'Monosodium Glutamate (MSG)',
    insNumber: 'INS 621',
    category: 'flavour_enhancer',
    functionalPurpose: 'Sodium salt of glutamic acid used to create savory umami depth. Mandatory declaration required on food packaging in India.',
    fssaiLimit: 'GMP (Good Manufacturing Practice) with mandatory packaging disclosure',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Prohibited in infant foods across India, the European Union, and USA.'],
    healthHazards: 'Safe for the general population; transient hypersensitivity (sweating, headache, numbness) reported by a minority of sensitive individuals.',
    commonFoods: ['Instant noodles', 'Canned soups', 'Frozen ready meals', 'Processed savory snacks'],
    cleanAlternatives: 'Fermented yeast extract, aged parmesan, natural tomato concentrate.',
    statutoryReference: 'FSSAI Packaging and Labelling Regulations (Rule 2.2.2)',
  },
  {
    id: 'lecithin',
    name: 'Lecithin',
    insNumber: 'INS 322(i)',
    category: 'functional_additive',
    functionalPurpose: 'Naturally derived phospholipid mixture from soy or sunflower used as an emulsifier to prevent fat separation and maintain smooth consistency.',
    fssaiLimit: 'GMP (Good Manufacturing Practice) — Permitted in food',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Globally approved in all jurisdictions.'],
    healthHazards: 'Non-toxic dietary lipid; natural source of choline. Highly safe.',
    commonFoods: ['Chocolate bars', 'Biscuits & cookies', 'Margarine & spreads', 'Instant milk powder'],
    cleanAlternatives: 'Sunflower lecithin, egg yolk lecithin, gum arabic.',
    statutoryReference: 'FSSAI Food Additives Schedule, Table 3 (Emulsifying Agents)',
  },
  {
    id: 'sodium-bicarbonate',
    name: 'Sodium Bicarbonate (Baking Soda)',
    insNumber: 'INS 500(ii)',
    category: 'functional_additive',
    functionalPurpose: 'Chemical leavening agent that releases carbon dioxide when heated, creating airy texture in baked goods and extruded snacks.',
    fssaiLimit: 'GMP (Good Manufacturing Practice) — Permitted in food',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Permitted globally.'],
    healthHazards: 'Completely non-toxic at dietary levels.',
    commonFoods: ['Cookies', 'Biscuits', 'Cakes', 'Crispy namkeens'],
    cleanAlternatives: 'Yeast fermentation, whipped egg whites.',
    statutoryReference: 'FSSAI Food Additives Schedule, Table 4 (Raising Agents)',
  },
  {
    id: 'ammonium-bicarbonate',
    name: 'Ammonium Bicarbonate',
    insNumber: 'INS 503(ii)',
    category: 'functional_additive',
    functionalPurpose: 'Traditional bakery leavening agent providing ultra-crisp texture in dry crackers and biscuits.',
    fssaiLimit: 'GMP (Good Manufacturing Practice) — Permitted in food',
    status: 'PERMITTED_WITH_LIMITS',
    bannedIn: ['Permitted globally.'],
    healthHazards: 'Evaporates during high-temperature baking into ammonia and water vapor; non-toxic in finished baked goods.',
    commonFoods: ['Marie biscuits', 'Crisp crackers', 'Rusk'],
    cleanAlternatives: 'Baking powder, cream of tartar.',
    statutoryReference: 'FSSAI Food Additives Schedule, Table 4 (Raising Agents)',
  },
];

export const PreservativesGuidePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetId = searchParams.get('id') || searchParams.get('focus') || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(targetId || null);
  const [highlightedId, setHighlightedId] = useState<string | null>(targetId || null);

  useEffect(() => {
    if (targetId && targetId !== 'all') {
      setSelectedFilter('all');
      setSearchQuery('');
      setExpandedId(targetId);
      setHighlightedId(targetId);
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [targetId]);

  const targetedItem = useMemo(() => {
    return PRESERVATIVE_CATALOG.find((p) => p.id === highlightedId);
  }, [highlightedId]);

  const filteredPreservatives = useMemo(() => {
    return PRESERVATIVE_CATALOG.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.insNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.functionalPurpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.healthHazards.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.commonFoods.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'banned_india') return item.status === 'BANNED_IN_INDIA';
      if (selectedFilter === 'globally_restricted') return item.status === 'GLOBALLY_RESTRICTED';
      if (selectedFilter === 'antioxidants') return item.category === 'synthetic_antioxidant';
      if (selectedFilter === 'antimicrobial') return item.category === 'antimicrobial';
      if (selectedFilter === 'curing') return item.category === 'curing_agent';
      return true;
    });
  }, [searchQuery, selectedFilter]);

  const bannedCount = PRESERVATIVE_CATALOG.filter((i) => i.status === 'BANNED_IN_INDIA').length;
  const restrictedCount = PRESERVATIVE_CATALOG.filter((i) => i.status === 'GLOBALLY_RESTRICTED').length;
  const permittedCount = PRESERVATIVE_CATALOG.filter((i) => i.status === 'PERMITTED_WITH_LIMITS').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Targeted Preservative Quick Banner (Active when navigated from Inspection) */}
      {targetedItem && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn border border-amber-400">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 text-amber-400 p-2.5 rounded-lg font-bold shadow-xs">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-950 block">
                Focused Inspection Additive Deep-Dive
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                {targetedItem.name} ({targetedItem.insNumber}) — Full Regulatory Codex & Safety Profile
              </h2>
              <p className="text-xs text-amber-950 font-medium mt-0.5">
                Statutory FSSAI Ceiling: <strong>{targetedItem.fssaiLimit}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSearchParams({});
              setHighlightedId(null);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer flex-shrink-0"
          >
            Show All 14 Additives
          </button>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <FlaskConical className="h-3.5 w-3.5" />
            <span>FSSAI Food Additives & Chemical Preservatives Codex</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Food Preservatives, Permissible Limits & Banned Chemical Registry
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Statutory reference catalog under the <em>Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011</em>.
            Cross-indexed with international bans (European Union, UK, Japan, US FDA, California AB 418) and toxicological health profiles.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60 text-xs">
            <div className="bg-rose-950/60 border border-rose-700/50 rounded-lg p-3">
              <span className="text-rose-400 font-bold block text-base">{bannedCount} Banned in India</span>
              <span className="text-slate-400 text-[11px]">Zero tolerance under FSSAI</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-700/50 rounded-lg p-3">
              <span className="text-amber-400 font-bold block text-base">{restrictedCount} Globally Banned</span>
              <span className="text-slate-400 text-[11px]">Prohibited in EU/Japan/UK</span>
            </div>
            <div className="bg-emerald-950/60 border border-emerald-700/50 rounded-lg p-3">
              <span className="text-emerald-400 font-bold block text-base">{permittedCount} Permitted Additives</span>
              <span className="text-slate-400 text-[11px]">Strict FSSAI ppm limits</span>
            </div>
            <div className="bg-indigo-950/60 border border-indigo-700/50 rounded-lg p-3">
              <span className="text-indigo-300 font-bold block text-base">INS & E-Codes</span>
              <span className="text-slate-400 text-[11px]">Harmonized decoding system</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Consumer Warnings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Warning 1: Benzene reaction */}
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-lg shadow-2xs">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-rose-900 text-sm block">
                🚨 The Benzene Hazard (Sodium Benzoate + Vitamin C)
              </span>
              <p className="text-rose-800 leading-relaxed">
                When <strong>Sodium Benzoate (INS 211)</strong> is combined with <strong>Vitamin C (Ascorbic Acid / INS 300)</strong> in acidic packaged beverages and exposed to heat or shelf light, they chemically react to produce <strong>Benzene</strong>—a proven human carcinogen that causes leukemia. Always check beverages for this combination.
              </p>
            </div>
          </div>
        </div>

        {/* Warning 2: Hidden INS numbers */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-2xs">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-amber-900 text-sm block">
                🔍 Decoding Hidden INS Numbers on Packets
              </span>
              <p className="text-amber-800 leading-relaxed">
                Manufacturers frequently omit chemical names on ingredient labels to avoid alarming consumers, writing only <em>"Contains Permitted Class II Preservatives (INS 211, INS 319)"</em>. Check this codex to unmask the chemical identity, FSSAI maximum permissible dosage, and health effects.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search preservatives by name (e.g., TBHQ, Potassium Bromate), INS code (INS 211), or health hazard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Additives ({PRESERVATIVE_CATALOG.length})
          </button>
          <button
            onClick={() => setSelectedFilter('banned_india')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors flex items-center space-x-1 ${
              selectedFilter === 'banned_india'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Ban className="h-3 w-3 mr-1" />
            Banned in India ({bannedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('globally_restricted')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors flex items-center space-x-1 ${
              selectedFilter === 'globally_restricted'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Globe className="h-3 w-3 mr-1" />
            Globally Restricted ({restrictedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('antioxidants')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
              selectedFilter === 'antioxidants'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Synthetic Antioxidants
          </button>
          <button
            onClick={() => setSelectedFilter('antimicrobial')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
              selectedFilter === 'antimicrobial'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Antimicrobial Agents
          </button>
          <button
            onClick={() => setSelectedFilter('curing')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
              selectedFilter === 'curing'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Curing & Sulphites
          </button>
        </div>
      </div>

      {/* Preservatives Cards List */}
      <div className="space-y-4">
        {filteredPreservatives.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-500">
            <FlaskConical className="h-12 w-12 mx-auto text-slate-300 mb-3 animate-pulse" />
            <p className="font-semibold text-sm">No food preservatives match your search query.</p>
            <p className="text-xs text-slate-400 mt-1">Try searching by INS code (e.g. 211, 319, 924a) or generic chemical name.</p>
          </div>
        ) : (
          filteredPreservatives.map((item) => {
            const isBannedIndia = item.status === 'BANNED_IN_INDIA';
            const isGloballyRestricted = item.status === 'GLOBALLY_RESTRICTED';
            const isExpanded = expandedId === item.id;
            const isTargeted = highlightedId === item.id;

            return (
              <div
                key={item.id}
                id={item.id}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  isTargeted
                    ? 'ring-4 ring-amber-500 ring-offset-2 scale-[1.01] shadow-2xl bg-amber-50/80 border-amber-500'
                    : isBannedIndia
                    ? 'bg-rose-50/50 border-rose-300 hover:border-rose-400 shadow-2xs'
                    : isGloballyRestricted
                    ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="p-5">
                  {/* Top Row: Name, INS badge, Status */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-black text-slate-900">{item.name}</h3>
                        <span className="bg-slate-800 text-amber-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                          {item.insNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                        {item.functionalPurpose}
                      </p>
                    </div>

                    <div>
                      {isBannedIndia && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-2xs animate-pulse">
                          <Ban className="h-3.5 w-3.5 mr-1" />
                          BANNED IN INDIA
                        </span>
                      )}
                      {isGloballyRestricted && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-600 text-white shadow-2xs">
                          <Globe className="h-3.5 w-3.5 mr-1" />
                          GLOBALLY BANNED / RESTRICTED
                        </span>
                      )}
                      {!isBannedIndia && !isGloballyRestricted && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          PERMITTED UNDER STRICT LIMITS
                        </span>
                      )}
                    </div>
                  </div>

                  {/* FSSAI Statutory Permissible Limit Banner */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-900 text-white text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-semibold">
                          FSSAI Statutory Permissible Ceiling
                        </span>
                        <span className="font-bold text-amber-400 font-mono text-sm">
                          {item.fssaiLimit}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 italic">
                      Ref: {item.statutoryReference}
                    </span>
                  </div>

                  {/* Health Hazards & Toxicological Profile */}
                  <div className="mt-3 p-3 rounded-lg bg-white/80 border border-slate-200 text-xs">
                    <div className="flex items-start space-x-2">
                      <HeartPulse className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-rose-950 block text-[11px] uppercase tracking-wider">
                          Health & Toxicological Risk Profile
                        </span>
                        <p className="text-slate-800 mt-0.5 leading-relaxed">
                          {item.healthHazards}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Countries Where Banned / Prohibited */}
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center">
                      <Globe className="h-3 w-3 mr-1 text-slate-400" />
                      Jurisdictions Where Banned or Strictly Prohibited ({item.bannedIn.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.bannedIn.map((country, idx) => (
                        <span
                          key={idx}
                          className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold border ${
                            country.toLowerCase().includes('india')
                              ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                              : 'bg-amber-100/80 text-amber-900 border-amber-300'
                          }`}
                        >
                          🚫 {country}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Deep Dive Accordion */}
                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-medium">Common foods found in:</span>
                      <div className="flex flex-wrap gap-1">
                        {item.commonFoods.map((f, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center hover:underline cursor-pointer"
                    >
                      {isExpanded ? 'Hide Clean Alternatives' : 'Clean Label Alternatives & Safe Substitutes →'}
                    </button>
                  </div>

                  {/* Expanded Clean Alternatives Section */}
                  {isExpanded && (
                    <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1.5 animate-fadeIn">
                      <div className="flex items-center space-x-1.5 text-emerald-900 font-bold">
                        <Leaf className="h-4 w-4 text-emerald-600" />
                        <span>Safe Industry Clean-Label Alternatives:</span>
                      </div>
                      <p className="text-emerald-800 leading-relaxed pl-5">
                        {item.cleanAlternatives}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clean Label Guide Bottom Card */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl border border-slate-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30 text-emerald-400">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">How Consumers & Officers Can Verify Clean Label Products</h2>
            <p className="text-xs text-slate-400">Natural food safety technologies that eliminate synthetic chemical preservatives</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700/60">
            <span className="font-bold text-amber-400 block mb-1">1. Modified Atmosphere Packaging (MAP)</span>
            <p className="text-slate-300 leading-relaxed">
              Displacing oxygen with food-grade inert nitrogen gas (N₂) or carbon dioxide (CO₂) prevents fat oxidation and aerobic mold growth without any chemical additives.
            </p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700/60">
            <span className="font-bold text-amber-400 block mb-1">2. Natural Plant Antioxidants</span>
            <p className="text-slate-300 leading-relaxed">
              Replacing synthetic TBHQ and BHA with <strong>Rosemary Extract (INS 392)</strong> and <strong>Mixed Tocopherols (Vitamin E / INS 306)</strong> provides natural rancidity defense.
            </p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700/60">
            <span className="font-bold text-amber-400 block mb-1">3. High Pressure Processing (HPP)</span>
            <p className="text-slate-300 leading-relaxed">
              Applying intense isostatic hydraulic pressure (up to 6,000 bar) inactivates pathogenic vegetative bacteria and yeasts in cold-pressed juices and dips with zero thermal degradation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
