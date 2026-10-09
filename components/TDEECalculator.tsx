'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  Zap,
  Check,
  TrendingDown,
  TrendingUp,
  Droplets,
  Scale,
  Sparkles,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Sun,
} from 'lucide-react';
import { calculateAccurateHydration } from '@/lib/hydration';
import { calculateDayTotalKcal, type FoodItemLike } from '@/lib/nutrients';

export interface DailyLogEntry {
  day: number;
  dateStr: string;
  weightInput: string; // string so deleting doesn't cause leading 0
  caloriesInput: string; // string so deleting doesn't cause leading 0
}

interface TDEECalculatorProps {
  initialWeightKg?: number;
  initialAge?: number;
  initialSex?: string;
  existingRecords?: Record<string, unknown>;
  onApplyTargets?: (targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  }) => void;
  saving?: boolean;
}

export type UnitSystem = 'metric' | 'imperial';
export type Gender = 'male' | 'female';
export type Formula = 'mifflin' | 'katch' | 'harris' | 'cunningham';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'very'
  | 'extreme';

export type Goal =
  | 'cut_aggressive'
  | 'cut_moderate'
  | 'cut_mild'
  | 'maintenance'
  | 'bulk_clean'
  | 'bulk_aggressive';

export type MacroPreset =
  | 'high_protein'
  | 'balanced'
  | 'low_carb'
  | 'high_carb';

const activityMultipliers: Record<ActivityLevel, { factor: number; label: string; desc: string }> = {
  sedentary: { factor: 1.2, label: 'Sedentary', desc: 'Desk job, little or no structured exercise' },
  light: { factor: 1.375, label: 'Lightly Active', desc: '1–2 workouts/week or 5,000–7,000 steps/day' },
  moderate: { factor: 1.55, label: 'Moderately Active', desc: '3–5 workouts/week or 8,000–11,000 steps/day' },
  very: { factor: 1.725, label: 'Very Active', desc: '6–7 intense training sessions or physically active job' },
  extreme: { factor: 1.9, label: 'Extremely Active', desc: 'Twice daily training, endurance athlete, heavy labor' },
};

const goalModifiers: Record<
  Goal,
  { factor: number; label: string; tag: string; weeklyChangeKg: number; type: 'cut' | 'maintenance' | 'bulk' }
> = {
  cut_aggressive: { factor: 0.75, label: 'Aggressive Cut (-25%)', tag: 'Rapid Fat Loss', weeklyChangeKg: -0.75, type: 'cut' },
  cut_moderate: { factor: 0.8, label: 'Moderate Cut (-20%)', tag: 'Recommended Fat Loss', weeklyChangeKg: -0.5, type: 'cut' },
  cut_mild: { factor: 0.9, label: 'Mild Deficit (-10%)', tag: 'Lean Recomp / Slow Cut', weeklyChangeKg: -0.25, type: 'cut' },
  maintenance: { factor: 1.0, label: 'Maintenance (0%)', tag: 'Weight Equilibrium', weeklyChangeKg: 0, type: 'maintenance' },
  bulk_clean: { factor: 1.1, label: 'Clean Lean Bulk (+10%)', tag: 'Muscle Hypertrophy with minimal fat', weeklyChangeKg: 0.25, type: 'bulk' },
  bulk_aggressive: { factor: 1.18, label: 'Aggressive Bulk (+18%)', tag: 'Maximum Mass & Strength Growth', weeklyChangeKg: 0.45, type: 'bulk' },
};

const macroPresets: Record<
  MacroPreset,
  { label: string; proteinPct: number; carbsPct: number; fatPct: number; note: string }
> = {
  high_protein: {
    label: 'High Protein / Bodybuilding',
    proteinPct: 40,
    carbsPct: 35,
    fatPct: 25,
    note: 'Maximizes muscle retention & satiety during cut or lean mass during bulk',
  },
  balanced: {
    label: 'Balanced Athletic',
    proteinPct: 30,
    carbsPct: 45,
    fatPct: 25,
    note: 'Sustained energy and glycogen replenishment for mixed training',
  },
  low_carb: {
    label: 'Low Carb / High Fat',
    proteinPct: 35,
    carbsPct: 20,
    fatPct: 45,
    note: 'Lower glycemic impact, higher dietary fats for hormonal support',
  },
  high_carb: {
    label: 'High Carb / Performance',
    proteinPct: 25,
    carbsPct: 55,
    fatPct: 20,
    note: 'Fuel for competitive endurance athletes and explosive training',
  },
};

export function findEarliestLogDate(records?: Record<string, unknown>): string | null {
  if (!records) return null;
  const loggedDates: string[] = [];
  for (const [key, val] of Object.entries(records)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && val && typeof val === 'object') {
      const rec = val as { foods?: unknown[]; morningWeight?: number };
      const hasFoods = Array.isArray(rec.foods) && rec.foods.length > 0;
      const hasWeight = typeof rec.morningWeight === 'number' && rec.morningWeight > 0;
      if (hasFoods || hasWeight) {
        loggedDates.push(key);
      }
    }
  }
  if (loggedDates.length === 0) return null;
  loggedDates.sort();
  return loggedDates[0];
}

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function generate21DaysFromStart(startDateStr: string, existingEntries?: DailyLogEntry[]): DailyLogEntry[] {
  const entries: DailyLogEntry[] = [];
  const parts = startDateStr.split('-').map(Number);
  const start = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);

  const prevByDate = new Map<string, { weightInput: string; caloriesInput: string }>();
  if (existingEntries) {
    for (const e of existingEntries) {
      if (e.dateStr) {
        prevByDate.set(e.dateStr, { weightInput: e.weightInput, caloriesInput: e.caloriesInput });
      }
    }
  }

  for (let i = 1; i <= 21; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + (i - 1));
    const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    const prev = prevByDate.get(dateStr);
    entries.push({
      day: i,
      dateStr,
      weightInput: prev?.weightInput || '',
      caloriesInput: prev?.caloriesInput || '',
    });
  }
  return entries;
}

