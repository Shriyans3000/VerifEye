import re
from typing import Any, Dict, Optional, Tuple, List


FSSAI_REFERENCE_VERSION = "FSSAI Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011 (as amended)"

PRESERVATIVE_REFERENCE: Dict[str, Dict[str, Any]] = {
    # -------------------------------------------------------------
    # 1. BANNED / PROHIBITED SUBSTANCES (FSSAI / INTERNATIONAL)
    # -------------------------------------------------------------
    "potassium bromate": {
        "aliases": ["potassium bromate", "e924a", "ins 924a", "924a", "kbro3"],
        "ins": "924a",
        "limit_mg_per_kg": 0,
        "is_banned_in_india": True,
        "fssai_status": "BANNED_IN_INDIA",
        "banned_countries": [
            "India (Banned by FSSAI Gazette Notification June 2016)",
            "European Union (Banned across all EU nations)",
            "United Kingdom",
            "Canada",
            "Brazil",
            "China",
            "Australia & New Zealand",
            "Sri Lanka",
            "Nigeria"
        ],
        "concern": True,
        "description": "Chemical flour bleaching oxidizer and dough conditioner used to artificially increase bread volume.",
        "health_concerns": "Classified as an IARC Category 2B human carcinogen; proven to cause renal cell tumors and thyroid adenomas in animal bioassays. Banned by FSSAI in 2016.",
    },
    "potassium iodate": {
        "aliases": ["potassium iodate", "e917", "ins 917", "917", "kio3"],
        "ins": "917",
        "limit_mg_per_kg": 0,
        "is_banned_in_india": True,
        "fssai_status": "BANNED_IN_INDIA",
        "banned_countries": [
            "India (Banned by FSSAI as flour treatment agent)",
            "European Union",
            "Australia",
            "New Zealand"
        ],
        "concern": True,
        "description": "Prohibited flour treatment and bleaching agent.",
        "health_concerns": "Disrupts human thyroid gland hormones, leading to severe metabolic and thyroid disorders.",
    },
    "formaldehyde": {
        "aliases": ["formaldehyde", "formalin", "methanal", "formol"],
        "ins": None,
        "limit_mg_per_kg": 0,
        "is_banned_in_india": True,
        "fssai_status": "BANNED_IN_INDIA",
        "banned_countries": [
            "India (Strictly prohibited in all food items by FSSAI)",
            "United States (FDA Prohibited)",
            "European Union (Strictly prohibited in all food)",
            "Global Food Safety Standard (Worldwide Ban)"
        ],
        "concern": True,
        "description": "Hazardous toxic industrial chemical illegally used as an adulterant to artificially preserve fish, meat, and milk.",
        "health_concerns": "Category 1 Proven Human Carcinogen (IARC). Causes leukemia, nasopharyngeal cancer, acute gastrointestinal necrosis, and systemic poisoning.",
    },
    "boric acid": {
        "aliases": ["boric acid", "borax", "e284", "e285", "ins 284", "ins 285", "sodium borate"],
        "ins": "284",
        "limit_mg_per_kg": 0,
        "is_banned_in_india": True,
        "fssai_status": "BANNED_IN_INDIA",
        "banned_countries": [
            "India (Strictly prohibited in food products under FSSAI)",
            "United States (FDA Prohibited in domestic foods)",
            "European Union (Prohibited as a direct food additive)"
        ],
        "concern": True,
        "description": "Toxic mineral compound illegally used to improve food texture, firmness, and preserve noodles or dairy.",
        "health_concerns": "Bioaccumulative poison. Damages human fertility, causes kidney failure, reproductive toxicity, and acute metabolic poisoning.",
    },
    "brominated vegetable oil": {
        "aliases": ["brominated vegetable oil", "bvo", "ins 443", "e443"],
        "ins": "443",
        "limit_mg_per_kg": 0,
        "is_banned_in_india": True,
        "fssai_status": "BANNED_IN_INDIA",
        "banned_countries": [
            "India (Prohibited by FSSAI)",
            "European Union (Banned in food & beverages)",
            "Japan (Completely Banned)",
            "United States (FDA revoked food additive authorization in 2024)"
        ],
        "concern": True,
        "description": "Brominated synthetic compound historically used to stabilize and emulsify citrus-flavored drinks.",
        "health_concerns": "Bioaccumulates in body tissues; causes bromine toxicity, cardiac and thyroid lesions, and neurological harm.",
    },
    "propylparaben": {
        "aliases": ["propylparaben", "propyl paraben", "propyl 4-hydroxybenzoate", "e216", "ins 216", "sodium propylparaben", "e217", "ins 217"],
        "ins": "216",
        "limit_mg_per_kg": 0,
        "is_banned_in_india": False,
        "fssai_status": "RESTRICTED",
        "banned_countries": [
            "European Union (Banned in food by EFSA since 2006)",
            "United States (California AB 418 Food Safety Act Ban)",
            "United Kingdom (Banned as food additive)"
        ],
        "concern": True,
        "description": "Synthetic paraben preservative inhibiting bacterial and fungal growth.",
        "health_concerns": "Proven endocrine-disrupting chemical; mimics human estrogen, accelerating breast cancer cell proliferation and lowering sperm counts.",
    },
    "methylparaben": {
        "aliases": ["methylparaben", "methyl paraben", "methyl 4-hydroxybenzoate", "e218", "ins 218", "sodium methylparaben", "e219", "ins 219"],
        "ins": "218",
        "limit_mg_per_kg": 0,
        "is_banned_in_india": False,
        "fssai_status": "RESTRICTED",
        "banned_countries": [
            "European Union (Banned in baby and toddler foods)",
            "United States (California AB 418 restrictions)"
        ],
        "concern": True,
        "description": "Synthetic paraben preservative extending cosmetic and food stability.",
        "health_concerns": "Exhibits estrogenic activity and hormone disruption; restricted globally for dietary exposure.",
    },

    # -------------------------------------------------------------
    # 2. PERMITTED CLASS II CHEMICAL PRESERVATIVES (WITH STRICT FSSAI LIMITS)
    # -------------------------------------------------------------
    "sodium benzoate": {
        "aliases": ["sodium benzoate", "benzoate of soda", "e211", "ins 211", "211"],
        "ins": "211",
        "limit_mg_per_kg": 600,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "European Union (Banned when combined with Vitamin C/Ascorbic Acid due to Benzene formation)",
            "Japan (Strictly restricted in natural/health beverages)",
            "Banned in certified organic foods worldwide"
        ],
        "concern": True,
        "description": "Synthetic Class II antimicrobial benzoate preservative preventing growth of yeasts, moulds, and bacteria in acidic foods.",
        "health_concerns": "When combined with Vitamin C (Ascorbic Acid / E300), it can react to form Benzene, a known human carcinogen. Linked to hyperactivity in children (Southampton Study).",
    },
    "benzoic acid": {
        "aliases": ["benzoic acid", "e210", "ins 210", "210"],
        "ins": "210",
        "limit_mg_per_kg": 600,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "European Union (Heavily restricted with strict Acceptable Daily Intake caps)",
            "Banned in organic food certifications"
        ],
        "concern": True,
        "description": "Aromatic carboxylic acid preservative preventing fungal and bacterial fermentation.",
        "health_concerns": "Triggers allergic contact dermatitis, urticaria, and respiratory distress in sensitive or asthmatic persons.",
    },
    "potassium sorbate": {
        "aliases": ["potassium sorbate", "sorbate of potassium", "e202", "ins 202", "202"],
        "ins": "202",
        "limit_mg_per_kg": 1000,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "United States (Prohibited on fresh meat and poultry)",
            "European Union (EFSA lowered Acceptable Daily Intake limits)"
        ],
        "concern": False,
        "description": "Potassium salt of sorbic acid; widely used antimicrobial preservative that inhibits mould and yeast in bakery, cheese, beverages, and sauces.",
        "health_concerns": "Generally recognized as safe when within limits; excessive intake may trigger mild skin allergies and headaches in sensitive individuals.",
    },
    "sorbic acid": {
        "aliases": ["sorbic acid", "e200", "ins 200", "200"],
        "ins": "200",
        "limit_mg_per_kg": 1000,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "European Union (Restricted in fresh/unprocessed food categories)"
        ],
        "concern": False,
        "description": "Polyunsaturated fatty acid preservative preventing mould growth and yeast proliferation.",
        "health_concerns": "Skin and mucous membrane irritation at concentrated exposure.",
    },
    "sulphur dioxide": {
        "aliases": ["sulphur dioxide", "sulfur dioxide", "e220", "ins 220", "220"],
        "ins": "220",
        "limit_mg_per_kg": 2000,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "United States (FDA 1986 ban on raw fruits, vegetables, and salad bars due to fatal asthma attacks)",
            "European Union (Banned in fresh meats; mandatory bold allergen warning)",
            "Australia (Banned in fresh minced meat)"
        ],
        "concern": True,
        "description": "Sulphite preservative and antioxidant preventing bacterial spoilage and enzymatic browning in dried fruits, wines, and syrups.",
        "health_concerns": "Potent allergen. Inhaling or ingesting sulphites triggers acute, potentially life-threatening bronchospasms and asthmatic attacks. Requires mandatory bold allergen labeling above 10 mg/kg.",
    },
    "sodium metabisulphite": {
        "aliases": ["sodium metabisulphite", "sodium metabisulfite", "e223", "ins 223", "223", "sodium pyrosulphite"],
        "ins": "223",
        "limit_mg_per_kg": 2000,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "United States (FDA ban on salad bars and fresh produce)",
            "European Union (Banned in fresh meats; mandatory allergen declaration)"
        ],
        "concern": True,
        "description": "Inorganic sulphite salt releasing sulphur dioxide to prevent oxidation and bacterial spoilage in packaged foods.",
        "health_concerns": "Degrades Vitamin B1 (thiamine); triggers severe asthmatic reactions and digestive irritation in sulphite-sensitive individuals.",
    },
    "potassium metabisulphite": {
        "aliases": ["potassium metabisulphite", "potassium metabisulfite", "e224", "ins 224", "224"],
        "ins": "224",
        "limit_mg_per_kg": 2000,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "United States (Banned on fresh salad bars and raw vegetables)",
            "European Union (Banned in fresh meats; mandatory allergen warning)"
        ],
        "concern": True,
        "description": "Sulphite preservative and sterilizing agent commonly used in wines, juices, and squashes.",
        "health_concerns": "Triggers severe allergic reactions in asthmatics; strict statutory maximum limits apply.",
    },
    "tbhq": {
        "aliases": ["tbhq", "tertiary butylhydroquinone", "tert-butylhydroquinone", "e319", "ins 319", "319"],
        "ins": "319",
        "limit_mg_per_kg": 200,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "Japan (Completely BANNED for use in all food products)",
            "European Union (Prohibited in several categories, capped strictly at 200 ppm in oils)"
        ],
        "concern": True,
        "description": "Synthetic aromatic phenolic antioxidant preservative used to prevent rancidity in edible vegetable oils, potato chips, and fried snacks.",
        "health_concerns": "High doses in laboratory studies showed precursors to stomach tumors, liver enlargement, and neurotoxic cellular effects.",
    },
    "bha": {
        "aliases": ["bha", "butylated hydroxyanisole", "e320", "ins 320", "320"],
        "ins": "320",
        "limit_mg_per_kg": 200,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "Japan (Completely BANNED in foods)",
            "European Union (Banned in infant and toddler foods)",
            "United States (Listed as Reasonably Anticipated to be a Human Carcinogen by NIH; California Prop 65 warning list)"
        ],
        "concern": True,
        "description": "Synthetic antioxidant preservative preventing lipid oxidation and rancidity in high-fat packaged foods.",
        "health_concerns": "Recognized potential endocrine disruptor and classified as a suspected carcinogen in multiple international toxicological registries.",
    },
    "bht": {
        "aliases": ["bht", "butylated hydroxytoluene", "e321", "ins 321", "321"],
        "ins": "321",
        "limit_mg_per_kg": 200,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "Japan (BANNED in food supply)",
            "European Union & United Kingdom (Banned in baby and toddler foods)",
            "United States (California AB 418 phase-out restrictions)"
        ],
        "concern": True,
        "description": "Synthetic antioxidant preservative used to maintain freshness and prevent rancidity in cereals, fats, and packaged snacks.",
        "health_concerns": "Associated with thyroid gland hypertrophy, hepatic enzyme alterations, and suspected endocrine disruption.",
    },
    "sodium nitrite": {
        "aliases": ["sodium nitrite", "e250", "ins 250", "250"],
        "ins": "250",
        "limit_mg_per_kg": 100,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "Denmark (Strict national law capping nitrite levels below EU limits)",
            "European Union (Sharply lowered allowable limits due to cancer links)",
            "Banned in infant foods worldwide"
        ],
        "concern": True,
        "description": "Inorganic salt curing preservative used to prevent lethal Clostridium botulinum growth and impart pink color in processed meats.",
        "health_concerns": "Reacts with amines during high-heat cooking to form Nitrosamines, powerful Class 1 carcinogens strongly linked to colorectal and gastric cancers.",
    },
    "sodium nitrate": {
        "aliases": ["sodium nitrate", "e251", "ins 251", "251", "chile saltpeter"],
        "ins": "251",
        "limit_mg_per_kg": 100,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "Denmark (Strict national restrictions)",
            "European Union (Strictly capped)"
        ],
        "concern": True,
        "description": "Preservative and color fixative in cured meats.",
        "health_concerns": "Converts into nitrites in the human digestive tract, forming carcinogenic nitrosamine compounds.",
    },
    "calcium propionate": {
        "aliases": ["calcium propionate", "e282", "ins 282", "282", "propionate of calcium"],
        "ins": "282",
        "limit_mg_per_kg": 2000,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "Restricted in organic food standards in the European Union and USA"
        ],
        "concern": False,
        "description": "Calcium salt of propionic acid; highly effective anti-mould and anti-rope preservative extending the shelf life of bread and bakery goods.",
        "health_concerns": "Safe at standard regulatory levels; some pediatric studies correlate high exposure with irritability, restlessness, and sleep disturbance in sensitive children.",
    },
    "nisin": {
        "aliases": ["nisin", "e234", "ins 234", "234"],
        "ins": "234",
        "limit_mg_per_kg": 12.5,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_WITH_LIMITS",
        "banned_countries": [
            "Permitted internationally under strict category-specific limits"
        ],
        "concern": False,
        "description": "Natural antimicrobial peptide (bacteriocin) produced by fermentation of Lactococcus lactis, effective against Gram-positive bacteria in cheese and dairy.",
        "health_concerns": "Non-toxic natural antimicrobial that is completely broken down into amino acids by digestive enzymes.",
    },
    # -------------------------------------------------------------
    # 4. ACIDITY REGULATORS, FLAVOUR ENHANCERS & FUNCTIONAL ADDITIVES
    # -------------------------------------------------------------
    "citric acid": {
        "aliases": ["citric acid", "acidity regulator", "acidity regulator (ins 330)", "acidity regulator 330", "ins 330", "e330", "330"],
        "ins": "330",
        "limit_mg_per_kg": None,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_ADDITIVE",
        "banned_countries": [],
        "concern": False,
        "description": "Naturally occurring organic acid used as an acidity regulator, natural preservative, and antioxidant synergist in beverages, confectionery, and snacks.",
        "health_concerns": "Generally Recognized as Safe (GRAS) by FSSAI & US FDA. Safe at Good Manufacturing Practice (GMP) levels. Excessive ingestion in acidic drinks may contribute to minor tooth enamel erosion.",
    },
    "calcium carbonate": {
        "aliases": ["calcium carbonate", "anti-caking agent", "anti caking agent", "ins 170", "ins 170 (i)", "ins 170(i)", "e170", "170", "170 (i)", "170(i)"],
        "ins": "170(i)",
        "limit_mg_per_kg": None,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_ADDITIVE",
        "banned_countries": [],
        "concern": False,
        "description": "Food-grade mineral compound functioning as an anti-caking agent and firming agent that absorbs moisture to prevent powder clumping.",
        "health_concerns": "Safe dietary mineral supplement and additive at Good Manufacturing Practice (GMP) levels.",
    },
    "disodium guanylate": {
        "aliases": ["disodium guanylate", "flavour enhancer (ins 627)", "ins 627", "e627", "627", "sodium guanylate", "gmp"],
        "ins": "627",
        "limit_mg_per_kg": None,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_ADDITIVE",
        "banned_countries": [],
        "concern": False,
        "description": "High-potency ribonucleotide flavour enhancer produced by yeast fermentation that creates an intense savory umami taste profile.",
        "health_concerns": "Permitted under FSSAI GMP. Metabolized into purines and uric acid; individuals with gout, hyperuricemia, or kidney stones are advised to moderate intake.",
    },
    "disodium inosinate": {
        "aliases": ["disodium inosinate", "flavour enhancer (ins 631)", "ins 631", "e631", "631", "sodium inosinate", "imp"],
        "ins": "631",
        "limit_mg_per_kg": None,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_ADDITIVE",
        "banned_countries": [],
        "concern": False,
        "description": "Purine ribonucleotide food additive used as an umami flavour enhancer, typically paired synergistically with Disodium Guanylate (I+G).",
        "health_concerns": "Permitted under FSSAI GMP. Broken down into purines; individuals sensitive to uric acid or suffering from gout should consume with awareness.",
    },
    "paprika oleoresin": {
        "aliases": ["paprika oleoresin", "paprika extract", "ins 160c", "e160c", "160c", "capsanthin", "capsorubin"],
        "ins": "160c",
        "limit_mg_per_kg": None,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_ADDITIVE",
        "banned_countries": [],
        "concern": False,
        "description": "Natural red carotenoid oil extract from dried sweet peppers (Capsicum annuum) used for natural food coloration and flavor stability.",
        "health_concerns": "Safe natural food colorant with dietary carotenoid antioxidant activity. Non-toxic.",
    },
    "monosodium glutamate": {
        "aliases": ["monosodium glutamate", "msg", "ins 621", "e621", "621"],
        "ins": "621",
        "limit_mg_per_kg": None,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_ADDITIVE",
        "banned_countries": [],
        "concern": False,
        "description": "Sodium salt of glutamic acid used as an umami savory flavor enhancer. Must be declared under FSSAI labelling regulations.",
        "health_concerns": "Permitted in India. Rare hypersensitivity symptoms (headache, flushing) in a small subset of individuals.",
    },
    "lecithin": {
        "aliases": ["lecithin", "soya lecithin", "ins 322", "ins 322(i)", "ins 322 (i)", "e322", "322"],
        "ins": "322",
        "limit_mg_per_kg": None,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_ADDITIVE",
        "banned_countries": [],
        "concern": False,
        "description": "Naturally derived phospholipid mixture from soy or sunflower used as an emulsifier to prevent fat separation in chocolates and baked goods.",
        "health_concerns": "Completely safe natural dietary lipid component.",
    },
    "sodium bicarbonate": {
        "aliases": ["sodium bicarbonate", "sodium hydrogen carbonate", "raising agent (ins 500(ii))", "ins 500", "ins 500(ii)", "e500", "500", "500(ii)"],
        "ins": "500(ii)",
        "limit_mg_per_kg": None,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_ADDITIVE",
        "banned_countries": [],
        "concern": False,
        "description": "Chemical leavening agent (baking soda) that releases carbon dioxide when heated to create airy texture in cookies and snacks.",
        "health_concerns": "Safe at GMP levels.",
    },
    "ammonium bicarbonate": {
        "aliases": ["ammonium bicarbonate", "ammonium hydrogen carbonate", "raising agent (ins 503(ii))", "ins 503", "ins 503(ii)", "e503", "503", "503(ii)"],
        "ins": "503(ii)",
        "limit_mg_per_kg": None,
        "is_banned_in_india": False,
        "fssai_status": "PERMITTED_ADDITIVE",
        "banned_countries": [],
        "concern": False,
        "description": "Traditional bakery leavening agent used in dry, crisp biscuits and crackers for light and crispy texture.",
        "health_concerns": "Evaporates completely during baking; non-toxic at standard GMP levels.",
    },
}


