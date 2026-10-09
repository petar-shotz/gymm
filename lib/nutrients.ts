export interface FoodItemLike {
  id?: string;
  name?: string;
  meal?: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingGrams?: number;
  perServing?: boolean;
  isSupplement?: boolean;
  [key: string]: unknown;
}

/**
 * Calculates the exact nutrient value for a food or supplement item.
 * Supports:
 * 1. Standard whole foods (nutrients per 100g)
 * 2. Per-serving supplements (exact grams per scoop/dose)
 * 3. Dedicated 'Supplements' meal items and Macedonian catalog items
 * 4. Legacy supplement entries stored with direct per-serving values (e.g. 30g protein for 30g scoop)
 */
export function calculateFoodNutrient(
  f: FoodItemLike,
  key: 'kcal' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar' | 'sodium' | string
): number {
  if (!f) return 0;
  const val = Number(f[key]) || 0;

  // 1. Explicit perServing flag (e.g. from the supplement modal or catalog logger)
  if (f.perServing) {
    const servingSize = Number(f.servingGrams) || Number(f.grams) || 30;
    const currentGrams = Number(f.grams) || servingSize;
    const ratio = servingSize > 0 ? currentGrams / servingSize : 1;
    return val * ratio;
  }

  // 2. Explicitly logged under 'Supplements' meal or marked as supplement
  if (f.isSupplement || f.meal === 'Supplements') {
    const baseGrams = Number(f.servingGrams) || Number(f.grams) || 30;
    const currentGrams = Number(f.grams) || baseGrams;
    const ratio = baseGrams > 0 ? currentGrams / baseGrams : 1;
    return val * ratio;
  }

  // 3. Detect legacy or custom supplement entries stored with direct serving values
  // e.g. 30g protein for 30g scoop, which mistakenly evaluated to (30 * 30)/100 = 9g
  const nameLower = (f.name || '').toLowerCase();
  const isNamedSupplement =
    nameLower.includes('whey') ||
    nameLower.includes('protein') ||
    nameLower.includes('gainer') ||
    nameLower.includes('isolate') ||
    nameLower.includes('bcaa') ||
    nameLower.includes('creatine') ||
    nameLower.includes('animal') ||
    nameLower.includes('biotech') ||
    nameLower.includes('optimum') ||
    nameLower.includes('scitec') ||
    nameLower.includes('dymatize') ||
    nameLower.includes('applied') ||
    nameLower.includes('supplement') ||
    nameLower.includes('zma') ||
    nameLower.includes('omega');

  const hasSupplementMacroSignature =
    (Number(f.grams) <= 50 && Number(f.protein) >= 15) ||
    (Number(f.grams) === 30 && (Number(f.protein) === 30 || Number(f.protein) === 24 || Number(f.protein) === 25 || Number(f.protein) === 21));

  if (isNamedSupplement || hasSupplementMacroSignature) {
    // Check if the nutrient was stored as a direct serving value
    // If scaled per-100g would drastically reduce it (e.g. 30g * 30 / 100 = 9g), it's a direct serving value
    if (Number(f.protein) > 0 && (Number(f.protein) * Number(f.grams)) / 100 < Number(f.protein) * 0.75) {
      const base = Number(f.servingGrams) || 30;
      const current = Number(f.grams) || base;
      const ratio = current !== base && base > 0 ? current / base : 1;
      return val * ratio;
    }
    // If protein is 0 or not dominant (e.g. creatine, preworkout, omega-3) and grams <= 50
    if (Number(f.grams) <= 40 && val > 0 && (val * Number(f.grams)) / 100 < val * 0.5) {
      return val;
    }
  }

  // Standard whole food (per 100g)
  return (val * (Number(f.grams) || 0)) / 100;
}

export function calculateDayTotalKcal(foods: FoodItemLike[]): number {
  if (!Array.isArray(foods)) return 0;
  return Math.round(foods.reduce((sum, f) => sum + calculateFoodNutrient(f, 'kcal'), 0));
}

export function isSupplementFood(f?: FoodItemLike): boolean {
  if (!f) return false;
  if (f.isSupplement || f.perServing || f.meal === 'Supplements') return true;
  const nameLower = (f.name || '').toLowerCase();
  if (
    (nameLower.includes('whey') ||
      nameLower.includes('protein') ||
      nameLower.includes('gainer') ||
      nameLower.includes('isolate') ||
      nameLower.includes('bcaa') ||
      nameLower.includes('creatine')) &&
    Number(f.protein) > 0 &&
    Number(f.grams) <= 50
  ) {
    return true;
  }
  if (
    Number(f.grams) === 30 &&
    (Number(f.protein) === 30 ||
      Number(f.protein) === 24 ||
      Number(f.protein) === 25 ||
      Number(f.protein) === 21)
  ) {
    return true;
  }
  return false;
}
