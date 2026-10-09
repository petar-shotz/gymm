/**
 * Accurate Sports Science & Clinical Hydration Calculations
 * References:
 * - American College of Sports Medicine (ACSM): 35 ml/kg/day baseline
 * - European Food Safety Authority (EFSA) & Institute of Medicine (IOM):
 *   Baseline requirement of 30-38 ml/kg for adults, adjusted for biological sex
 *   and additional fluid replacement of 350-500 ml per workout session.
 */

export interface HydrationCalculation {
  ratePerKg: number; // ml per kg
  baselineMl: number;
  workoutBufferMl: number;
  totalTargetMl: number;
  totalGlasses: number;
  baselineGlasses: number;
  explanation: string;
}

export function calculateAccurateHydration(
  weightKg: number,
  sex: string = 'male',
  workoutCount: number = 0
): HydrationCalculation {
  const safeWeight = Math.max(30, Math.min(250, Number(weightKg) || 80));
  // Baseline physiological fluid requirement by biological sex:
  // Males: 35 ml/kg
  // Females: 33 ml/kg
  const ratePerKg = sex === 'female' ? 33 : 35;
  const baselineMl = Math.round(safeWeight * ratePerKg);

  // Exercise replenishment: ~350 ml per training session to replace sweat losses
  const workoutBufferMl = workoutCount > 0 ? Math.min(1000, workoutCount * 350) : 0;
  const totalTargetMl = baselineMl + workoutBufferMl;

  const baselineGlasses = Math.max(1, Math.round(baselineMl / 250));
  const totalGlasses = Math.max(1, Math.round(totalTargetMl / 250));

  const explanation = `${safeWeight} kg × ${ratePerKg} ml/kg baseline = ${baselineMl} ml (${baselineGlasses} glasses)` +
    (workoutBufferMl > 0 ? ` + ${workoutBufferMl} ml sweat replenishment for ${workoutCount} workout(s)` : '');

  return {
    ratePerKg,
    baselineMl,
    workoutBufferMl,
    totalTargetMl,
    totalGlasses,
    baselineGlasses,
    explanation,
  };
}
