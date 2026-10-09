export type PlanGoal = 'maintain' | 'cut' | 'bulk' | 'aggressive_cut' | 'aggressive_bulk';

export interface PlanConfig {
  id: PlanGoal;
  name: string;
  nameMk: string;
  badge: string;
  color: string;
  description: string;
  descriptionMk: string;
  calorieAdjustmentPercent: number; // e.g. -20% for cut, -28% for aggressive cut
  calorieAdjustmentFixed?: number;
  expectedWeightChangeKgPerWeek: number; // e.g. -0.5kg/week
  expectedWeightChangeDescMk: string;
  proteinPerKg: number; // e.g. 2.4g/kg on cut
  fatPerKg: number; // e.g. 0.8g/kg
  sugarMaxPercentCarbs: number; // recommended max sugar % of carbs (e.g. 20%)
  recommendedCardioSessions: string;
  resistanceFrequency: string;
  hydrationMultiplierMlPerKg: number;
  suitabilityMk: string;
}

export const FITNESS_PLANS: PlanConfig[] = [
  {
    id: 'maintain',
    name: 'Maintenance (Body Recomposition)',
    nameMk: 'Одржување & Рекомпозиција (Maintain)',
    badge: 'Баланс & Сила',
    color: '#10b981', // Emerald
    description: 'Maintain body weight while optimizing strength, muscle recovery, and metabolic health.',
    descriptionMk: 'Идеално за одржување телесна тежина, стекнување сила и истовремено топење масти со градење чиста мускулна маса.',
    calorieAdjustmentPercent: 0,
    expectedWeightChangeKgPerWeek: 0,
    expectedWeightChangeDescMk: 'Стабилна тежина (± 0.1 kg/недела)',
    proteinPerKg: 2.0,
    fatPerKg: 0.9,
    sugarMaxPercentCarbs: 22,
    recommendedCardioSessions: '2-3x неделно (20-30 мин умерена зона 2)',
    resistanceFrequency: '3-4 дена структуриран тренинг',
    hydrationMultiplierMlPerKg: 35,
    suitabilityMk: 'Погодно за секој што сака да остане на иста тежина, а да го подобри изгледот и кондицијата.',
  },
  {
    id: 'cut',
    name: 'Moderate Fat Loss (Cut)',
    nameMk: 'Умерен Cut (Топење Масти без Мускулна Загуба)',
    badge: 'Препорачано за Релјеф',
    color: '#06b6d4', // Cyan
    description: 'Moderate caloric deficit designed to burn fat sustainably while preserving maximum lean muscle tissue.',
    descriptionMk: 'Одржлив дефицит од ~18-20% кој топи вишок сало без пад на енергија и без ризик од губење мускули.',
    calorieAdjustmentPercent: -20,
    expectedWeightChangeKgPerWeek: -0.5,
    expectedWeightChangeDescMk: '-0.4 до -0.6 kg неделно (безбедно темпо)',
    proteinPerKg: 2.3, // Elevated protein for muscle retention during deficit
    fatPerKg: 0.75,
    sugarMaxPercentCarbs: 18,
    recommendedCardioSessions: '3-4x неделно (30-40 мин брзо одење / кардио)',
    resistanceFrequency: '4-5 дена интензивен тренинг со тежини',
    hydrationMultiplierMlPerKg: 38,
    suitabilityMk: 'Најдобар и најодржлив начин за дефинирање плочки и релјеф без гладување.',
  },
  {
    id: 'aggressive_cut',
    name: 'Aggressive Rapid Cut',
    nameMk: 'Агресивен Брз Cut (Максимална Брзина на Топење)',
    badge: 'Брзи Резултати (Краткотрајно)',
    color: '#ef4444', // Red
    description: 'Steeper 28% caloric deficit paired with high protein protection for fast fat loss before events or photo shoots.',
    descriptionMk: 'Длабок дефицит од 28% со максимум заштита на мускулите (2.6g протеин/kg). Се препорачува за 4-8 недели.',
    calorieAdjustmentPercent: -28,
    expectedWeightChangeKgPerWeek: -0.9,
    expectedWeightChangeDescMk: '-0.8 до -1.1 kg неделно',
    proteinPerKg: 2.6, // Maximum protein sparing
    fatPerKg: 0.65,
    sugarMaxPercentCarbs: 12,
    recommendedCardioSessions: '4-5x неделно (40 мин инклинирано одење или ниско-ударно кардио)',
    resistanceFrequency: '4 дена тренинг со тежини (сочувување на интензитет)',
    hydrationMultiplierMlPerKg: 42,
    suitabilityMk: 'За лица што сакаат брзи видливи резултати или имаат висок процент масти. Потребна е строга дисциплина.',
  },
  {
    id: 'bulk',
    name: 'Lean Bulk (Controlled Surplus)',
    nameMk: 'Квалитетен Чист Bulk (Lean Bulk)',
    badge: 'Чиста Мускулна Маса',
    color: '#3b82f6', // Blue
    description: 'Controlled ~12% caloric surplus to fuel hypertrophy and strength gains while keeping body fat accumulation minimal.',
    descriptionMk: 'Контролиран вишок од ~12% калории кој дава максимално гориво за мускулен раст без прекумерно сало.',
    calorieAdjustmentPercent: 12,
    expectedWeightChangeKgPerWeek: 0.3,
    expectedWeightChangeDescMk: '+0.25 до +0.35 kg неделно (чист мускулен раст)',
    proteinPerKg: 2.1,
    fatPerKg: 0.95,
    sugarMaxPercentCarbs: 25,
    recommendedCardioSessions: '2x неделно (20 мин за кардиоваскуларно здравје)',
    resistanceFrequency: '4-5 дена хипертрофија со прогресивно оптоварување',
    hydrationMultiplierMlPerKg: 36,
    suitabilityMk: 'Златен стандард за градење мускули без вишок стомак. Дозволува долготраен постојан напредок.',
  },
  {
    id: 'aggressive_bulk',
    name: 'Aggressive Mass Bulk',
    nameMk: 'Агресивен Bulk (Максимална Маса & Сила)',
    badge: 'Максимална Тежина & Сила',
    color: '#f97316', // Orange
    description: 'Generous 22% caloric surplus designed for hardgainers or powerlifters aiming to maximize absolute strength and weight.',
    descriptionMk: 'Голем калориски вишок од +22% со богати јаглехидрати. За брзо качување тежина и максимално рушење на PR рекорди.',
    calorieAdjustmentPercent: 22,
    expectedWeightChangeKgPerWeek: 0.65,
    expectedWeightChangeDescMk: '+0.5 до +0.8 kg неделно',
    proteinPerKg: 2.2,
    fatPerKg: 1.1,
    sugarMaxPercentCarbs: 28,
    recommendedCardioSessions: '1-2x неделно (лесно регенеративно)',
    resistanceFrequency: '4-5 дена тежок тренинг со голем волумен',
    hydrationMultiplierMlPerKg: 38,
    suitabilityMk: 'Идеално за „хардгејнери“ (луѓе што тешко качуваат тежина) и атлети кои бркаат сиров раст на сила.',
  },
];

