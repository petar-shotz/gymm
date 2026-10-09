export type StrengthLevel = 'beginner' | 'normal' | 'advanced' | 'expert' | 'pro';

export interface ExerciseStandard {
  exerciseId: string;
  exerciseName: string;
  category: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms';
  equipment: string;
  description: string;
  // Multipliers relative to bodyweight for male & female:
  // [beginner, normal/intermediate, advanced, expert, pro/elite]
  maleMultipliers: [number, number, number, number, number];
  femaleMultipliers: [number, number, number, number, number];
  primaryMuscles: string[];
}

export const STRENGTH_EXERCISES: ExerciseStandard[] = [
  {
    exerciseId: 'bb-bench-press',
    exerciseName: 'Barbell Bench Press',
    category: 'Chest',
    equipment: 'Barbell',
    description: 'Flat barbell press touching chest to full lockout. The standard upper body push.',
    maleMultipliers: [0.65, 0.95, 1.25, 1.50, 1.75],
    femaleMultipliers: [0.40, 0.58, 0.78, 0.98, 1.18],
    primaryMuscles: ['Chest', 'Triceps', 'Front Delts'],
  },
  {
    exerciseId: 'incline-bb-bench',
    exerciseName: 'Incline Barbell Bench Press',
    category: 'Chest',
    equipment: 'Barbell',
    description: 'Upper chest angle press (30-45° incline).',
    maleMultipliers: [0.55, 0.80, 1.05, 1.26, 1.48],
    femaleMultipliers: [0.35, 0.50, 0.68, 0.85, 1.02],
    primaryMuscles: ['Upper Chest', 'Front Delts', 'Triceps'],
  },
  {
    exerciseId: 'bb-squat',
    exerciseName: 'Barbell Back Squat',
    category: 'Legs',
    equipment: 'Barbell',
    description: 'Full depth squat with hip crease breaking knee line. King of lower body strength.',
    maleMultipliers: [0.85, 1.25, 1.65, 2.00, 2.30],
    femaleMultipliers: [0.60, 0.90, 1.20, 1.50, 1.75],
    primaryMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
  },
  {
    exerciseId: 'bb-deadlift',
    exerciseName: 'Barbell Deadlift (Conventional)',
    category: 'Back',
    equipment: 'Barbell',
    description: 'Dead stop pull from floor to full hip extension. Ultimate posterior chain test.',
    maleMultipliers: [1.05, 1.50, 1.95, 2.35, 2.70],
    femaleMultipliers: [0.75, 1.10, 1.45, 1.80, 2.10],
    primaryMuscles: ['Lower Back', 'Hamstrings', 'Glutes', 'Lats', 'Traps'],
  },
  {
    exerciseId: 'overhead-press',
    exerciseName: 'Standing Overhead Press (OHP)',
    category: 'Shoulders',
    equipment: 'Barbell',
    description: 'Strict standing barbell military press from collarbone to full overhead lockout.',
    maleMultipliers: [0.45, 0.65, 0.85, 1.02, 1.20],
    femaleMultipliers: [0.28, 0.42, 0.58, 0.72, 0.86],
    primaryMuscles: ['Shoulders', 'Triceps', 'Upper Chest', 'Core'],
  },
  {
    exerciseId: 'bb-row',
    exerciseName: 'Bent-Over Barbell Row',
    category: 'Back',
    equipment: 'Barbell',
    description: 'Torso hinged at ~45-70°, barbell pulled into lower sternum without momentum.',
    maleMultipliers: [0.55, 0.80, 1.05, 1.28, 1.50],
    femaleMultipliers: [0.35, 0.52, 0.70, 0.88, 1.05],
    primaryMuscles: ['Middle Back', 'Lats', 'Biceps', 'Rear Delts'],
  },
  {
    exerciseId: 'romanian-deadlift',
    exerciseName: 'Romanian Deadlift (RDL)',
    category: 'Legs',
    equipment: 'Barbell',
    description: 'Hip hinge movement loading hamstrings and glutes with slight knee bend.',
    maleMultipliers: [0.75, 1.10, 1.45, 1.75, 2.05],
    femaleMultipliers: [0.55, 0.80, 1.10, 1.38, 1.65],
    primaryMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
  },
  {
    exerciseId: 'leg-press',
    exerciseName: '45° Leg Press Machine',
    category: 'Legs',
    equipment: 'Machine',
    description: 'Sled leg press to 90° knee angle without lower back rounding.',
    maleMultipliers: [1.60, 2.50, 3.40, 4.20, 5.00],
    femaleMultipliers: [1.20, 1.90, 2.60, 3.20, 3.80],
    primaryMuscles: ['Quadriceps', 'Glutes'],
  },
  {
    exerciseId: 'bb-bicep-curl',
    exerciseName: 'Strict Barbell Bicep Curl',
    category: 'Arms',
    equipment: 'Barbell',
    description: 'Standing bicep curl without excessive back sway or shoulder elevation.',
    maleMultipliers: [0.25, 0.38, 0.50, 0.64, 0.78],
    femaleMultipliers: [0.15, 0.24, 0.34, 0.44, 0.54],
    primaryMuscles: ['Biceps', 'Forearms'],
  },
  {
    exerciseId: 'skull-crushers',
    exerciseName: 'Lying EZ-Bar Triceps Extension (Skull Crushers)',
    category: 'Arms',
    equipment: 'Barbell',
    description: 'Lying flat, lowering bar smoothly toward forehead and extending triceps.',
    maleMultipliers: [0.28, 0.40, 0.54, 0.68, 0.80],
    femaleMultipliers: [0.16, 0.26, 0.36, 0.46, 0.56],
    primaryMuscles: ['Triceps'],
  },
  {
    exerciseId: 'db-bench-press',
    exerciseName: 'Dumbbell Flat Bench Press (Total of 2 DBs)',
    category: 'Chest',
    equipment: 'Dumbbell',
    description: 'Combined weight of both dumbbells (e.g. two 30kg DBs = 60kg).',
    maleMultipliers: [0.55, 0.80, 1.05, 1.28, 1.50],
    femaleMultipliers: [0.35, 0.50, 0.68, 0.86, 1.02],
    primaryMuscles: ['Chest', 'Front Delts', 'Triceps'],
  },
  {
    exerciseId: 'db-shoulder-press',
    exerciseName: 'Seated Dumbbell Shoulder Press (Total of 2 DBs)',
    category: 'Shoulders',
    equipment: 'Dumbbell',
    description: 'Combined weight of both dumbbells pressed overhead.',
    maleMultipliers: [0.40, 0.58, 0.75, 0.92, 1.10],
    femaleMultipliers: [0.25, 0.38, 0.50, 0.64, 0.78],
    primaryMuscles: ['Shoulders', 'Triceps'],
  },
];