def _normalise(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def _find_reference(name: Any = None, ins_number: Any = None) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    normalised_name = _normalise(name)
    normalised_ins = _normalise(ins_number)

    # First attempt exact alias match
    for canonical_name, reference in PRESERVATIVE_REFERENCE.items():
        aliases = {_normalise(alias) for alias in reference["aliases"]}
        if normalised_name in aliases or (normalised_ins and normalised_ins in aliases):
            return canonical_name, reference

    # Substring search for common names (e.g. "contains sodium benzoate (ins 211)")
    for canonical_name, reference in PRESERVATIVE_REFERENCE.items():
        for alias in reference["aliases"]:
            norm_alias = _normalise(alias)
            if len(norm_alias) >= 3 and (norm_alias in normalised_name or (normalised_ins and norm_alias in normalised_ins)):
                return canonical_name, reference

    # Dynamic Codex Alimentarius / FSSAI INS fallback if any INS code was detected
    candidate_ins = normalised_ins or ""
    if not candidate_ins:
        m = re.search(r"\b(?:ins|e)\s*([0-9]{3,4}\s*[a-z]?(?:\s*\([a-z0-9ivx]+\))?)", normalised_name)
        if m:
            candidate_ins = m.group(1).strip()

    cleaned_digits = "".join(ch for ch in candidate_ins if ch.isdigit())
    if cleaned_digits:
        num = int(cleaned_digits)
        if 100 <= num <= 199:
            functional_class = "Food Colour"
            desc = f"Permitted food colouring additive (INS {candidate_ins}) used to enhance visual appearance."
        elif 200 <= num <= 299:
            functional_class = "Preservative"
            desc = f"Antimicrobial chemical preservative (INS {candidate_ins}) extending product shelf life."
        elif 300 <= num <= 399:
            functional_class = "Antioxidant / Acidity Regulator"
            desc = f"Food additive (INS {candidate_ins}) functioning as an acidity regulator or antioxidant stabilizer."
        elif 400 <= num <= 499:
            functional_class = "Emulsifier / Stabilizer / Thickener"
            desc = f"Food additive (INS {candidate_ins}) improving texture, viscosity, and emulsion stability."
        elif 500 <= num <= 599:
            functional_class = "Anti-Caking / Raising Agent"
            desc = f"Food additive (INS {candidate_ins}) preventing powder clumping or acting as a leavening agent."
        elif 600 <= num <= 699:
            functional_class = "Flavour Enhancer"
            desc = f"Food additive (INS {candidate_ins}) enhancing savory umami aroma and taste profile."
        elif 900 <= num <= 999:
            functional_class = "Sweetener / Glazing Agent"
            desc = f"Non-sugar intense sweetener or surface coating additive (INS {candidate_ins})."
        else:
            functional_class = "Food Additive"
            desc = f"Permitted functional food additive (INS {candidate_ins})."

        display_name = f"{functional_class} (INS {candidate_ins})"
        return display_name, {
            "name": display_name,
            "aliases": [candidate_ins, f"ins {candidate_ins}"],
            "ins": candidate_ins,
            "limit_mg_per_kg": None,
            "is_banned_in_india": False,
            "fssai_status": "PERMITTED_ADDITIVE",
            "banned_countries": [],
            "concern": False,
            "description": desc,
            "health_concerns": "Permitted food additive under FSSAI Good Manufacturing Practice (GMP) regulations."
        }

    return None, None


def analyze_preservatives(product: dict) -> dict:
    """Evaluate label-declared preservatives against FSSAI and international regulatory frameworks."""
    raw_items = product.get("preservatives") or []
    if not isinstance(raw_items, list):
        raw_items = []

    category = product.get("food_category")
    findings: List[Dict[str, Any]] = []

    for raw_item in raw_items:
        if isinstance(raw_item, str):
            raw_item = {"name": raw_item}
        if not isinstance(raw_item, dict):
            continue

        raw_name = raw_item.get("name") or raw_item.get("ins_number")
        canonical_name, reference = _find_reference(raw_name, raw_item.get("ins_number"))
        ins = raw_item.get("ins_number") or (reference.get("ins") if reference else None)

        limit = reference.get("limit_mg_per_kg") if reference else None
        is_banned_in_india = bool(reference and reference.get("is_banned_in_india"))
        banned_countries = reference.get("banned_countries", []) if reference else []
        health_concerns = reference.get("health_concerns") if reference else None
        description = reference.get("description") if reference else "Food additive used for preservation."

        declared_amount = raw_item.get("amount_mg_per_kg")
        try:
            declared_amount = float(declared_amount) if declared_amount is not None else None
        except (TypeError, ValueError):
            declared_amount = None

        if is_banned_in_india:
            status = "BANNED_SUBSTANCE"
            reason = f"CRITICAL HAZARD: '{canonical_name or raw_name}' is BANNED in India under FSSAI regulations. Prohibited in food products."
        elif not reference:
            status = "REVIEW_REQUIRED"
            reason = "Preservative was detected, but no configured FSSAI reference entry was found."
        elif declared_amount is not None and limit is not None and declared_amount > limit:
            status = "LIMIT_EXCEEDED"
            reason = f"FSSAI LIMIT EXCEEDED: Declared amount ({declared_amount:g} mg/kg) exceeds the configured reference limit of {limit:g} mg/kg."
        elif reference and reference.get("fssai_status") == "PERMITTED_ADDITIVE":
            status = "WITHIN_LIMIT"
            reason = "Permitted food additive under FSSAI Good Manufacturing Practice (GMP) regulations."
        elif declared_amount is None or not category:
            status = "REVIEW_REQUIRED"
            reason = "A category-specific FSSAI limit or declared quantity is unavailable; verify manually."
        elif limit is None:
            status = "REVIEW_REQUIRED"
            reason = "A category-specific FSSAI permissible limit is not established; verify manually."
        else:
            status = "WITHIN_LIMIT"
            reason = f"Declared amount ({declared_amount:g} mg/kg) is within the FSSAI reference limit of {limit:g} mg/kg."

        display_title = (
            canonical_name.title()
            if canonical_name
            else (str(raw_name).title() if raw_name else "Unidentified Additive")
        )
        canonical_str = (
            canonical_name.lower()
            if canonical_name
            else (str(raw_name).lower() if raw_name else "unidentified")
        )

        findings.append({
            "name": display_title,
            "canonical_name": canonical_str,
            "ins_number": ins,
            "amount_mg_per_kg": declared_amount,
            "fssai_limit_mg_per_kg": limit,
            "food_category": category,
            "status": status,
            "is_banned_in_india": is_banned_in_india,
            "banned_countries": banned_countries,
            "health_concerns": health_concerns,
            "risk_flag": bool(is_banned_in_india or (reference and reference.get("concern")) or status == "LIMIT_EXCEEDED"),
            "description": description,
            "reason": reason,
            "evidence": raw_item.get("evidence"),
        })

    banned = [item for item in findings if item.get("is_banned_in_india") or item.get("status") == "BANNED_SUBSTANCE"]
    exceeded = [item for item in findings if item["status"] == "LIMIT_EXCEEDED"]
    flagged = [item for item in findings if item["risk_flag"]]

    # Construct prominent alert summary if any banned or exceeded preservative exists
    critical_alerts = []
    for b in banned:
        countries_str = ", ".join(b.get("banned_countries", []))
        critical_alerts.append(
            f"PROHIBITED SUBSTANCE: '{b['name']}' (INS {b['ins_number'] or 'N/A'}) is BANNED in India by FSSAI! Banned globally in: {countries_str}."
        )
    for e in exceeded:
        amt_str = f"{e['amount_mg_per_kg']:g} mg/kg" if e.get("amount_mg_per_kg") is not None else "Unknown"
        lim_str = f"{e['fssai_limit_mg_per_kg']:g} mg/kg" if e.get("fssai_limit_mg_per_kg") is not None else "0 mg/kg"
        critical_alerts.append(
            f"FSSAI VIOLATION: '{e['name']}' exceeds permissible limit ({amt_str} > {lim_str})!"
        )

    critical_alert_text = " | ".join(critical_alerts) if critical_alerts else None

    return {
        "reference_version": FSSAI_REFERENCE_VERSION,
        "food_category": category,
        "preservatives_found": findings,
        "flagged_preservatives": flagged,
        "limit_exceeded": exceeded,
        "banned_preservatives": banned,
        "has_flagged_preservative": bool(flagged),
        "has_banned_preservative": bool(banned),
        "has_limit_exceeded": bool(exceeded),
        "critical_alert": critical_alert_text,
        "requires_manual_review": any(item["status"] in ("REVIEW_REQUIRED", "BANNED_SUBSTANCE") for item in findings),
    }