export interface OptimizedPlanResult {
  plan: PlanConfig;
  bodyweightKg: number;
  sex: 'male' | 'female';
  baselineTdee: number;
  targetCalories: number;
  calorieDelta: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  sugarGramsTarget: number; // recommended ceiling
  sugarGramsPerCarbPercent: number;
  recommendedWaterMl: number;
  recommendedWaterGlasses: number;
  breakdown: {
    proteinKcal: number;
    carbsKcal: number;
    fatKcal: number;
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  };
}

/**
 * Optimizes nutrition goals precisely to body weight, sex, and chosen plan
 */
export function calculateOptimizedPlanNutrition(
  planId: PlanGoal,
  bodyweightKg: number,
  sex: 'male' | 'female' = 'male',
  customTdee?: number
): OptimizedPlanResult {
  const plan = FITNESS_PLANS.find((p) => p.id === planId) || FITNESS_PLANS[0];
  const bw = Math.max(35, Math.min(250, bodyweightKg));

  // If custom TDEE not provided, calculate clinical baseline (Mifflin-St Jeor moderate activity ~1.5)
  // Baseline ~ 32 kcal/kg for male, ~ 29 kcal/kg for female
  const baselineTdee = customTdee && customTdee > 1200
    ? customTdee
    : Math.round(bw * (sex === 'female' ? 29 : 32.5));

  // Caloric target
  const multiplier = 1 + plan.calorieAdjustmentPercent / 100;
  const targetCalories = Math.round(baselineTdee * multiplier);
  const calorieDelta = targetCalories - baselineTdee;

  // Protein grams based on clinical plan multiplier per kg
  const proteinGrams = Math.round(bw * plan.proteinPerKg);
  const proteinKcal = proteinGrams * 4;

  // Fat grams based on plan fat per kg
  const fatGrams = Math.round(bw * plan.fatPerKg);
  const fatKcal = fatGrams * 9;

  // Remaining calories go to Carbohydrates
  const remainingKcalForCarbs = Math.max(200, targetCalories - (proteinKcal + fatKcal));
  const carbsGrams = Math.round(remainingKcalForCarbs / 4);
  const carbsKcal = carbsGrams * 4;

  // Sugar recommendation: healthy ceiling % of total carbohydrates
  const sugarGramsTarget = Math.round(carbsGrams * (plan.sugarMaxPercentCarbs / 100));

  // Water target (ml)
  const baseWater = Math.round(bw * plan.hydrationMultiplierMlPerKg);
  const recommendedWaterMl = baseWater;
  const recommendedWaterGlasses = Math.round(recommendedWaterMl / 250);

  const totalCalculatedKcal = proteinKcal + carbsKcal + fatKcal;

  return {
    plan,
    bodyweightKg: bw,
    sex,
    baselineTdee,
    targetCalories,
    calorieDelta,
    proteinGrams,
    carbsGrams,
    fatGrams,
    sugarGramsTarget,
    sugarGramsPerCarbPercent: plan.sugarMaxPercentCarbs,
    recommendedWaterMl,
    recommendedWaterGlasses,
    breakdown: {
      proteinKcal,
      carbsKcal,
      fatKcal,
      proteinPercent: Math.round((proteinKcal / totalCalculatedKcal) * 100),
      carbsPercent: Math.round((carbsKcal / totalCalculatedKcal) * 100),
      fatPercent: Math.round((fatKcal / totalCalculatedKcal) * 100),
    },
  };
}
