export type MicroCategory = 'Vitamins' | 'B-Complex' | 'Minerals & Electrolytes' | 'Trace Elements';

export interface MicroDangerZone {
  upperLimit: number; // Tolerable Upper Intake Level (UL) in the nutrient's unit
  dangerRatePerKg: number; // Scaled rate per kg of bodyweight
  formulaLabel: string;
  warningThreshold: number; // 80-85% of UL
  toxicityRisks: string; // Clinical manifestation of toxicity
  organTarget: string; // Chief biological organ/system at risk
}

export interface MicroDefinition {
  name: string;
  category: MicroCategory;
  unit: string;
  shortDesc: string;
  physiologicalRole: string;
  calculate: (
    weightKg: number,
    sex: string,
    age: number
  ) => {
    target: number;
    ratePerKg: number;
    formulaLabel: string;
  };
  calculateUpperLimit: (
    weightKg: number,
    sex: string,
    age: number
  ) => MicroDangerZone;
}

/**
 * 24 Essential Micronutrients scientifically linked to human bodyweight and dietary toxicity thresholds.
 * Based on EFSA (European Food Safety Authority), NIH/IOM (Institute of Medicine), and ACSM clinical toxicology:
 * - Fluid & electrolyte compartments (Potassium, Magnesium, Calcium, Phosphorus) scale with total intracellular/extracellular volume.
 * - Mitochondrial enzymes & cofactors (B-complex, Choline) scale with active tissue turnover.
 * - Upper Limits (UL) scale with total body distribution volume (kg), clearance kinetics, and organ mass.
 */