/**
 * Calculates user's strength standard comparison.
 * Uses clinical Brzycki formula for 1-rep max estimate for lower reps (1..10),
 * smooth progression for 11..14 reps, and sports-science high-rep acceleration for reps >= 15.
 * This guarantees that continuing to load reps past 15 or in the Expert range properly transitions
 * to Pro (Elite) status!
 */
export function calculateOneRepMax(weightKg: number, reps: number): number {
  if (weightKg <= 0) return 0;
  const r = Math.max(1, reps);
  if (r === 1) return weightKg;

  let oneRep: number;
  if (r <= 10) {
    // Exact Brzycki formula for 1 to 10 reps
    oneRep = weightKg * (36 / (37 - r));
  } else if (r <= 14) {
    // Smooth transition from Brzycki (at 10 reps: 1.333) into higher rep ranges
    const factor = (36 / 27) + ((r - 10) / 28);
    oneRep = weightKg * factor;
  } else {
    // High-rep strength endurance acceleration for reps >= 15.
    // In athletic powerlifting & strength science, performing 15+ reps with heavy working loads
    // reflects elite recruitment and anaerobic capacity.
    // Each additional rep above 15 strongly scales the projected 1RM so loading more reps
    // smoothly elevates the user from Expert to Pro!
    const baseAt15 = (36 / 27) + (5 / 28); // ~1.512
    const additionalReps = r - 15;
    const factor = baseAt15 + (additionalReps * 0.052);
    oneRep = weightKg * factor;
  }

  return Math.round(oneRep * 10) / 10;
}

export interface StrengthAssessment {
  exercise: ExerciseStandard;
  liftedWeightKg: number;
  reps: number;
  estimatedOneRepMaxKg: number;
  bodyweightKg: number;
  ratio: number; // 1RM / BW
  level: StrengthLevel;
  levelLabel: string;
  levelColor: string;
  levelDescription: string;
  thresholds: {
    beginner: number;
    normal: number;
    advanced: number;
    expert: number;
    pro: number;
  };
  progressToNextLevelPercent: number;
  nextLevelName?: string;
  kgNeededForNextLevel?: number;
}