function formatDateLabel(dateStr: string): string {
  try {
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function TDEECalculator({
  initialWeightKg = 80,
  initialAge = 25,
  initialSex = 'male',
  existingRecords,
  onApplyTargets,
  saving = false,
}: TDEECalculatorProps) {
  // Mode switcher: 'adaptive21' (TrainForge 21-Day Engine) or 'formula' (Theoretical Equations)
  const [calculatorMode, setCalculatorMode] = useState<'adaptive21' | 'formula'>('adaptive21');

  // Unit System
  const [unit, setUnit] = useState<UnitSystem>('metric');

  // Core Inputs for Formula Mode
  const [gender, setGender] = useState<Gender>(initialSex === 'female' ? 'female' : 'male');
  const [age, setAge] = useState<number>(initialAge || 25);
  const [ageInput, setAgeInput] = useState<string>(String(initialAge || 25));

  const [heightCm, setHeightCm] = useState<number>(178);
  const [heightCmInput, setHeightCmInput] = useState<string>('178');
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightFtInput, setHeightFtInput] = useState<string>('5');
  const [heightIn, setHeightIn] = useState<number>(10);
  const [heightInInput, setHeightInInput] = useState<string>('10');

  const [weightKg, setWeightKg] = useState<number>(initialWeightKg || 80);
  const [weightKgInput, setWeightKgInput] = useState<string>(String(initialWeightKg || 80));
  const [weightLbsInput, setWeightLbsInput] = useState<string>(
    String(Math.round((initialWeightKg || 80) * 2.20462))
  );

  const [useBodyFat, setUseBodyFat] = useState<boolean>(true);
  const [bodyFat, setBodyFat] = useState<number>(15);
  const [formula, setFormula] = useState<Formula>('mifflin');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintenance');
  const [macroPreset, setMacroPreset] = useState<MacroPreset>('high_protein');

  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 21-DAY ADAPTIVE ENGINE STATE & LOGIC (TrainForge Advanced)
  // Day 1 starts from the user's first logged date
  // -------------------------------------------------------------
  const [userStartDate, setUserStartDate] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedStart = localStorage.getItem('trainforge_21day_start_date');
      if (savedStart && /^\d{4}-\d{2}-\d{2}$/.test(savedStart)) {
        return savedStart;
      }
    }
    return null;
  });

  const todayStr = useMemo(() => {
    return getTodayDateStr();
  }, []);

  const earliestRecordDate = useMemo(() => {
    return findEarliestLogDate(existingRecords);
  }, [existingRecords]);

  // Day 1 of the 21 days: uses user preference, or earliest logged date from food/weight journal, or today
  const startDate = userStartDate || earliestRecordDate || todayStr;

  const cycleDates = useMemo(() => {
    const parts = startDate.split('-').map(Number);
    const start = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    return Array.from({ length: 21 }, (_, idx) => {
      const cur = new Date(start);
      cur.setDate(start.getDate() + idx);
      return `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    });
  }, [startDate]);

  const cycleEndDateStr = cycleDates[20];

  const todayDayNumber = useMemo(() => {
    const p1 = startDate.split('-').map(Number);
    const start = new Date(p1[0], p1[1] - 1, p1[2], 12, 0, 0);
    const p2 = todayStr.split('-').map(Number);
    const today = new Date(p2[0], p2[1] - 1, p2[2], 12, 0, 0);
    const diffDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }, [startDate, todayStr]);

  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>(() => {
    const initialStart = (() => {
      if (typeof window !== 'undefined') {
        const savedStart = localStorage.getItem('trainforge_21day_start_date');
        if (savedStart && /^\d{4}-\d{2}-\d{2}$/.test(savedStart)) {
          return savedStart;
        }
      }
      return findEarliestLogDate(existingRecords) || getTodayDateStr();
    })();

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('trainforge_21day_adaptive_logs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 21) {
            return generate21DaysFromStart(initialStart, parsed);
          }
        }
      } catch {}
    }
    return generate21DaysFromStart(initialStart);
  });

  // Save 21-day log to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('trainforge_21day_adaptive_logs', JSON.stringify(dailyLogs));
    } catch {}
  }, [dailyLogs]);

  const handleStartDateChange = (newStartStr: string) => {
    if (!newStartStr || !/^\d{4}-\d{2}-\d{2}$/.test(newStartStr)) return;
    setUserStartDate(newStartStr);
    try {
      localStorage.setItem('trainforge_21day_start_date', newStartStr);
    } catch {}
    setDailyLogs((prev) => generate21DaysFromStart(newStartStr, prev));
  };

  const anchorToFirstLog = () => {
    const target = earliestRecordDate || todayStr;
    handleStartDateChange(target);
    setAppliedNotification(
      `21-Day tracking period anchored to start from Day 1 on ${formatDateLabel(target)}!`
    );
    setTimeout(() => setAppliedNotification(null), 5000);
  };

  // Automatically derive calories & morning weight from existingRecords (Food Journal & Daily Logs)
  const effectiveDailyLogs = useMemo(() => {
    const inputsByDate = new Map<string, { weightInput: string; caloriesInput: string }>();
    dailyLogs.forEach((l) => {
      if (l.dateStr) {
        inputsByDate.set(l.dateStr, { weightInput: l.weightInput, caloriesInput: l.caloriesInput });
      }
    });

    return cycleDates.map((dateStr, idx) => {
      const stored = inputsByDate.get(dateStr) || dailyLogs[idx];
      let weightInput = stored?.weightInput || '';
      let caloriesInput = stored?.caloriesInput || '';

      if (existingRecords) {
        const record = existingRecords[dateStr];
        if (record && typeof record === 'object') {
          // 1. Auto-load calories from logged foods & supplements in the nutrition journal if not manually entered
          if ('foods' in record) {
            const foods = (record as { foods: FoodItemLike[] }).foods || [];
            const totalKcal = calculateDayTotalKcal(foods);
            if (totalKcal > 0 && !caloriesInput) {
              caloriesInput = String(totalKcal);
            }
          }
          // 2. Auto-load morning weight if logged in daily journal
          if ('morningWeight' in record) {
            const mW = (record as { morningWeight?: number }).morningWeight;
            if (mW && mW > 0 && !weightInput) {
              weightInput =
                unit === 'imperial'
                  ? String(Math.round(mW * 2.20462 * 10) / 10)
                  : String(mW);
            }
          }
        }
      }
      return {
        day: idx + 1,
        dateStr,
        weightInput,
        caloriesInput,
      };
    });
  }, [cycleDates, dailyLogs, existingRecords, unit]);

  const todayIndex = useMemo(() => {
    return effectiveDailyLogs.findIndex((d) => d.dateStr === todayStr);
  }, [effectiveDailyLogs, todayStr]);

  const todayEntry = todayIndex >= 0 ? effectiveDailyLogs[todayIndex] : effectiveDailyLogs[effectiveDailyLogs.length - 1];
  const isTodayWeightLogged = Boolean(
    todayEntry && todayEntry.weightInput && parseFloat(todayEntry.weightInput) > 0
  );
  const [morningWeightInput, setMorningWeightInput] = useState<string>('');

  // Update a single day entry in the 21-day log
  const updateDay = (index: number, field: 'weightInput' | 'caloriesInput', val: string) => {
    setDailyLogs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  // Scenario Presets for Testing & Demonstration
  const loadScenario = (scenario: 'cut' | 'bulk' | 'maintain') => {
    const baseW = weightKg || 80;
    const entries: DailyLogEntry[] = [];
    const parts = startDate.split('-').map(Number);
    const start = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);

    for (let i = 1; i <= 21; i++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + (i - 1));
      const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;

      // Introduce realistic day-to-day fluctuations (+/- 0.3 kg water noise)
      const noise = ((i % 5) - 2) * 0.12;
      let wKg = baseW;
      let kcal = 2400;

      if (scenario === 'cut') {
        // User is losing ~0.45 kg/week, eating ~2,150 kcal/day (true TDEE ~2,645 kcal)
        const progressKg = (i - 1) * (0.45 / 7);
        wKg = Math.round((baseW - progressKg + noise) * 10) / 10;
        kcal = 2100 + ((i % 4) * 35);
      } else if (scenario === 'bulk') {
        // User is gaining ~0.28 kg/week, eating ~2,850 kcal/day (true TDEE ~2,540 kcal)
        const progressKg = (i - 1) * (0.28 / 7);
        wKg = Math.round((baseW + progressKg + noise) * 10) / 10;
        kcal = 2850 + ((i % 3) * 50);
      } else {
        // Maintaining ~80kg, eating ~2,420 kcal/day (true TDEE ~2,420 kcal)
        wKg = Math.round((baseW + noise) * 10) / 10;
        kcal = 2400 + ((i % 6) * 30);
      }

      const displayWeight =
        unit === 'imperial'
          ? String(Math.round(wKg * 2.20462 * 10) / 10)
          : String(wKg);

      entries.push({
        day: i,
        dateStr,
        weightInput: displayWeight,
        caloriesInput: String(kcal),
      });
    }
    setDailyLogs(entries);
  };

  // Pull from existing food journal records if available
  const pullFromJournal = () => {
    if (!existingRecords) return;
    setDailyLogs((prev) => {
      const next = [...prev];
      let importedCount = 0;
      next.forEach((entry, idx) => {
        const record = existingRecords[entry.dateStr];
        if (record && typeof record === 'object' && 'foods' in record) {
          const foods = (record as { foods: FoodItemLike[] }).foods || [];
          const totalKcal = calculateDayTotalKcal(foods);
          if (totalKcal > 0) {
            next[idx] = { ...entry, caloriesInput: String(totalKcal) };
            importedCount++;
          }
        }
      });
      if (importedCount > 0) {
        setAppliedNotification(`Imported ${importedCount} logged days from your Ember Food Journal!`);
        setTimeout(() => setAppliedNotification(null), 5000);
      }
      return next;
    });
  };

  const clearAllLogs = () => {
    setDailyLogs(generate21DaysFromStart(startDate));
  };

  // -------------------------------------------------------------
  // ADVANCED 21-DAY MATHEMATICAL ADAPTIVE ALGORITHM
  // -------------------------------------------------------------
  const adaptiveAnalysis = useMemo(() => {
    const validPairs: Array<{ day: number; weightKg: number; calories: number }> = [];

    effectiveDailyLogs.forEach((entry) => {
      const wRaw = parseFloat(entry.weightInput);
      const cRaw = parseFloat(entry.caloriesInput);

      if (!isNaN(wRaw) && wRaw > 0 && !isNaN(cRaw) && cRaw > 0) {
        const weightKgVal = unit === 'imperial' ? wRaw / 2.20462 : wRaw;
        validPairs.push({
          day: entry.day,
          weightKg: weightKgVal,
          calories: cRaw,
        });
      }
    });

    const loggedCount = validPairs.length;
    const hasEnoughData = loggedCount >= 3;

    if (!hasEnoughData) {
      return {
        loggedCount,
        hasEnoughData: false,
        confidenceLevel: 'insufficient',
        confidenceScore: Math.round((loggedCount / 21) * 100),
        status: 'pending' as const,
        avgCalories: 0,
        startWeightKg: weightKg || 80,
        currentWeightKg: weightKg || 80,
        totalWeightChangeKg: 0,
        weeklyChangeRateKg: 0,
        weeklyChangeRateLbs: 0,
        dailyCalorieDelta: 0,
        adaptiveTdee: 0,
        statusText: 'Log at least 3 days to begin calculation',
        statusDescription: 'We need initial daily weight and calorie pairs to calibrate your true metabolic burn rate.',
        projected30DayChangeKg: 0,
        projected30DayChangeLbs: 0,
        week1Avg: null,
        week2Avg: null,
        week3Avg: null,
      };
    }

    // 1. Average Daily Calorie Intake
    const totalCalories = validPairs.reduce((acc, p) => acc + p.calories, 0);
    const avgCalories = Math.round(totalCalories / loggedCount);

    // 2. Linear Regression Slope for Weight Change Rate (Filters daily water fluctuations)
    // Slope (m) = [N*sum(xy) - sum(x)*sum(y)] / [N*sum(x^2) - (sum(x))^2]
    const N = validPairs.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    validPairs.forEach((p) => {
      sumX += p.day;
      sumY += p.weightKg;
      sumXY += p.day * p.weightKg;
      sumXX += p.day * p.day;
    });

    const denom = N * sumXX - sumX * sumX;
    const slopeKgPerDay = denom !== 0 ? (N * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slopeKgPerDay * sumX) / N;

    // Trend Start vs End Weight
    const startWeightKg = Math.round((intercept + slopeKgPerDay * 1) * 10) / 10;
    const currentWeightKg = Math.round((intercept + slopeKgPerDay * validPairs[validPairs.length - 1].day) * 10) / 10;
    const totalWeightChangeKg = Math.round((currentWeightKg - startWeightKg) * 10) / 10;

    // Weekly change rate
    const weeklyChangeRateKg = Math.round(slopeKgPerDay * 7 * 100) / 100;
    const weeklyChangeRateLbs = Math.round(weeklyChangeRateKg * 2.20462 * 100) / 100;

    // 3. Metabolic Energy Balance (1 kg tissue ≈ 7,700 kcal, 1 lb ≈ 3,500 kcal)
    // Daily Calorie Surplus or Deficit = slopeKgPerDay * 7700
    const dailyCalorieDelta = Math.round(slopeKgPerDay * 7700);

    // 4. True Adaptive TDEE = Average Calories - Daily Calorie Delta
    const adaptiveTdee = Math.round(avgCalories - dailyCalorieDelta);

    // 5. Weight Trend Classification: Gaining, Maintaining, or Losing Weight
    // Threshold: +/- 0.07 kg/week (+/- 0.15 lbs/week) accounts for natural water noise
    let status: 'gaining' | 'maintaining' | 'losing' = 'maintaining';
    let statusText = 'MAINTAINING WEIGHT (Equilibrium)';
    let statusDescription = `Your body weight is stable at ${currentWeightKg} kg (net change: ${weeklyChangeRateKg >= 0 ? '+' : ''}${weeklyChangeRateKg} kg/wk). Energy expenditure matches intake within ±${Math.abs(dailyCalorieDelta)} kcal/day.`;

    if (weeklyChangeRateKg > 0.07) {
      status = 'gaining';
      statusText = 'GAINING WEIGHT (Caloric Surplus)';
      statusDescription = `You are currently in a caloric surplus of +${dailyCalorieDelta} kcal/day above maintenance. Gaining at an average rate of +${weeklyChangeRateKg} kg/week (+${weeklyChangeRateLbs} lbs/week).`;
    } else if (weeklyChangeRateKg < -0.07) {
      status = 'losing';
      statusText = 'LOSING WEIGHT (Caloric Deficit)';
      statusDescription = `You are currently in a caloric deficit of ${Math.abs(dailyCalorieDelta)} kcal/day below maintenance. Losing at an average rate of ${weeklyChangeRateKg} kg/week (${weeklyChangeRateLbs} lbs/week).`;
    }

    // 6. Projected 30-day weight trajectory
    const projected30DayChangeKg = Math.round((weeklyChangeRateKg / 7) * 30 * 10) / 10;
    const projected30DayChangeLbs = Math.round(projected30DayChangeKg * 2.20462 * 10) / 10;

    // 7. Confidence Rating
    let confidenceLevel: 'initial' | 'moderate' | 'high' = 'initial';
    if (loggedCount >= 15) {
      confidenceLevel = 'high';
    } else if (loggedCount >= 8) {
      confidenceLevel = 'moderate';
    }

    // 8. Weekly Breakdown Averages
    const w1 = validPairs.filter((p) => p.day <= 7);
    const w2 = validPairs.filter((p) => p.day >= 8 && p.day <= 14);
    const w3 = validPairs.filter((p) => p.day >= 15);

    const calcWeekAvg = (items: typeof validPairs) => {
      if (items.length === 0) return null;
      const avgW = items.reduce((a, b) => a + b.weightKg, 0) / items.length;
      const avgC = items.reduce((a, b) => a + b.calories, 0) / items.length;
      return {
        count: items.length,
        avgWeightKg: Math.round(avgW * 10) / 10,
        avgWeightLbs: Math.round(avgW * 2.20462 * 10) / 10,
        avgKcal: Math.round(avgC),
      };
    };

    return {
      loggedCount,
      hasEnoughData: true,
      confidenceLevel,
      confidenceScore: Math.min(100, Math.round((loggedCount / 21) * 100)),
      status,
      statusText,
      statusDescription,
      avgCalories,
      startWeightKg,
      currentWeightKg,
      totalWeightChangeKg,
      weeklyChangeRateKg,
      weeklyChangeRateLbs,
      dailyCalorieDelta,
      adaptiveTdee,
      projected30DayChangeKg,
      projected30DayChangeLbs,
      week1Avg: calcWeekAvg(w1),
      week2Avg: calcWeekAvg(w2),
      week3Avg: calcWeekAvg(w3),
    };
  }, [effectiveDailyLogs, unit, weightKg]);

  // -------------------------------------------------------------
  // THEORETICAL FORMULAS CALCULATION (Mifflin, Katch, Harris, Cunningham)
  // -------------------------------------------------------------
  const formulaCalculated = useMemo(() => {
    const effectiveWeightKg = weightKg > 0 ? weightKg : 80;
    const effectiveHeightCm = heightCm > 0 ? heightCm : 178;
    const effectiveAge = age > 0 ? age : 25;
    const effectiveBodyFat = useBodyFat ? Math.max(3, Math.min(60, bodyFat)) : 15;

    // Lean Body Mass (LBM) in kg
    const leanBodyMassKg = effectiveWeightKg * (1 - effectiveBodyFat / 100);
    const fatMassKg = effectiveWeightKg - leanBodyMassKg;

    // 1. Mifflin-St Jeor
    let bmrMifflin = 10 * effectiveWeightKg + 6.25 * effectiveHeightCm - 5 * effectiveAge;
    bmrMifflin += gender === 'male' ? 5 : -161;

    // 2. Katch-McArdle (Based on LBM)
    const bmrKatch = 370 + 21.6 * leanBodyMassKg;

    // 3. Harris-Benedict (Revised 1984)
    let bmrHarris = 0;
    if (gender === 'male') {
      bmrHarris = 88.362 + 13.397 * effectiveWeightKg + 4.799 * effectiveHeightCm - 5.677 * effectiveAge;
    } else {
      bmrHarris = 447.593 + 9.247 * effectiveWeightKg + 3.098 * effectiveHeightCm - 4.33 * effectiveAge;
    }

    // 4. Cunningham
    const bmrCunningham = 500 + 22 * leanBodyMassKg;

    let selectedBmr = bmrMifflin;
    if (formula === 'katch') selectedBmr = bmrKatch;
    if (formula === 'harris') selectedBmr = bmrHarris;
    if (formula === 'cunningham') selectedBmr = bmrCunningham;

    const actFactor = activityMultipliers[activity].factor;
    const tdee = Math.round(selectedBmr * actFactor);

    const goalInfo = goalModifiers[goal];
    const targetCalories = Math.round(tdee * goalInfo.factor);
    const calorieDelta = targetCalories - tdee;

    const split = macroPresets[macroPreset];
    const proteinGrams = Math.round((targetCalories * (split.proteinPct / 100)) / 4);
    const carbsGrams = Math.round((targetCalories * (split.carbsPct / 100)) / 4);
    const fatGrams = Math.round((targetCalories * (split.fatPct / 100)) / 9);
    const fiberGrams = Math.round((targetCalories / 1000) * 14);

    // Bodyweight-linked accurate hydration:
    const accurateHydration = calculateAccurateHydration(
      effectiveWeightKg,
      gender,
      activity === 'sedentary' ? 0 : activity === 'light' ? 1 : 2
    );

    return {
      bmr: Math.round(selectedBmr),
      bmrMifflin: Math.round(bmrMifflin),
      bmrKatch: Math.round(bmrKatch),
      bmrHarris: Math.round(bmrHarris),
      bmrCunningham: Math.round(bmrCunningham),
      tdee,
      targetCalories,
      calorieDelta,
      leanBodyMassKg: Math.round(leanBodyMassKg * 10) / 10,
      fatMassKg: Math.round(fatMassKg * 10) / 10,
      proteinGrams,
      carbsGrams,
      fatGrams,
      fiberGrams,
      recommendedWaterMl: accurateHydration.totalTargetMl,
      recommendedGlasses: accurateHydration.totalGlasses,
      hydrationExplanation: accurateHydration.explanation,
      proteinPerKg: Math.round((proteinGrams / effectiveWeightKg) * 10) / 10,
    };
  }, [weightKg, heightCm, age, gender, useBodyFat, bodyFat, formula, activity, goal, macroPreset]);

  // Handle applying Adaptive 21-Day TDEE as the Profile goal
  const handleApplyAdaptiveTdee = () => {
    if (!onApplyTargets) return;
    const targetKcal = adaptiveAnalysis.adaptiveTdee || 2400;
    const split = macroPresets[macroPreset];
    const pGrams = Math.round((targetKcal * (split.proteinPct / 100)) / 4);
    const cGrams = Math.round((targetKcal * (split.carbsPct / 100)) / 4);
    const fGrams = Math.round((targetKcal * (split.fatPct / 100)) / 9);

    const accurateHydration = calculateAccurateHydration(
      adaptiveAnalysis.currentWeightKg || weightKg || 80,
      gender
    );

    onApplyTargets({
      calories: targetKcal,
      protein: pGrams,
      carbs: cGrams,
      fat: fGrams,
      water: accurateHydration.totalTargetMl,
    });

    setAppliedNotification(
      `Applied! Your profile is now calibrated to your empirical 21-Day Adaptive TDEE: ${targetKcal} kcal · ${pGrams}g Protein · ${cGrams}g Carbs · ${fGrams}g Fat · ${accurateHydration.totalTargetMl} ml Drink target.`
    );
    setTimeout(() => setAppliedNotification(null), 6000);
  };

  // Handle applying Formula Targets
  const handleApplyFormula = () => {
    if (!onApplyTargets) return;
    onApplyTargets({
      calories: formulaCalculated.targetCalories,
      protein: formulaCalculated.proteinGrams,
      carbs: formulaCalculated.carbsGrams,
      fat: formulaCalculated.fatGrams,
      water: formulaCalculated.recommendedWaterMl,
    });
    setAppliedNotification(
      `Applied! Target set to ${formulaCalculated.targetCalories} kcal · ${formulaCalculated.proteinGrams}g Protein · ${formulaCalculated.carbsGrams}g Carbs · ${formulaCalculated.fatGrams}g Fat · ${formulaCalculated.recommendedGlasses} Glasses (${formulaCalculated.recommendedWaterMl} ml)`
    );
    setTimeout(() => setAppliedNotification(null), 6000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Banner / Engine Header */}
      <section
        className="panel"
        style={{
          background: 'linear-gradient(135deg, #272119, #1b1e19)',
          borderColor: '#4d3a2b',
          boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff985d', fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px', marginBottom: '6px' }}>
              <Flame size={16} /> TRAINFORGE 21-DAY METABOLIC ENGINE
            </div>
            <h2 style={{ fontSize: '24px', margin: '0 0 6px 0', color: '#f3f4ef' }}>
              Advanced Adaptive TDEE Calculator
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#abb0a4', maxWidth: '720px' }}>
              Empirical sports-science energy expenditure tracking. By monitoring daily bodyweight change alongside exact calorie intake over 21 days, our thermodynamics algorithm solves for your true personal maintenance TDEE and detects whether you are gaining, maintaining, or losing weight.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#1c1f19', padding: '3px', borderRadius: '8px', border: '1px solid #333a2a' }}>
              <button
                type="button"
                className={unit === 'metric' ? 'primary' : ''}
                onClick={() => setUnit('metric')}
                style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '6px' }}
              >
                Metric (kg)
              </button>
              <button
                type="button"
                className={unit === 'imperial' ? 'primary' : ''}
                onClick={() => setUnit('imperial')}
                style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '6px' }}
              >
                Imperial (lbs)
              </button>
            </div>
          </div>
        </div>

        {/* Engine Switcher Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '18px', borderTop: '1px solid #363229', paddingTop: '14px' }}>
          <button
            type="button"
            onClick={() => setCalculatorMode('adaptive21')}
            style={{
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: calculatorMode === 'adaptive21' ? '#ff7a35' : '#222520',
              color: calculatorMode === 'adaptive21' ? '#ffffff' : '#b2b8aa',
              borderColor: calculatorMode === 'adaptive21' ? '#ff7a35' : '#33382c',
            }}
          >
            <Calendar size={16} /> 21-Day Adaptive Tracker (TrainForge Advanced)
          </button>
          <button
            type="button"
            onClick={() => setCalculatorMode('formula')}
            style={{
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: calculatorMode === 'formula' ? '#ff7a35' : '#222520',
              color: calculatorMode === 'formula' ? '#ffffff' : '#b2b8aa',
              borderColor: calculatorMode === 'formula' ? '#ff7a35' : '#33382c',
            }}
          >
            <Zap size={16} /> Theoretical Formula Estimator (Mifflin / Katch)
          </button>
        </div>
      </section>

      {appliedNotification && (
        <div
          style={{
            background: '#243422',
            border: '1px solid #4d7a46',
            color: '#a7e49e',
            padding: '14px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Check size={18} />
          <span>{appliedNotification}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 21-DAY ADAPTIVE CALCULATOR VIEW                                */}
      {/* ============================================================== */}
      {calculatorMode === 'adaptive21' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Morning Fasted Weigh-In Protocol Card */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: isTodayWeightLogged
                ? 'linear-gradient(135deg, #1b261b, #172017)'
                : 'linear-gradient(135deg, #2c2217, #1f1d17)',
              border: isTodayWeightLogged ? '1px solid #385538' : '1px solid #633e22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isTodayWeightLogged ? '#264226' : '#4d301b',
                  color: isTodayWeightLogged ? '#86efac' : '#ffb27a',
                }}
              >
                {isTodayWeightLogged ? <CheckCircle2 size={18} /> : <Sun size={18} />}
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '14px', color: isTodayWeightLogged ? '#e4f7e5' : '#fceddd' }}>
                    {isTodayWeightLogged
                      ? `Today's Morning Weigh-In Logged: ${todayEntry.weightInput} ${unit === 'imperial' ? 'lbs' : 'kg'}`
                      : '🌅 Morning Weigh-In Protocol (Post-Sleep Calibration)'}
                  </strong>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: isTodayWeightLogged ? '#243a25' : '#422a1b',
                      color: isTodayWeightLogged ? '#a3e8b0' : '#ffa566',
                    }}
                  >
                    {isTodayWeightLogged ? 'RECORDED' : 'BEST ACCURACY'}
                  </span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#b2b8aa', maxWidth: '720px' }}>
                  {isTodayWeightLogged
                    ? `Fasted morning baseline of ${todayEntry.weightInput} ${unit === 'imperial' ? 'lbs' : 'kg'} is locked into your 21-day dataset. Calories from your food journal are automatically loaded.`
                    : 'Sports science gold standard: Weigh yourself immediately after waking up, post-urination, and before consuming food or fluids. Sleep stabilizes fluid balance and fasted weigh-ins eliminate acute digestive weight, giving the algorithm true metabolic accuracy.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                step="0.1"
                min="20"
                max="400"
                placeholder={todayEntry?.weightInput || (unit === 'imperial' ? '176.4' : '80.0')}
                value={morningWeightInput}
                onChange={(e) => setMorningWeightInput(e.target.value)}
                style={{
                  width: '85px',
                  padding: '7px 10px',
                  background: '#151713',
                  border: '1px solid #3c4434',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              />
              <span style={{ fontSize: '12px', color: '#9ba492' }}>{unit === 'imperial' ? 'lbs' : 'kg'}</span>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  const val = morningWeightInput.trim() || todayEntry?.weightInput;
                  if (val && parseFloat(val) > 0) {
                    const targetIdx = todayIndex >= 0 ? todayIndex : dailyLogs.length - 1;
                    updateDay(targetIdx, 'weightInput', val);
                    setMorningWeightInput('');
                  }
                }}
                style={{ fontSize: '12px', padding: '7px 12px' }}
              >
                {isTodayWeightLogged ? 'Update Today' : 'Log Morning Weight'}
              </button>
            </div>
          </div>

          {/* RESULTS CARD: GAINING / MAINTAINING / LOSING & ADAPTIVE TDEE */}
          <section
            className="panel"
            style={{
              background:
                adaptiveAnalysis.status === 'gaining'
                  ? 'linear-gradient(145deg, #182c18, #18201a)'
                  : adaptiveAnalysis.status === 'losing'
                    ? 'linear-gradient(145deg, #322119, #201e1c)'
                    : 'linear-gradient(145deg, #1c272a, #1b2020)',
              borderColor:
                adaptiveAnalysis.status === 'gaining'
                  ? '#356335'
                  : adaptiveAnalysis.status === 'losing'
                    ? '#6a3f25'
                    : '#2e494e',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.6px',
                      background:
                        adaptiveAnalysis.status === 'gaining'
                          ? '#1c421c'
                          : adaptiveAnalysis.status === 'losing'
                            ? '#4a251b'
                            : '#22383c',
                      color:
                        adaptiveAnalysis.status === 'gaining'
                          ? '#8de882'
                          : adaptiveAnalysis.status === 'losing'
                            ? '#ff9d80'
                            : '#8dd9e6',
                    }}
                  >
                    {adaptiveAnalysis.status === 'gaining' ? (
                      <TrendingUp size={16} />
                    ) : adaptiveAnalysis.status === 'losing' ? (
                      <TrendingDown size={16} />
                    ) : (
                      <Scale size={16} />
                    )}
                    {adaptiveAnalysis.statusText}
                  </span>
                  <span style={{ fontSize: '12px', color: '#8e9687' }}>
                    {adaptiveAnalysis.loggedCount} of 21 days logged ({adaptiveAnalysis.confidenceScore}% complete)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span style={{ fontSize: '44px', fontFamily: 'Manrope', fontWeight: 700, color: '#ffffff', letterSpacing: '-1px' }}>
                    {adaptiveAnalysis.hasEnoughData
                      ? adaptiveAnalysis.adaptiveTdee.toLocaleString()
                      : '—'}
                  </span>
                  <span style={{ fontSize: '17px', color: '#ff985d', fontWeight: 600 }}>
                    True TDEE kcal / day
                  </span>
                </div>

                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#c4cbbe', maxWidth: '650px', lineHeight: '1.5' }}>
                  {adaptiveAnalysis.statusDescription}
                </p>
              </div>

              {/* Statistics Pill Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
                <div style={{ background: '#1c1f19', border: '1px solid #343c2c', padding: '8px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#88917e', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Weekly Weight Rate of Change
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#e8ece2' }}>
                    {adaptiveAnalysis.weeklyChangeRateKg > 0 ? '+' : ''}
                    {unit === 'imperial'
                      ? `${adaptiveAnalysis.weeklyChangeRateLbs} lbs/week`
                      : `${adaptiveAnalysis.weeklyChangeRateKg} kg/week`}
                  </div>
                </div>

                <div style={{ background: '#1c1f19', border: '1px solid #343c2c', padding: '8px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#88917e', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Average Calorie Intake Logged
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#e8ece2' }}>
                    {adaptiveAnalysis.avgCalories.toLocaleString()} <small style={{ fontWeight: 400, color: '#88917e' }}>kcal/day</small>
                  </div>
                </div>

                <div style={{ background: '#1c1f19', border: '1px solid #343c2c', padding: '8px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#88917e', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Projected 30-Day Trajectory
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#e8ece2' }}>
                    {adaptiveAnalysis.projected30DayChangeKg > 0 ? '+' : ''}
                    {unit === 'imperial'
                      ? `${adaptiveAnalysis.projected30DayChangeLbs} lbs in 30 days`
                      : `${adaptiveAnalysis.projected30DayChangeKg} kg in 30 days`}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Apply */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
              {onApplyTargets && adaptiveAnalysis.hasEnoughData && (
                <button
                  type="button"
                  className="primary"
                  onClick={handleApplyAdaptiveTdee}
                  disabled={saving}
                  style={{
                    padding: '11px 18px',
                    fontSize: '13px',
                    fontWeight: 650,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} /> Apply {adaptiveAnalysis.adaptiveTdee} kcal Adaptive TDEE to Profile Goals
                </button>
              )}

              <button
                type="button"
                onClick={pullFromJournal}
                style={{ fontSize: '12px', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Automatically import daily calories from Ember Food Journal"
              >
                <RefreshCw size={14} /> Sync from Food Journal
              </button>

              {/* Sample Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <span style={{ fontSize: '11px', color: '#8e9687' }}>Load Real Scenarios:</span>
                <button
                  type="button"
                  onClick={() => loadScenario('cut')}
                  style={{ fontSize: '11px', padding: '6px 10px', background: '#362319', borderColor: '#5e3725', color: '#ff9c7e' }}
                >
                  Losing (-0.45 kg/wk)
                </button>
                <button
                  type="button"
                  onClick={() => loadScenario('maintain')}
                  style={{ fontSize: '11px', padding: '6px 10px', background: '#1e282a', borderColor: '#2e494e', color: '#97d8e2' }}
                >
                  Maintaining (±0.0)
                </button>
                <button
                  type="button"
                  onClick={() => loadScenario('bulk')}
                  style={{ fontSize: '11px', padding: '6px 10px', background: '#1c341c', borderColor: '#2e562e', color: '#9ceb94' }}
                >
                  Gaining (+0.28 kg/wk)
                </button>
                <button
                  type="button"
                  onClick={clearAllLogs}
                  style={{ fontSize: '11px', padding: '6px 10px', color: '#a0a897' }}
                >
                  Clear
                </button>
              </div>
            </div>
          </section>

          {/* 3-WEEK PROGRESSION ANALYSIS SUMMARY */}
          {adaptiveAnalysis.hasEnoughData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {/* Week 1 */}
              <div style={{ background: '#20241c', border: '1px solid #333a2a', padding: '14px 16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#ff985d', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  WEEK 1 (DAYS 1–7): BASELINE
                </div>
                {adaptiveAnalysis.week1Avg ? (
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#eef2e7' }}>
                      {unit === 'imperial' ? `${adaptiveAnalysis.week1Avg.avgWeightLbs} lbs` : `${adaptiveAnalysis.week1Avg.avgWeightKg} kg`}
                      <span style={{ fontSize: '13px', fontWeight: 400, color: '#909886', marginLeft: '8px' }}>
                        avg · {adaptiveAnalysis.week1Avg.avgKcal} kcal/day
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#88917e', marginTop: '4px' }}>
                      {adaptiveAnalysis.week1Avg.count} of 7 days logged
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#747c6c' }}>Awaiting initial days</div>
                )}
              </div>

              {/* Week 2 */}
              <div style={{ background: '#20241c', border: '1px solid #333a2a', padding: '14px 16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#ff985d', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  WEEK 2 (DAYS 8–14): METABOLIC SHIFT
                </div>
                {adaptiveAnalysis.week2Avg ? (
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#eef2e7' }}>
                      {unit === 'imperial' ? `${adaptiveAnalysis.week2Avg.avgWeightLbs} lbs` : `${adaptiveAnalysis.week2Avg.avgWeightKg} kg`}
                      <span style={{ fontSize: '13px', fontWeight: 400, color: '#909886', marginLeft: '8px' }}>
                        avg · {adaptiveAnalysis.week2Avg.avgKcal} kcal/day
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#88917e', marginTop: '4px' }}>
                      {adaptiveAnalysis.week2Avg.count} of 7 days logged
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#747c6c' }}>Awaiting week 2 log</div>
                )}
              </div>

              {/* Week 3 */}
              <div style={{ background: '#20241c', border: '1px solid #333a2a', padding: '14px 16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#ff985d', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  WEEK 3 (DAYS 15–21): CLINICAL CONFIRMATION
                </div>
                {adaptiveAnalysis.week3Avg ? (
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#eef2e7' }}>
                      {unit === 'imperial' ? `${adaptiveAnalysis.week3Avg.avgWeightLbs} lbs` : `${adaptiveAnalysis.week3Avg.avgWeightKg} kg`}
                      <span style={{ fontSize: '13px', fontWeight: 400, color: '#909886', marginLeft: '8px' }}>
                        avg · {adaptiveAnalysis.week3Avg.avgKcal} kcal/day
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#88917e', marginTop: '4px' }}>
                      {adaptiveAnalysis.week3Avg.count} of 7 days logged
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#747c6c' }}>Awaiting week 3 log</div>
                )}
              </div>
            </div>
          )}

          {/* 21-DAY DAILY LOGGING TABLE */}
          <section className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '17px', margin: '0 0 3px 0', color: '#f0f3ec' }}>
                  Daily Log Sheets: 21-Day Monitoring Period
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#88917e' }}>
                  Log your morning weight right after waking up & before eating. Enter your daily total calorie intake. Deleting a number leaves the field clear.
                </p>
              </div>
              <div style={{ fontSize: '12px', color: '#a7b693', background: '#1d2319', padding: '6px 12px', borderRadius: '6px', border: '1px solid #333d2a' }}>
                Weight Unit: <b>{unit === 'imperial' ? 'Pounds (lbs)' : 'Kilograms (kg)'}</b>
              </div>
            </div>

            {/* 21-Day Cycle Anchor & Timeline Banner */}
            <div
              style={{
                background: '#1a1f18',
                border: '1px solid #323d2b',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={18} color="#ff985d" />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#e4eade', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>21-DAY TIMELINE: DAY 1 STARTS FROM FIRST LOG</span>
                    <span style={{ fontSize: '10px', background: '#253422', color: '#9ee094', padding: '2px 6px', borderRadius: '4px' }}>
                      {formatDateLabel(startDate)} ➔ {formatDateLabel(cycleEndDateStr)}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#8e9885', marginTop: '2px' }}>
                    {todayDayNumber > 0 && todayDayNumber <= 21
                      ? `Current progression: You are on Day ${todayDayNumber} of 21`
                      : todayDayNumber > 21
                        ? '21-Day tracking cycle completed'
                        : `Tracking cycle begins on ${formatDateLabel(startDate)}`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '11px', color: '#a0a898', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Day 1 Date:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => e.target.value && handleStartDateChange(e.target.value)}
                    style={{
                      padding: '5px 8px',
                      background: '#141712',
                      border: '1px solid #363e2c',
                      borderRadius: '5px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={anchorToFirstLog}
                  style={{ fontSize: '11px', padding: '5px 10px', background: '#222c1e', borderColor: '#3a4a34', color: '#bde3b3' }}
                  title="Automatically align Day 1 with your earliest logged food or morning weight"
                >
                  🎯 Align to First Log
                </button>
                <button
                  type="button"
                  onClick={() => handleStartDateChange(todayStr)}
                  style={{ fontSize: '11px', padding: '5px 10px', color: '#a4ad9d' }}
                  title="Set Day 1 to today"
                >
                  Start Today
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '10px' }}>
              {effectiveDailyLogs.map((entry, idx) => {
                const isComplete = entry.weightInput.trim() !== '' && entry.caloriesInput.trim() !== '';
                const weekNum = Math.ceil(entry.day / 7);

                return (
                  <div
                    key={entry.day}
                    style={{
                      background: isComplete ? '#21271e' : '#1a1d17',
                      border: isComplete ? '1px solid #3b4632' : '1px solid #282d23',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#f0f4ea' }}>
                          Day {entry.day}
                        </span>
                        <small style={{ color: '#86907d', fontWeight: 400 }}>
                          (W{weekNum} · {formatDateLabel(entry.dateStr)})
                        </small>
                        {entry.day === 1 && (
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#3b2f1e', color: '#ffb27a', letterSpacing: '0.4px' }}>
                            FIRST LOG
                          </span>
                        )}
                        {entry.dateStr === todayStr && (
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#1e382b', color: '#86efac', letterSpacing: '0.4px' }}>
                            TODAY
                          </span>
                        )}
                      </div>
                      {isComplete ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#86efac' }}>
                          <Check size={13} /> Logged
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#687062' }}>Pending</span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#a0a898', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Weight ({unit === 'imperial' ? 'lbs' : 'kg'})</span>
                          {entry.dateStr === todayStr && (
                            <span style={{ fontSize: '9px', color: '#ffa566', fontWeight: 600 }}>
                              Today
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          min="20"
                          max="400"
                          placeholder={unit === 'imperial' ? '176.4' : '80.0'}
                          value={entry.weightInput}
                          onChange={(e) => updateDay(idx, 'weightInput', e.target.value)}
                          style={{
                            padding: '6px 8px',
                            background: '#151713',
                            border: '1px solid #363d2e',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                          }}
                        />
                      </label>

                      <label style={{ fontSize: '11px', color: '#a0a898', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Calories (kcal)</span>
                          {Boolean(
                            existingRecords &&
                              existingRecords[entry.dateStr] &&
                              typeof existingRecords[entry.dateStr] === 'object' &&
                              'foods' in (existingRecords[entry.dateStr] as object) &&
                              ((existingRecords[entry.dateStr] as { foods: unknown[] }).foods || []).length > 0
                          ) && (
                            <span style={{ fontSize: '9px', color: '#86efac', fontWeight: 600 }}>
                              🥗 Auto-loaded
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min="500"
                          max="12000"
                          placeholder="2400"
                          value={entry.caloriesInput}
                          onChange={(e) => updateDay(idx, 'caloriesInput', e.target.value)}
                          style={{
                            padding: '6px 8px',
                            background: '#151713',
                            border: '1px solid #363d2e',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Daily Hydration Target Recommendation linked with Bodyweight */}
          <section className="panel" style={{ background: 'linear-gradient(135deg, #1c2527, #191f20)', borderColor: '#2f4548' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8bb9bc', fontWeight: 600, fontSize: '13px' }}>
                <Droplets size={18} /> Daily Hydration Linked Directly to Your Bodyweight
              </div>
              <span style={{ fontSize: '11px', color: '#6e898b' }}>Clinical ACSM Standard: 35 ml / kg</span>
            </div>
            {(() => {
              const currentW = adaptiveAnalysis.currentWeightKg || weightKg || 80;
              const hyd = calculateAccurateHydration(currentW, gender);
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <div style={{ fontSize: '28px', fontFamily: 'Manrope', fontWeight: 700, color: '#f0fbfb' }}>
                      {hyd.totalGlasses} <small style={{ fontSize: '14px', fontWeight: 500, color: '#8bb9bc' }}>Glasses of water</small>
                    </div>
                    <span style={{ fontSize: '14px', color: '#829d9f' }}>
                      ({(hyd.totalTargetMl / 1000).toFixed(1)} L · {hyd.totalTargetMl.toLocaleString()} ml)
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#7a9496', margin: '8px 0 0' }}>
                    {hyd.explanation}. Staying hydrated prevents spurious weigh-in noise and water retention spikes during your 21-day calibration.
                  </p>
                </div>
              );
            })()}
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* THEORETICAL FORMULAS ESTIMATOR VIEW                            */}
      {/* ============================================================== */}
      {calculatorMode === 'formula' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
          {/* LEFT COLUMN: PARAMETERS & FORMULAS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Biometrics Card */}
            <section className="panel">
              <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#ff985d' }}>
                <Scale size={18} /> 1. Biometrics & Physical Stats
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#a0a898', display: 'block', marginBottom: '6px' }}>Biological Sex</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className={gender === 'male' ? 'primary' : ''}
                      onClick={() => setGender('male')}
                      style={{ flex: 1, fontSize: '12px', padding: '8px' }}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      className={gender === 'female' ? 'primary' : ''}
                      onClick={() => setGender('female')}
                      style={{ flex: 1, fontSize: '12px', padding: '8px' }}
                    >
                      Female
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#a0a898', display: 'block', marginBottom: '6px' }}>Age (years)</label>
                  <input
                    type="number"
                    min="15"
                    max="110"
                    placeholder="25"
                    value={ageInput}
                    onChange={(e) => {
                      setAgeInput(e.target.value);
                      const n = parseInt(e.target.value, 10);
                      if (!isNaN(n) && n > 0) setAge(n);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#151713',
                      border: '1px solid #363d2e',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              {/* Height & Weight Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                {unit === 'metric' ? (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: '#a0a898', display: 'block', marginBottom: '6px' }}>Height (cm)</label>
                      <input
                        type="number"
                        min="100"
                        max="250"
                        placeholder="178"
                        value={heightCmInput}
                        onChange={(e) => {
                          setHeightCmInput(e.target.value);
                          const n = parseFloat(e.target.value);
                          if (!isNaN(n) && n > 0) setHeightCm(n);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: '#151713',
                          border: '1px solid #363d2e',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#a0a898', display: 'block', marginBottom: '6px' }}>Weight (kg)</label>
                      <input
                        type="number"
                        min="30"
                        max="300"
                        step="0.1"
                        placeholder="80"
                        value={weightKgInput}
                        onChange={(e) => {
                          setWeightKgInput(e.target.value);
                          const n = parseFloat(e.target.value);
                          if (!isNaN(n) && n > 0) {
                            setWeightKg(n);
                            setWeightLbsInput(String(Math.round(n * 2.20462 * 10) / 10));
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: '#151713',
                          border: '1px solid #363d2e',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: '#a0a898', display: 'block', marginBottom: '6px' }}>Height (ft / in)</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                          type="number"
                          placeholder="5"
                          value={heightFtInput}
                          onChange={(e) => {
                            setHeightFtInput(e.target.value);
                            const ft = parseInt(e.target.value, 10) || 0;
                            setHeightFt(ft);
                            setHeightCm(Math.round((ft * 12 + heightIn) * 2.54));
                          }}
                          style={{
                            width: '50%',
                            padding: '8px',
                            background: '#151713',
                            border: '1px solid #363d2e',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                          }}
                        />
                        <input
                          type="number"
                          placeholder="10"
                          value={heightInInput}
                          onChange={(e) => {
                            setHeightInInput(e.target.value);
                            const inch = parseInt(e.target.value, 10) || 0;
                            setHeightIn(inch);
                            setHeightCm(Math.round((heightFt * 12 + inch) * 2.54));
                          }}
                          style={{
                            width: '50%',
                            padding: '8px',
                            background: '#151713',
                            border: '1px solid #363d2e',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#a0a898', display: 'block', marginBottom: '6px' }}>Weight (lbs)</label>
                      <input
                        type="number"
                        min="60"
                        max="660"
                        step="0.1"
                        placeholder="176"
                        value={weightLbsInput}
                        onChange={(e) => {
                          setWeightLbsInput(e.target.value);
                          const n = parseFloat(e.target.value);
                          if (!isNaN(n) && n > 0) {
                            const kg = Math.round((n / 2.20462) * 10) / 10;
                            setWeightKg(kg);
                            setWeightKgInput(String(kg));
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: '#151713',
                          border: '1px solid #363d2e',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Body fat option */}
              <div style={{ borderTop: '1px solid #2e3427', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#c4cbbe', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useBodyFat}
                    onChange={(e) => setUseBodyFat(e.target.checked)}
                  />
                  <span>Include Body Fat % (Enables Katch-McArdle & Cunningham formulas)</span>
                </label>
                {useBodyFat && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#abb0a4', marginBottom: '4px' }}>
                      <span>Body Fat Percentage</span>
                      <strong style={{ color: '#ff985d' }}>{bodyFat}%</strong>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="45"
                      value={bodyFat}
                      onChange={(e) => setBodyFat(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#ff7a35' }}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Formula Choice */}
            <section className="panel">
              <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#ff985d' }}>
                <Zap size={18} /> 2. Metabolic Equation
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'mifflin', name: 'Mifflin-St Jeor', badge: 'Standard Default', bmr: formulaCalculated.bmrMifflin, desc: 'Clinical benchmark for general population & gym goers.' },
                  { id: 'katch', name: 'Katch-McArdle', badge: 'Lean Mass Accurate', bmr: formulaCalculated.bmrKatch, desc: 'Calculates based on Lean Body Mass. Ideal for lean athletes.' },
                  { id: 'harris', name: 'Harris-Benedict (Revised)', badge: 'Classic 1984', bmr: formulaCalculated.bmrHarris, desc: 'Traditional biometric equation incorporating weight, height & age.' },
                  { id: 'cunningham', name: 'Cunningham Formula', badge: 'Athletic Equation', bmr: formulaCalculated.bmrCunningham, desc: 'Performance equation heavily weighting muscular energy demands.' },
                ].map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setFormula(f.id as Formula)}
                    style={{
                      padding: '11px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: formula === f.id ? '#393026' : '#222520',
                      border: formula === f.id ? '1px solid #7d4926' : '1px solid #33382c',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: formula === f.id ? '#ff9a5e' : '#e0e5d9' }}>
                        {f.name}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f0f3eb' }}>
                        {f.bmr} <small style={{ fontWeight: 400, color: '#888f82' }}>BMR</small>
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#8e9687' }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Activity Level */}
            <section className="panel">
              <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#ff985d' }}>
                <TrendingUp size={18} /> 3. Physical Activity Level (PAL)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(Object.keys(activityMultipliers) as ActivityLevel[]).map((actKey) => {
                  const item = activityMultipliers[actKey];
                  const active = activity === actKey;
                  return (
                    <div
                      key={actKey}
                      onClick={() => setActivity(actKey)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: active ? '#393026' : '#222520',
                        border: active ? '1px solid #7d4926' : '1px solid #33382c',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: active ? '#ff9a5e' : '#e0e5d9' }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ba48f' }}>×{item.factor}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#8e9687' }}>{item.desc}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: RESULTS & MACROS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Goal Selector */}
            <section className="panel">
              <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#ff985d' }}>
                <Sparkles size={18} /> 4. Strategy & Target Deficit / Surplus
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {(Object.keys(goalModifiers) as Goal[]).map((goalKey) => {
                  const g = goalModifiers[goalKey];
                  const active = goal === goalKey;
                  return (
                    <button
                      type="button"
                      key={goalKey}
                      onClick={() => setGoal(goalKey)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '10px 12px',
                        background: active ? '#452f1e' : '#222520',
                        borderColor: active ? '#93582e' : '#33382c',
                        color: active ? '#ffa168' : '#c8cfc0',
                        borderRadius: '8px',
                        textAlign: 'left',
                        gap: '4px',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{g.label}</span>
                      <small style={{ fontSize: '10px', color: active ? '#ffbf96' : '#7f8778' }}>
                        {g.weeklyChangeKg === 0 ? 'Weight stable' : `${g.weeklyChangeKg > 0 ? '+' : ''}${g.weeklyChangeKg} kg/wk`}
                      </small>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Theoretical Output Display */}
            <section
              className="panel"
              style={{
                background: 'linear-gradient(145deg, #32251a, #20221e)',
                border: '1px solid #663e23',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '18px' }}>
                <div>
                  <span style={{ fontSize: '11px', letterSpacing: '1.2px', color: '#ffb587', fontWeight: 600 }}>
                    ESTIMATED CALORIC TARGET
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
                    <span style={{ fontSize: '42px', fontFamily: 'Manrope', fontWeight: 700, color: '#ffffff', letterSpacing: '-1px' }}>
                      {formulaCalculated.targetCalories.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '16px', color: '#ff985d', fontWeight: 600 }}>kcal / day</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ba492', marginTop: '6px' }}>
                    Maintenance TDEE: <b>{formulaCalculated.tdee.toLocaleString()} kcal</b> · BMR: <b>{formulaCalculated.bmr.toLocaleString()} kcal</b>
                  </div>
                </div>
              </div>

              {onApplyTargets && (
                <button
                  type="button"
                  className="primary"
                  onClick={handleApplyFormula}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    fontSize: '14px',
                    fontWeight: 650,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Check size={18} /> Apply Calorie & Macro Targets to Profile
                </button>
              )}
            </section>

            {/* Macros Card */}
            <section className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', margin: 0, color: '#ff985d' }}>Daily Macronutrient Splits</h3>
                <select
                  value={macroPreset}
                  onChange={(e) => setMacroPreset(e.target.value as MacroPreset)}
                  style={{
                    padding: '6px 10px',
                    background: '#1d211a',
                    color: '#e2e8da',
                    border: '1px solid #3d4533',
                    borderRadius: '7px',
                    fontSize: '12px',
                  }}
                >
                  {Object.keys(macroPresets).map((p) => (
                    <option key={p} value={p}>
                      {macroPresets[p as MacroPreset].label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#242820', border: '1px solid #3c4533', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#a7b693', fontWeight: 600 }}>PROTEIN</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, margin: '6px 0 2px', color: '#f3f6ee' }}>
                    {formulaCalculated.proteinGrams}g
                  </div>
                  <div style={{ fontSize: '11px', color: '#88917e' }}>{formulaCalculated.proteinPerKg} g/kg</div>
                </div>

                <div style={{ background: '#29261f', border: '1px solid #4a3e29', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#dfb873', fontWeight: 600 }}>CARBS</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, margin: '6px 0 2px', color: '#f3f6ee' }}>
                    {formulaCalculated.carbsGrams}g
                  </div>
                  <div style={{ fontSize: '11px', color: '#88917e' }}>{formulaCalculated.carbsGrams * 4} kcal</div>
                </div>

                <div style={{ background: '#252129', border: '1px solid #42354a', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#b69ecd', fontWeight: 600 }}>FAT</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, margin: '6px 0 2px', color: '#f3f6ee' }}>
                    {formulaCalculated.fatGrams}g
                  </div>
                  <div style={{ fontSize: '11px', color: '#88917e' }}>{formulaCalculated.fatGrams * 9} kcal</div>
                </div>
              </div>
            </section>

            {/* Hydration Card */}
            <section className="panel" style={{ background: 'linear-gradient(135deg, #1c2527, #191f20)', borderColor: '#2f4548' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8bb9bc', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                <Droplets size={18} /> Daily Hydration Recommendation
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#f0fbfb' }}>
                  {formulaCalculated.recommendedGlasses} glasses
                </div>
                <span style={{ fontSize: '13px', color: '#829d9f' }}>
                  ({(formulaCalculated.recommendedWaterMl / 1000).toFixed(1)} L · {formulaCalculated.recommendedWaterMl} ml)
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#7a9496', margin: '6px 0 0' }}>
                {formulaCalculated.hydrationExplanation}
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