export const BODYWEIGHT_MICRONUTRIENTS: MicroDefinition[] = [
  // --- VITAMINS ---
  {
    name: 'Vitamin A',
    category: 'Vitamins',
    unit: 'µg RAE',
    shortDesc: 'Vision, epithelial integrity & immune defenses',
    physiologicalRole: 'Retinol turnover & epithelial surface area renewal scale directly with body mass.',
    calculate: (w, sex) => {
      const rate = sex === 'male' ? 11.5 : 10.0;
      const target = Math.round(w * rate);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} µg/kg × ${w} kg = ${target} µg RAE`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 37.5; // ~3000 µg for 80kg (EFSA/NIH UL cap 3000 µg)
      const upperLimit = Math.min(3000, Math.round(w * rate));
      const warningThreshold = Math.round(upperLimit * 0.8);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} µg RAE (${rate} µg/kg cap)`,
        warningThreshold,
        toxicityRisks: 'Hypervitaminosis A, chronic hepatotoxicity, elevated intracranial pressure, bone demineralization, teratogenicity.',
        organTarget: 'Liver & Bone Tissue',
      };
    },
  },
  {
    name: 'Vitamin C',
    category: 'Vitamins',
    unit: 'mg',
    shortDesc: 'Collagen synthesis & antioxidant cellular volume',
    physiologicalRole: 'Ascorbate tissue pool saturation scales with lean body volume and extracellular fluids.',
    calculate: (w, sex) => {
      const rate = sex === 'male' ? 1.25 : 1.15;
      const target = Math.round(w * rate);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 25.0; // 2000 mg for 80kg (NIH UL cap 2000 mg)
      const upperLimit = Math.min(2000, Math.round(w * rate));
      const warningThreshold = Math.round(upperLimit * 0.8);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg cap)`,
        warningThreshold,
        toxicityRisks: 'Osmotic diarrhea, severe gastrointestinal cramps, hyperoxaluria and increased risk of calcium oxalate kidney stones.',
        organTarget: 'Gastrointestinal Tract & Kidneys',
      };
    },
  },
  {
    name: 'Vitamin D',
    category: 'Vitamins',
    unit: 'µg',
    shortDesc: 'Calcium homeostasis, immune modulation & bone density',
    physiologicalRole: 'Lipophilic volume of distribution; higher body mass dilutes cholecalciferol, requiring higher intake.',
    calculate: (w, _, age) => {
      const rate = age > 70 ? 0.30 : 0.25;
      const target = Math.round(w * rate * 10) / 10;
      const iu = Math.round(target * 40);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} µg/kg × ${w} kg = ${target} µg (${iu} IU)`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 1.25; // 100 µg (4000 IU) for 80kg cap
      const upperLimit = Math.min(100, Math.round(w * rate));
      const warningThreshold = Math.round(upperLimit * 0.8);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} µg / ${upperLimit * 40} IU (${rate} µg/kg cap)`,
        warningThreshold,
        toxicityRisks: 'Hypercalcemia, irreversible nephrocalcinosis (kidney calcification), arterial vascular calcification, arrhythmias.',
        organTarget: 'Kidneys & Cardiovascular System',
      };
    },
  },
  {
    name: 'Vitamin E',
    category: 'Vitamins',
    unit: 'mg',
    shortDesc: 'Lipid membrane antioxidant protection',
    physiologicalRole: 'Protects polyunsaturated fatty acids across all cell membrane phospholipid layers.',
    calculate: (w) => {
      const rate = 0.20;
      const target = Math.round(w * rate * 10) / 10;
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 12.5; // ~1000 mg for 80kg (NIH UL cap)
      const upperLimit = Math.min(1000, Math.round(w * rate));
      const warningThreshold = Math.round(upperLimit * 0.8);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg cap)`,
        warningThreshold,
        toxicityRisks: 'Impaired platelet aggregation, vitamin K antagonism, increased hemorrhage and stroke bleeding risk.',
        organTarget: 'Coagulation & Microvasculature',
      };
    },
  },
  {
    name: 'Vitamin K',
    category: 'Vitamins',
    unit: 'µg',
    shortDesc: 'Osteocalcin gamma-carboxylation & blood coagulation',
    physiologicalRole: 'Bone matrix mineralization and hepatic prothrombin synthesis scale with skeleton and liver mass.',
    calculate: (w, sex) => {
      const rate = sex === 'male' ? 1.50 : 1.35;
      const target = Math.round(w * rate);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} µg/kg × ${w} kg = ${target} µg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 10.0;
      const upperLimit = Math.round(w * rate);
      const warningThreshold = Math.round(upperLimit * 0.75);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} µg (${rate} µg/kg)`,
        warningThreshold,
        toxicityRisks: 'Interference with physiological anticoagulation balance; potential hemolytic or hepatic stress with mega-doses.',
        organTarget: 'Hepatic Coagulation Pathways',
      };
    },
  },

  // --- B-COMPLEX VITAMINS ---
  {
    name: 'Thiamin (B1)',
    category: 'B-Complex',
    unit: 'mg',
    shortDesc: 'Pyruvate dehydrogenase & carbohydrate energy flux',
    physiologicalRole: 'Cofactor for carbohydrate and branched-chain amino acid catabolism per kg metabolic mass.',
    calculate: (w, sex) => {
      const rate = sex === 'male' ? 0.015 : 0.014;
      const target = Math.round(w * rate * 100) / 100;
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 1.25; // ~100 mg for 80kg
      const upperLimit = Math.round(w * rate);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Extremely low oral toxicity; massive excess may trigger restlessness, mild insomnia or headache.',
        organTarget: 'Central Nervous System',
      };
    },
  },
  {
    name: 'Riboflavin (B2)',
    category: 'B-Complex',
    unit: 'mg',
    shortDesc: 'FAD/FMN coenzymes & electron transport chain',
    physiologicalRole: 'Cellular respiration and beta-oxidation enzymes scale with mitochondrial density and lean tissue mass.',
    calculate: (w, sex) => {
      const rate = sex === 'male' ? 0.016 : 0.014;
      const target = Math.round(w * rate * 100) / 100;
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 1.0;
      const upperLimit = Math.round(w * rate);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Benign bright yellow urine (flavin excretion); minimal toxic ceiling but excessive renal burden at >100mg.',
        organTarget: 'Renal Clearance',
      };
    },
  },
  {
    name: 'Niacin (B3)',
    category: 'B-Complex',
    unit: 'mg NE',
    shortDesc: 'NAD+/NADH cellular energy & DNA repair (PARP)',
    physiologicalRole: 'Total body NAD pool turnover scales with basal metabolic rate and physical work capacity.',
    calculate: (w, sex) => {
      const rate = sex === 'male' ? 0.20 : 0.18;
      const target = Math.round(w * rate * 10) / 10;
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg NE`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 0.50; // 35-40 mg nicotinic acid flushing limit
      const upperLimit = Math.min(45, Math.round(w * rate));
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg NE (${rate} mg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Cutaneous vascular flushing, severe pruritus, hepatotoxicity with elevated liver transaminases, impaired glucose tolerance.',
        organTarget: 'Liver & Cutaneous Capillaries',
      };
    },
  },
  {
    name: 'Vitamin B5 (Pantothenic Acid)',
    category: 'B-Complex',
    unit: 'mg',
    shortDesc: 'Coenzyme A (CoA) synthesis & fatty acid oxidation',
    physiologicalRole: 'Krebs cycle and steroid hormone synthesis substrate requirements scale with active organ weight.',
    calculate: (w) => {
      const rate = 0.065;
      const target = Math.round(w * rate * 10) / 10;
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 2.5; // ~200 mg for 80kg
      const upperLimit = Math.round(w * rate);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Gastrointestinal distress, osmotic diarrhea, water retention.',
        organTarget: 'Gastrointestinal Tract',
      };
    },
  },
  {
    name: 'Vitamin B6',
    category: 'B-Complex',
    unit: 'mg',
    shortDesc: 'Amino acid transamination & glycogen phosphorylase',
    physiologicalRole: 'PLP coenzyme requirements scale strictly with dietary protein intake and muscle protein mass.',
    calculate: (w, sex, age) => {
      const baseRate = age > 50 ? (sex === 'male' ? 0.022 : 0.020) : (sex === 'male' ? 0.017 : 0.016);
      const target = Math.round(w * baseRate * 100) / 100;
      return {
        target,
        ratePerKg: baseRate,
        formulaLabel: `${baseRate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 0.35; // ~25 mg EFSA upper limit cap
      const upperLimit = Math.min(25, Math.round(w * rate));
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg EFSA cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Sensory peripheral neuropathy, axonal degeneration, progressive ataxia, numbness and paresthesia in feet/hands.',
        organTarget: 'Peripheral Nervous System (Sensory Neurons)',
      };
    },
  },
  {
    name: 'Biotin (B7)',
    category: 'B-Complex',
    unit: 'µg',
    shortDesc: 'Carboxylase coenzyme for gluconeogenesis & fatty acids',
    physiologicalRole: 'Substrate flux through pyruvate and acetyl-CoA carboxylases scales with energy metabolism volume.',
    calculate: (w) => {
      const rate = 0.40;
      const target = Math.round(w * rate);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} µg/kg × ${w} kg = ${target} µg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 12.5; // ~1000 µg
      const upperLimit = Math.round(w * rate);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} µg (${rate} µg/kg)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Clinically causes false-positive or false-negative troponin, thyroid (TSH/fT4), and cardiac lab assay interference.',
        organTarget: 'Diagnostic Lab Assay Interference',
      };
    },
  },
  {
    name: 'Folate (B9)',
    category: 'B-Complex',
    unit: 'µg DFE',
    shortDesc: 'One-carbon metabolism, DNA methylation & hematopoiesis',
    physiologicalRole: 'Erythrocyte generation and mucosal epithelial renewal volume scale directly with blood and body mass.',
    calculate: (w) => {
      const rate = 5.0;
      const target = Math.round(w * rate);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} µg/kg × ${w} kg = ${target} µg DFE`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 12.5; // 1000 µg synthetic folic acid cap
      const upperLimit = Math.min(1000, Math.round(w * rate));
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} µg DFE (${rate} µg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Masks insidious hematological signs of Vitamin B12 deficiency while subacute combined spinal cord degeneration progresses.',
        organTarget: 'Central Nervous System (Spinal Cord)',
      };
    },
  },
  {
    name: 'Vitamin B12',
    category: 'B-Complex',
    unit: 'µg',
    shortDesc: 'Methionine synthase & myelin sheath preservation',
    physiologicalRole: 'Cobalamin maintenance of total peripheral nervous system axon length and bone marrow volume.',
    calculate: (w) => {
      const rate = 0.030;
      const target = Math.round(w * rate * 10) / 10;
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} µg/kg × ${w} kg = ${target} µg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 12.5; // ~1000 µg
      const upperLimit = Math.round(w * rate);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} µg (${rate} µg/kg)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Extremely well tolerated water-soluble vitamin; extreme mega-doses (>1000 µg) can trigger acneiform flare-ups and palpitations.',
        organTarget: 'Dermatological Balance',
      };
    },
  },
  {
    name: 'Choline',
    category: 'B-Complex',
    unit: 'mg',
    shortDesc: 'Phosphatidylcholine membranes, VLDL export & acetylcholine',
    physiologicalRole: 'Cell membrane surface area and hepatic phospholipid synthesis capacity scale with body mass.',
    calculate: (w, sex) => {
      const rate = sex === 'male' ? 6.9 : 5.6;
      const target = Math.round(w * rate);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 43.75; // 3500 mg cap for 80kg
      const upperLimit = Math.min(3500, Math.round(w * rate));
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Hypotension, fishy body odor (trimethylaminuria), excessive sweating, salivation, hepatic triglyceride accumulation.',
        organTarget: 'Cardiovascular & Hepatic Systems',
      };
    },
  },

  // --- MINERALS & ELECTROLYTES ---
  {
    name: 'Calcium',
    category: 'Minerals & Electrolytes',
    unit: 'mg',
    shortDesc: 'Skeletal hydroxyapatite reserve & muscular contraction',
    physiologicalRole: 'Bone mineral volume, extracellular signaling pool, and sarcomere recruitment mass scale with weight.',
    calculate: (w, sex, age) => {
      const rate = (age > 70 || (sex === 'female' && age > 50)) ? 15.0 : 12.5;
      const target = Math.round(w * rate);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 31.25; // 2500 mg cap for 80kg
      const upperLimit = Math.min(2500, Math.round(w * rate));
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Hypercalcemia, nephrolithiasis (kidney stones), vascular calcification, milk-alkali syndrome, competitive inhibition of iron & zinc absorption.',
        organTarget: 'Renal & Vascular Systems',
      };
    },
  },
  {
    name: 'Magnesium',
    category: 'Minerals & Electrolytes',
    unit: 'mg',
    shortDesc: 'ATP-Mg complex stability, neuromuscular & enzymatic cofactor',
    physiologicalRole: 'Intracellular active soft tissue mass and ATP utilization flux scale per kg bodyweight.',
    calculate: (w, sex) => {
      const rate = sex === 'male' ? 5.25 : 4.0;
      const target = Math.round(w * rate);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 5.0; // Supplemental non-food UL ~350-400 mg
      const upperLimit = Math.min(450, Math.round(w * rate));
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max supplemental safe: ≤${upperLimit} mg (${rate} mg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Osmotic diarrhea, gastrointestinal spasms, hypermagnesemia, profound hypotension, respiratory depression.',
        organTarget: 'Gastrointestinal & Neuromuscular Systems',
      };
    },
  },
  {
    name: 'Potassium',
    category: 'Minerals & Electrolytes',
    unit: 'mg',
    shortDesc: 'Intracellular osmotic pressure & cardiomyocyte repolarization',
    physiologicalRole: 'Intracellular water compartment volume (~0.40 L/kg bodyweight) dictates potassium holding capacity.',
    calculate: (w, sex) => {
      const rate = sex === 'male' ? 42.5 : 37.5;
      const target = Math.round(w * rate);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 65.0; // Food is safe; high supplemental doses risk acute cardiac events
      const upperLimit = Math.round(w * rate);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Upper threshold: ≤${upperLimit} mg (${rate} mg/kg)`,
        warningThreshold: Math.round(upperLimit * 0.85),
        toxicityRisks: 'Hyperkalemia, cardiac conduction abnormalities, dangerous arrhythmias, heart block, ventricular fibrillation.',
        organTarget: 'Cardiomyocyte Electrical Conduction',
      };
    },
  },
  {
    name: 'Phosphorus',
    category: 'Minerals & Electrolytes',
    unit: 'mg',
    shortDesc: 'Phosphocreatine, ATP bonds & bone hydroxyapatite',
    physiologicalRole: 'Skeletal mass and skeletal muscle phosphocreatine pool volume scale per kg of bodyweight.',
    calculate: (w) => {
      const rate = 8.75;
      const target = Math.round(w * rate);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 50.0; // 4000 mg cap for 80kg
      const upperLimit = Math.min(4000, Math.round(w * rate));
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Hyperphosphatemia, secondary hyperparathyroidism, accelerated vascular and coronary calcification, bone loss.',
        organTarget: 'Renal & Cardiovascular Systems',
      };
    },
  },

  // --- TRACE ELEMENTS ---
  {
    name: 'Iron',
    category: 'Trace Elements',
    unit: 'mg',
    shortDesc: 'Hemoglobin oxygen transport & myoglobin muscle stores',
    physiologicalRole: 'Circulating red blood cell volume (approx 70 mL blood per kg) and total myoglobin mass dictate iron need.',
    calculate: (w, sex, age) => {
      const rate = (sex === 'female' && age <= 50) ? 0.25 : 0.10;
      const target = Math.round(w * rate * 10) / 10;
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 0.56; // 45 mg cap for 80kg
      const upperLimit = Math.min(45, Math.round(w * rate));
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Hemochromatosis, reactive oxygen species lipid peroxidation, hepatic fibrosis, organ iron hemosiderin deposits.',
        organTarget: 'Liver, Heart & Pancreas',
      };
    },
  },
  {
    name: 'Zinc',
    category: 'Trace Elements',
    unit: 'mg',
    shortDesc: 'Over 300 metalloenzymes, testosterone & immune signaling',
    physiologicalRole: 'Carbonic anhydrase, DNA polymerase, and testosterone synthesis turnover scale with active tissue mass.',
    calculate: (w, sex) => {
      const rate = sex === 'male' ? 0.14 : 0.11;
      const target = Math.round(w * rate * 10) / 10;
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 0.50; // 40 mg cap for 80kg (EFSA/NIH UL 25-40 mg)
      const upperLimit = Math.min(40, Math.round(w * rate));
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Severe copper depletion via intestinal metallothionein trapping, microcytic anemia, neutropenia, impaired HDL cholesterol profile.',
        organTarget: 'Hematological System & Copper Bioavailability',
      };
    },
  },
  {
    name: 'Copper',
    category: 'Trace Elements',
    unit: 'mg',
    shortDesc: 'Cytochrome c oxidase (Complex IV) & ceruloplasmin ferroxidase',
    physiologicalRole: 'Respiratory chain Complex IV units scale with muscle mitochondrial volume and bodyweight.',
    calculate: (w) => {
      const rate = 0.012;
      const target = Math.round(w * rate * 100) / 100;
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 0.065; // ~5 mg cap for 80kg
      const upperLimit = Math.min(5.0, Math.round(w * rate * 10) / 10);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Acute hepatic necrosis, gastrointestinal mucosal ulceration, intravascular hemolysis, renal tubular damage.',
        organTarget: 'Liver & Kidneys',
      };
    },
  },
  {
    name: 'Manganese',
    category: 'Trace Elements',
    unit: 'mg',
    shortDesc: 'Mitochondrial Mn-SOD antioxidant & cartilage proteoglycans',
    physiologicalRole: 'Superoxide dismutase protection in mitochondria and glycosyltransferases in connective tissue.',
    calculate: (w) => {
      const rate = 0.030;
      const target = Math.round(w * rate * 100) / 100;
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} mg/kg × ${w} kg = ${target} mg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 0.1375; // 11 mg cap for 80kg
      const upperLimit = Math.min(11.0, Math.round(w * rate * 10) / 10);
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} mg (${rate} mg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Manganism neurotoxicity: irreversible Parkinsonian-like tremors, rigidity, dystonia, cognitive and psychiatric disturbances.',
        organTarget: 'Basal Ganglia & Central Nervous System',
      };
    },
  },
  {
    name: 'Selenium',
    category: 'Trace Elements',
    unit: 'µg',
    shortDesc: 'Glutathione peroxidase (GPx) & thyroid deiodinases',
    physiologicalRole: 'Selenoprotein synthesis scales with total active organ and muscle tissue mass.',
    calculate: (w) => {
      const rate = 0.80;
      const target = Math.round(w * rate * 10) / 10;
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} µg/kg × ${w} kg = ${target} µg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 4.0; // ~300-400 µg (EFSA cap 300 µg, NIH cap 400 µg)
      const upperLimit = Math.min(400, Math.round(w * rate));
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} µg (${rate} µg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Selenosis: brittle nails, severe alopecia (hair loss), garlic-like breath odor, peripheral neuropathy, fatigue, gastrointestinal upset.',
        organTarget: 'Integumentary & Peripheral Nervous System',
      };
    },
  },
  {
    name: 'Iodine',
    category: 'Trace Elements',
    unit: 'µg',
    shortDesc: 'Thyroid hormones (T4/T3) & basal metabolic rate',
    physiologicalRole: 'Governs basal cellular oxygen consumption and thermogenesis across total body tissue mass.',
    calculate: (w) => {
      const rate = 2.10;
      const target = Math.round(w * rate);
      return {
        target,
        ratePerKg: rate,
        formulaLabel: `${rate} µg/kg × ${w} kg = ${target} µg`,
      };
    },
    calculateUpperLimit: (w) => {
      const rate = 10.0; // 600-1100 µg
      const upperLimit = Math.min(1000, Math.round(w * rate));
      return {
        upperLimit,
        dangerRatePerKg: rate,
        formulaLabel: `Max safe: ≤${upperLimit} µg (${rate} µg/kg cap)`,
        warningThreshold: Math.round(upperLimit * 0.8),
        toxicityRisks: 'Iodine-induced thyroiditis (Wolff-Chaikoff effect), thyroid hyperplasia/goiter, elevated TSH, brassy taste in mouth.',
        organTarget: 'Thyroid Gland',
      };
    },
  },
];

/**
 * Convenience helper to get calculated targets and danger zones keyed by nutrient name.
 */
export function getBodyweightMicroTargets(profile: {
  weight: number;
  sex: string;
  age: number;
}) {
  const w = Math.max(35, Math.min(250, Number(profile.weight) || 75));
  const sex = profile.sex || 'male';
  const age = Math.max(18, Number(profile.age) || 25);

  return BODYWEIGHT_MICRONUTRIENTS.map((def) => {
    const calc = def.calculate(w, sex, age);
    const danger = def.calculateUpperLimit(w, sex, age);
    return {
      name: def.name,
      category: def.category,
      unit: def.unit,
      target: calc.target,
      ratePerKg: calc.ratePerKg,
      formulaLabel: calc.formulaLabel,
      shortDesc: def.shortDesc,
      physiologicalRole: def.physiologicalRole,
      dangerZone: danger,
    };
  });
}

export type DangerZoneStatus = 'optimal' | 'approaching' | 'danger';

/**
 * Assesses the danger zone state of a specific nutrient intake relative to bodyweight upper limit.
 */
export function assessMicroDanger(
  nutrientName: string,
  currentAmount: number,
  profile: { weight: number; sex: string; age: number }
): {
  status: DangerZoneStatus;
  percentageOfUpperLimit: number;
  upperLimit: number;
  warningThreshold: number;
  dangerRatePerKg: number;
  unit: string;
  toxicityRisks: string;
  organTarget: string;
  formulaLabel: string;
  alertText: string | null;
} {
  const def = BODYWEIGHT_MICRONUTRIENTS.find((m) => m.name === nutrientName);
  if (!def) {
    return {
      status: 'optimal',
      percentageOfUpperLimit: 0,
      upperLimit: 0,
      warningThreshold: 0,
      dangerRatePerKg: 0,
      unit: '',
      toxicityRisks: '',
      organTarget: '',
      formulaLabel: '',
      alertText: null,
    };
  }

  const w = Math.max(35, Math.min(250, Number(profile.weight) || 75));
  const danger = def.calculateUpperLimit(w, profile.sex || 'male', profile.age || 25);
  const pct = danger.upperLimit > 0 ? (currentAmount / danger.upperLimit) * 100 : 0;

  let status: DangerZoneStatus = 'optimal';
  let alertText: string | null = null;

  if (currentAmount >= danger.upperLimit) {
    status = 'danger';
    alertText = `🚨 DANGER ZONE EXCEEDED: ${currentAmount} ${def.unit} is ${Math.round(pct)}% of the safe upper limit for ${w}kg bodyweight (max safe: ${danger.upperLimit} ${def.unit}). Risk: ${danger.toxicityRisks}`;
  } else if (currentAmount >= danger.warningThreshold) {
    status = 'approaching';
    alertText = `⚠️ APPROACHING DANGER THRESHOLD: ${currentAmount} ${def.unit} (${Math.round(pct)}% of upper limit). Monitor supplemental intake.`;
  }

  return {
    status,
    percentageOfUpperLimit: Math.round(pct),
    upperLimit: danger.upperLimit,
    warningThreshold: danger.warningThreshold,
    dangerRatePerKg: danger.dangerRatePerKg,
    unit: def.unit,
    toxicityRisks: danger.toxicityRisks,
    organTarget: danger.organTarget,
    formulaLabel: danger.formulaLabel,
    alertText,
  };
}