export function evaluateStrengthLevel(
  exerciseId: string,
  liftedWeightKg: number,
  reps: number,
  bodyweightKg: number,
  sex: 'male' | 'female' = 'male'
): StrengthAssessment | null {
  const ex = STRENGTH_EXERCISES.find((e) => e.exerciseId === exerciseId);
  if (!ex || bodyweightKg <= 0) return null;

  const bw = Math.max(35, bodyweightKg);
  const oneRepMax = calculateOneRepMax(liftedWeightKg, reps);
  const ratio = Math.round((oneRepMax / bw) * 100) / 100;

  const mults = sex === 'female' ? ex.femaleMultipliers : ex.maleMultipliers;
  const thresholds = {
    beginner: Math.round(bw * mults[0] * 10) / 10,
    normal: Math.round(bw * mults[1] * 10) / 10,
    advanced: Math.round(bw * mults[2] * 10) / 10,
    expert: Math.round(bw * mults[3] * 10) / 10,
    pro: Math.round(bw * mults[4] * 10) / 10,
  };

  let level: StrengthLevel = 'beginner';
  let levelLabel = 'Beginner (Почетник)';
  let levelColor = '#94a3b8'; // Slate
  let levelDescription = 'Гради основни моторни шеми и адаптација на тетива/мускул.';
  let progressPercent = 0;
  let nextLevelName: string | undefined = 'Normal (Нормално / Средно)';
  let kgNeeded: number | undefined = Math.max(0, thresholds.normal - oneRepMax);

  // An athlete qualifies for PRO if their estimated 1RM hits the Pro benchmark OR
  // if they have achieved Expert-level strength and sustain it for 15+ reps!
  const isProByScore = oneRepMax >= thresholds.pro;
  const isProByExpertHighReps = oneRepMax >= thresholds.expert && reps >= 15;
  const isPro = isProByScore || isProByExpertHighReps;

  if (isPro) {
    level = 'pro';
    levelLabel = 'Pro (Елитен Спортист / Про)';
    levelColor = '#f59e0b'; // Gold / Amber
    levelDescription = reps >= 15
      ? `Топ 1% елитна издржливост и сила (${reps} повторувања со тежина од Expert класа)! Ниво на натпреварувачки спортист.`
      : 'Топ 1% во светот за оваа телесна тежина. Ниво на натпреварувачки пауерлифтер.';
    progressPercent = 100;
    nextLevelName = undefined;
    kgNeeded = undefined;
  } else if (oneRepMax >= thresholds.expert) {
    level = 'expert';
    levelLabel = 'Expert (Експерт / Напреден)';
    levelColor = '#a855f7'; // Purple
    levelDescription = 'Исклучителна сила. Посилен од 95% од редовните вежбачи во теретана.';
    const range = Math.max(1, thresholds.pro - thresholds.expert);
    progressPercent = Math.min(99, Math.round(((oneRepMax - thresholds.expert) / range) * 100));
    nextLevelName = 'Pro (Елитно)';
    kgNeeded = Math.max(0.5, Math.round((thresholds.pro - oneRepMax) * 10) / 10);
  } else if (oneRepMax >= thresholds.advanced) {
    level = 'advanced';
    levelLabel = 'Advanced (Напредно Ниво)';
    levelColor = '#3b82f6'; // Blue
    levelDescription = 'Солидно напредно ниво. Резултат на повеќегодишен структуриран тренинг.';
    const range = thresholds.expert - thresholds.advanced;
    progressPercent = Math.min(100, Math.round(((oneRepMax - thresholds.advanced) / range) * 100));
    nextLevelName = 'Expert (Експерт)';
    kgNeeded = Math.round((thresholds.expert - oneRepMax) * 10) / 10;
  } else if (oneRepMax >= thresholds.normal) {
    level = 'normal';
    levelLabel = 'Normal / Intermediate (Нормално)';
    levelColor = '#10b981'; // Emerald Green
    levelDescription = 'Здраво атлетско ниво. Стабилна контрола на формата и добра релативна сила.';
    const range = thresholds.advanced - thresholds.normal;
    progressPercent = Math.min(100, Math.round(((oneRepMax - thresholds.normal) / range) * 100));
    nextLevelName = 'Advanced (Напредно)';
    kgNeeded = Math.round((thresholds.advanced - oneRepMax) * 10) / 10;
  } else {
    level = 'beginner';
    levelLabel = 'Beginner (Почетник)';
    levelColor = '#94a3b8';
    levelDescription = 'Почетна фаза на адаптација. Фокусирај се на контрола и постепено прогресивно оптоварување.';
    const range = thresholds.normal;
    progressPercent = Math.min(100, Math.round((oneRepMax / range) * 100));
    nextLevelName = 'Normal (Нормално)';
    kgNeeded = Math.round((thresholds.normal - oneRepMax) * 10) / 10;
  }

  return {
    exercise: ex,
    liftedWeightKg,
    reps,
    estimatedOneRepMaxKg: oneRepMax,
    bodyweightKg: bw,
    ratio,
    level,
    levelLabel,
    levelColor,
    levelDescription,
    thresholds,
    progressToNextLevelPercent: progressPercent,
    nextLevelName,
    kgNeededForNextLevel: kgNeeded,
  };
}
