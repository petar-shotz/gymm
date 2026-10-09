export interface ExerciseItem {
  id: string;
  name: string;
  category: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Full Body' | 'Cardio';
  equipment: 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Kettlebell' | 'Other';
  primaryMuscle: string;
  aliases?: string[];
  defaultSets?: number;
  defaultReps?: number;
}

export const EXERCISE_CATALOG: ExerciseItem[] = [
  // CHEST
  { id: 'bb-bench-press', name: 'Barbell Bench Press', category: 'Chest', equipment: 'Barbell', primaryMuscle: 'Chest', aliases: ['flat bench', 'bench press', 'bb bench', 'bp'], defaultSets: 4, defaultReps: 8 },
  { id: 'db-bench-press', name: 'Dumbbell Bench Press', category: 'Chest', equipment: 'Dumbbell', primaryMuscle: 'Chest', aliases: ['db bench', 'flat dumbbell press'], defaultSets: 3, defaultReps: 10 },
  { id: 'incline-bb-bench', name: 'Incline Barbell Bench Press', category: 'Chest', equipment: 'Barbell', primaryMuscle: 'Upper Chest', aliases: ['incline bench', 'incline barbell'], defaultSets: 3, defaultReps: 8 },
  { id: 'incline-db-bench', name: 'Incline Dumbbell Press', category: 'Chest', equipment: 'Dumbbell', primaryMuscle: 'Upper Chest', aliases: ['incline db', 'incline press'], defaultSets: 3, defaultReps: 10 },
  { id: 'decline-bb-bench', name: 'Decline Barbell Bench Press', category: 'Chest', equipment: 'Barbell', primaryMuscle: 'Lower Chest', aliases: ['decline bench'], defaultSets: 3, defaultReps: 10 },
  { id: 'decline-db-bench', name: 'Decline Dumbbell Press', category: 'Chest', equipment: 'Dumbbell', primaryMuscle: 'Lower Chest', aliases: ['decline db'], defaultSets: 3, defaultReps: 10 },
  { id: 'pushups', name: 'Pushups', category: 'Chest', equipment: 'Bodyweight', primaryMuscle: 'Chest', aliases: ['push ups', 'sklekovi', 'push-up'], defaultSets: 3, defaultReps: 15 },
  { id: 'diamond-pushups', name: 'Diamond Pushups', category: 'Chest', equipment: 'Bodyweight', primaryMuscle: 'Triceps & Chest', aliases: ['close grip pushups'], defaultSets: 3, defaultReps: 12 },
  { id: 'chest-dips', name: 'Chest Dips', category: 'Chest', equipment: 'Bodyweight', primaryMuscle: 'Lower Chest', aliases: ['dips', 'propadanja'], defaultSets: 3, defaultReps: 10 },
  { id: 'weighted-chest-dips', name: 'Weighted Chest Dips', category: 'Chest', equipment: 'Bodyweight', primaryMuscle: 'Lower Chest', aliases: ['weighted dips'], defaultSets: 3, defaultReps: 8 },
  { id: 'cable-crossover', name: 'Cable Crossover Flyes', category: 'Chest', equipment: 'Cable', primaryMuscle: 'Chest', aliases: ['cable fly', 'cable crossovers', 'sajli gradi'], defaultSets: 3, defaultReps: 12 },
  { id: 'low-to-high-cable-fly', name: 'Low to High Cable Fly', category: 'Chest', equipment: 'Cable', primaryMuscle: 'Upper Chest', aliases: ['incline cable fly'], defaultSets: 3, defaultReps: 12 },
  { id: 'pec-deck-fly', name: 'Pec Deck Machine Fly', category: 'Chest', equipment: 'Machine', primaryMuscle: 'Chest', aliases: ['pec deck', 'butterfly machine', 'peck deck'], defaultSets: 3, defaultReps: 12 },
  { id: 'db-flyes', name: 'Dumbbell Chest Flyes', category: 'Chest', equipment: 'Dumbbell', primaryMuscle: 'Chest', aliases: ['db fly', 'dumbbell fly'], defaultSets: 3, defaultReps: 12 },
  { id: 'incline-db-flyes', name: 'Incline Dumbbell Flyes', category: 'Chest', equipment: 'Dumbbell', primaryMuscle: 'Upper Chest', aliases: ['incline fly'], defaultSets: 3, defaultReps: 12 },
  { id: 'db-pullover', name: 'Dumbbell Pullover', category: 'Chest', equipment: 'Dumbbell', primaryMuscle: 'Chest & Lats', aliases: ['pullover'], defaultSets: 3, defaultReps: 12 },
  { id: 'machine-chest-press', name: 'Machine Chest Press', category: 'Chest', equipment: 'Machine', primaryMuscle: 'Chest', aliases: ['chest press machine'], defaultSets: 3, defaultReps: 10 },
  { id: 'smith-machine-bench', name: 'Smith Machine Bench Press', category: 'Chest', equipment: 'Machine', primaryMuscle: 'Chest', aliases: ['smith bench', 'smith press'], defaultSets: 3, defaultReps: 10 },

  // BACK
  { id: 'bb-deadlift', name: 'Barbell Deadlift', category: 'Back', equipment: 'Barbell', primaryMuscle: 'Lower Back & Posterior Chain', aliases: ['deadlift', 'conventional deadlift', 'mrtvo diganje', 'dl'], defaultSets: 4, defaultReps: 5 },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', category: 'Back', equipment: 'Barbell', primaryMuscle: 'Glutes & Back', aliases: ['sumo dl'], defaultSets: 4, defaultReps: 5 },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift (RDL)', category: 'Back', equipment: 'Barbell', primaryMuscle: 'Hamstrings & Back', aliases: ['rdl', 'romanian deadlift', 'stiff leg deadlift'], defaultSets: 3, defaultReps: 10 },
  { id: 'db-romanian-deadlift', name: 'Dumbbell Romanian Deadlift (DB RDL)', category: 'Back', equipment: 'Dumbbell', primaryMuscle: 'Hamstrings & Glutes', aliases: ['db rdl', 'dumbbell rdl'], defaultSets: 3, defaultReps: 10 },
  { id: 'pullups', name: 'Pullups', category: 'Back', equipment: 'Bodyweight', primaryMuscle: 'Lats', aliases: ['pull ups', 'vratilo', 'zgibovi'], defaultSets: 3, defaultReps: 8 },
  { id: 'weighted-pullups', name: 'Weighted Pullups', category: 'Back', equipment: 'Bodyweight', primaryMuscle: 'Lats', aliases: ['weighted pull up'], defaultSets: 3, defaultReps: 6 },
  { id: 'chinups', name: 'Chin-Ups', category: 'Back', equipment: 'Bodyweight', primaryMuscle: 'Lats & Biceps', aliases: ['chin ups', 'underhand pullups'], defaultSets: 3, defaultReps: 8 },
  { id: 'lat-pulldown', name: 'Wide-Grip Lat Pulldown', category: 'Back', equipment: 'Cable', primaryMuscle: 'Lats', aliases: ['lat pulldown', 'lat masina', 'pulldown'], defaultSets: 3, defaultReps: 10 },
  { id: 'close-lat-pulldown', name: 'Close-Grip Lat Pulldown', category: 'Back', equipment: 'Cable', primaryMuscle: 'Lats', aliases: ['v-bar lat pulldown', 'neutral lat pulldown'], defaultSets: 3, defaultReps: 10 },
  { id: 'reverse-grip-lat-pulldown', name: 'Underhand Reverse Lat Pulldown', category: 'Back', equipment: 'Cable', primaryMuscle: 'Lower Lats & Biceps', aliases: ['reverse lat pulldown'], defaultSets: 3, defaultReps: 10 },
  { id: 'bb-row', name: 'Bent Over Barbell Row', category: 'Back', equipment: 'Barbell', primaryMuscle: 'Middle Back', aliases: ['barbell row', 'pendlay row', 'veslanje'], defaultSets: 4, defaultReps: 8 },
  { id: 'db-row', name: 'Single-Arm Dumbbell Row', category: 'Back', equipment: 'Dumbbell', primaryMuscle: 'Lats & Middle Back', aliases: ['dumbbell row', 'one arm row'], defaultSets: 3, defaultReps: 10 },
  { id: 'chest-supported-db-row', name: 'Chest-Supported Incline Dumbbell Row', category: 'Back', equipment: 'Dumbbell', primaryMuscle: 'Upper Back & Lats', aliases: ['chest supported row', 'incline db row'], defaultSets: 3, defaultReps: 10 },
  { id: 'seated-cable-row', name: 'Seated Cable Row', category: 'Back', equipment: 'Cable', primaryMuscle: 'Middle Back', aliases: ['cable row', 'veslanje na sajla'], defaultSets: 3, defaultReps: 10 },
  { id: 't-bar-row', name: 'T-Bar Row', category: 'Back', equipment: 'Barbell', primaryMuscle: 'Middle Back', aliases: ['t bar row', 't-bar'], defaultSets: 3, defaultReps: 10 },
  { id: 'face-pull', name: 'Face Pulls', category: 'Back', equipment: 'Cable', primaryMuscle: 'Rear Delts & Traps', aliases: ['face pulls', 'rope face pull'], defaultSets: 3, defaultReps: 15 },
  { id: 'straight-arm-pulldown', name: 'Straight-Arm Cable Lat Pulldown', category: 'Back', equipment: 'Cable', primaryMuscle: 'Lats', aliases: ['lat pushdown', 'straight arm pulldown'], defaultSets: 3, defaultReps: 12 },
  { id: 'bb-shrugs', name: 'Barbell Shrugs', category: 'Back', equipment: 'Barbell', primaryMuscle: 'Traps', aliases: ['shrugs', 'trapez'], defaultSets: 3, defaultReps: 12 },
  { id: 'db-shrugs', name: 'Dumbbell Shrugs', category: 'Back', equipment: 'Dumbbell', primaryMuscle: 'Traps', aliases: ['db shrugs', 'dumbbell traps'], defaultSets: 3, defaultReps: 12 },
  { id: 'hyperextensions', name: 'Back Hyperextensions', category: 'Back', equipment: 'Bodyweight', primaryMuscle: 'Lower Back & Glutes', aliases: ['back extensions'], defaultSets: 3, defaultReps: 15 },

  // LEGS
  { id: 'bb-squat', name: 'Barbell Back Squat', category: 'Legs', equipment: 'Barbell', primaryMuscle: 'Quadriceps & Glutes', aliases: ['squat', 'back squat', 'klek', 'sq'], defaultSets: 4, defaultReps: 8 },
  { id: 'front-squat', name: 'Front Squat', category: 'Legs', equipment: 'Barbell', primaryMuscle: 'Quadriceps & Core', aliases: ['preden klek', 'front squat bb'], defaultSets: 3, defaultReps: 8 },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'Legs', equipment: 'Dumbbell', primaryMuscle: 'Quadriceps', aliases: ['db goblet squat', 'kettlebell squat'], defaultSets: 3, defaultReps: 12 },
  { id: 'leg-press', name: 'Leg Press', category: 'Legs', equipment: 'Machine', primaryMuscle: 'Quadriceps & Glutes', aliases: ['leg press 45', 'nozna presa'], defaultSets: 3, defaultReps: 10 },
  { id: 'hack-squat', name: 'Hack Squat Machine', category: 'Legs', equipment: 'Machine', primaryMuscle: 'Quadriceps', aliases: ['hack squat', 'hek klek'], defaultSets: 3, defaultReps: 10 },
  { id: 'smith-machine-squat', name: 'Smith Machine Squat', category: 'Legs', equipment: 'Machine', primaryMuscle: 'Quadriceps', aliases: ['smith squat'], defaultSets: 3, defaultReps: 10 },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Legs', equipment: 'Dumbbell', primaryMuscle: 'Quads & Glutes', aliases: ['split squat', 'bulgarian squat', 'bss'], defaultSets: 3, defaultReps: 10 },
  { id: 'db-lunges', name: 'Dumbbell Walking Lunges', category: 'Legs', equipment: 'Dumbbell', primaryMuscle: 'Quadriceps & Glutes', aliases: ['lunges', 'iskoraci', 'walking lunges'], defaultSets: 3, defaultReps: 12 },
  { id: 'reverse-lunges', name: 'Reverse Lunges', category: 'Legs', equipment: 'Dumbbell', primaryMuscle: 'Glutes & Hamstrings', aliases: ['step back lunges'], defaultSets: 3, defaultReps: 10 },
  { id: 'leg-extension', name: 'Leg Extension Machine', category: 'Legs', equipment: 'Machine', primaryMuscle: 'Quadriceps', aliases: ['leg extension', 'nozna ekstenzija', 'quad extensions'], defaultSets: 3, defaultReps: 12 },
  { id: 'lying-leg-curl', name: 'Lying Leg Curls', category: 'Legs', equipment: 'Machine', primaryMuscle: 'Hamstrings', aliases: ['leg curl', 'lying hamstring curl'], defaultSets: 3, defaultReps: 10 },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', category: 'Legs', equipment: 'Machine', primaryMuscle: 'Hamstrings', aliases: ['seated hamstring curl'], defaultSets: 3, defaultReps: 10 },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', category: 'Legs', equipment: 'Barbell', primaryMuscle: 'Glutes', aliases: ['hip thrust', 'glute bridge', 'gluteus'], defaultSets: 3, defaultReps: 10 },
  { id: 'db-hip-thrust', name: 'Dumbbell Glute Bridge', category: 'Legs', equipment: 'Dumbbell', primaryMuscle: 'Glutes', aliases: ['glute bridge db'], defaultSets: 3, defaultReps: 12 },
  { id: 'standing-calf-raise', name: 'Standing Calf Raises', category: 'Legs', equipment: 'Machine', primaryMuscle: 'Calves (Gastrocnemius)', aliases: ['calf raise', 'listovi'], defaultSets: 4, defaultReps: 15 },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', category: 'Legs', equipment: 'Machine', primaryMuscle: 'Calves (Soleus)', aliases: ['seated calves'], defaultSets: 4, defaultReps: 15 },
  { id: 'abductor-machine', name: 'Hip Abductor Machine', category: 'Legs', equipment: 'Machine', primaryMuscle: 'Glute Medius & Outer Thighs', aliases: ['abductor', 'outer thigh'], defaultSets: 3, defaultReps: 15 },
  { id: 'adductor-machine', name: 'Hip Adductor Machine', category: 'Legs', equipment: 'Machine', primaryMuscle: 'Inner Thighs', aliases: ['adductor', 'inner thigh'], defaultSets: 3, defaultReps: 15 },

  // SHOULDERS
  { id: 'overhead-press', name: 'Overhead Barbell Military Press (OHP)', category: 'Shoulders', equipment: 'Barbell', primaryMuscle: 'Shoulders', aliases: ['ohp', 'military press', 'overhead press', 'ramena sipka'], defaultSets: 4, defaultReps: 8 },
  { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', category: 'Shoulders', equipment: 'Dumbbell', primaryMuscle: 'Front & Side Delts', aliases: ['db shoulder press', 'seated db press'], defaultSets: 3, defaultReps: 10 },
  { id: 'arnold-press', name: 'Arnold Dumbbell Press', category: 'Shoulders', equipment: 'Dumbbell', primaryMuscle: 'Shoulders', aliases: ['arnold press', 'arnoldov potisok'], defaultSets: 3, defaultReps: 10 },
  { id: 'lateral-raise', name: 'Dumbbell Side Lateral Raise', category: 'Shoulders', equipment: 'Dumbbell', primaryMuscle: 'Lateral Delts', aliases: ['lateral raise', 'side lateral', 'stranicno diganje'], defaultSets: 4, defaultReps: 12 },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', category: 'Shoulders', equipment: 'Cable', primaryMuscle: 'Lateral Delts', aliases: ['cable lateral', 'cable side raise'], defaultSets: 3, defaultReps: 15 },
  { id: 'front-raise', name: 'Front Dumbbell Raise', category: 'Shoulders', equipment: 'Dumbbell', primaryMuscle: 'Front Delts', aliases: ['front raise', 'predno diganje'], defaultSets: 3, defaultReps: 12 },
  { id: 'reverse-pec-deck', name: 'Reverse Pec Deck (Rear Delts)', category: 'Shoulders', equipment: 'Machine', primaryMuscle: 'Rear Delts', aliases: ['reverse fly', 'rear delt machine'], defaultSets: 3, defaultReps: 15 },
  { id: 'bent-over-rear-delt-fly', name: 'Bent-Over Dumbbell Rear Delt Fly', category: 'Shoulders', equipment: 'Dumbbell', primaryMuscle: 'Rear Delts', aliases: ['rear delt fly', 'rear delts'], defaultSets: 3, defaultReps: 12 },
  { id: 'upright-row', name: 'Barbell Upright Row', category: 'Shoulders', equipment: 'Barbell', primaryMuscle: 'Shoulders & Traps', aliases: ['upright row'], defaultSets: 3, defaultReps: 10 },
  { id: 'cable-upright-row', name: 'Cable Upright Row', category: 'Shoulders', equipment: 'Cable', primaryMuscle: 'Shoulders & Traps', aliases: ['sajla upright row'], defaultSets: 3, defaultReps: 12 },
  { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', category: 'Shoulders', equipment: 'Machine', primaryMuscle: 'Shoulders', aliases: ['shoulder press machine'], defaultSets: 3, defaultReps: 10 },

  // ARMS (BICEPS, TRICEPS, FOREARMS)
  { id: 'db-bicep-curl', name: 'Dumbbell Bicep Curl', category: 'Arms', equipment: 'Dumbbell', primaryMuscle: 'Biceps', aliases: ['bicep curl', 'db curl', 'biceps'], defaultSets: 3, defaultReps: 10 },
  { id: 'bb-bicep-curl', name: 'Barbell Bicep Curl', category: 'Arms', equipment: 'Barbell', primaryMuscle: 'Biceps', aliases: ['bb curl', 'barbell curl'], defaultSets: 3, defaultReps: 10 },
  { id: 'ez-bar-curl', name: 'EZ-Bar Bicep Curl', category: 'Arms', equipment: 'Barbell', primaryMuscle: 'Biceps', aliases: ['ez curl', 'ez bar'], defaultSets: 3, defaultReps: 10 },
  { id: 'hammer-curl', name: 'Dumbbell Hammer Curl', category: 'Arms', equipment: 'Dumbbell', primaryMuscle: 'Brachialis & Forearms', aliases: ['hammer curl', 'cekic biceps'], defaultSets: 3, defaultReps: 10 },
  { id: 'cable-rope-hammer-curl', name: 'Cable Rope Hammer Curl', category: 'Arms', equipment: 'Cable', primaryMuscle: 'Brachialis & Forearms', aliases: ['rope hammer curl'], defaultSets: 3, defaultReps: 12 },
  { id: 'preacher-curl', name: 'Preacher Curl (Scotts Bench)', category: 'Arms', equipment: 'Barbell', primaryMuscle: 'Biceps Peak', aliases: ['preacher curl', 'skotova klupa'], defaultSets: 3, defaultReps: 10 },
  { id: 'incline-db-curl', name: 'Incline Dumbbell Curl', category: 'Arms', equipment: 'Dumbbell', primaryMuscle: 'Long Head Biceps', aliases: ['incline curl', 'incline bicep'], defaultSets: 3, defaultReps: 10 },
  { id: 'concentration-curl', name: 'Concentration Dumbbell Curl', category: 'Arms', equipment: 'Dumbbell', primaryMuscle: 'Biceps Peak', aliases: ['concentration curl'], defaultSets: 3, defaultReps: 12 },
  { id: 'cable-curl', name: 'Cable Bicep Curl', category: 'Arms', equipment: 'Cable', primaryMuscle: 'Biceps', aliases: ['cable curl', 'sajla biceps'], defaultSets: 3, defaultReps: 12 },
  { id: 'triceps-pushdown', name: 'Triceps Cable Straight-Bar Pushdown', category: 'Arms', equipment: 'Cable', primaryMuscle: 'Triceps Lateral Head', aliases: ['tricep pushdown', 'cable pushdown', 'triceps'], defaultSets: 3, defaultReps: 12 },
  { id: 'rope-pushdown', name: 'Triceps Rope Pushdown', category: 'Arms', equipment: 'Cable', primaryMuscle: 'Triceps', aliases: ['rope pushdown', 'sajla triceps'], defaultSets: 3, defaultReps: 12 },
  { id: 'skull-crushers', name: 'Skull Crushers (Lying EZ-Bar Extension)', category: 'Arms', equipment: 'Barbell', primaryMuscle: 'Triceps Long Head', aliases: ['skull crushers', 'french press', 'lezeca triceps ekstenzija'], defaultSets: 3, defaultReps: 10 },
  { id: 'db-overhead-triceps', name: 'Overhead Dumbbell Triceps Extension', category: 'Arms', equipment: 'Dumbbell', primaryMuscle: 'Triceps Long Head', aliases: ['overhead tricep', 'overhead extension'], defaultSets: 3, defaultReps: 10 },
  { id: 'cable-overhead-triceps', name: 'Cable Overhead Rope Extension', category: 'Arms', equipment: 'Cable', primaryMuscle: 'Triceps Long Head', aliases: ['cable overhead tricep'], defaultSets: 3, defaultReps: 12 },
  { id: 'close-grip-bench', name: 'Close-Grip Bench Press', category: 'Arms', equipment: 'Barbell', primaryMuscle: 'Triceps & Chest', aliases: ['close grip bench', 'cgbp'], defaultSets: 3, defaultReps: 8 },
  { id: 'triceps-dips', name: 'Bench Triceps Dips', category: 'Arms', equipment: 'Bodyweight', primaryMuscle: 'Triceps', aliases: ['bench dips'], defaultSets: 3, defaultReps: 12 },
  { id: 'wrist-curls', name: 'Barbell Wrist Curls (Forearms)', category: 'Arms', equipment: 'Barbell', primaryMuscle: 'Forearms', aliases: ['wrist curl', 'podlaktica'], defaultSets: 3, defaultReps: 15 },

  // CORE / ABS
  { id: 'crunches', name: 'Abdominal Crunches', category: 'Core', equipment: 'Bodyweight', primaryMuscle: 'Rectus Abdominis', aliases: ['crunches', 'stomacni', 'trbusnjaci', 'abs'], defaultSets: 3, defaultReps: 20 },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raises', category: 'Core', equipment: 'Bodyweight', primaryMuscle: 'Lower Abs', aliases: ['hanging leg raise', 'visenje stomak'], defaultSets: 3, defaultReps: 12 },
  { id: 'hanging-knee-raise', name: 'Hanging Knee Raises', category: 'Core', equipment: 'Bodyweight', primaryMuscle: 'Lower Abs', aliases: ['knee raise'], defaultSets: 3, defaultReps: 15 },
  { id: 'plank', name: 'Plank Hold', category: 'Core', equipment: 'Bodyweight', primaryMuscle: 'Core Stability', aliases: ['plank', 'izdrzaj'], defaultSets: 3, defaultReps: 60 },
  { id: 'side-plank', name: 'Side Plank', category: 'Core', equipment: 'Bodyweight', primaryMuscle: 'Obliques', aliases: ['side plank'], defaultSets: 3, defaultReps: 45 },
  { id: 'cable-woodchopper', name: 'Cable Woodchopper', category: 'Core', equipment: 'Cable', primaryMuscle: 'Obliques & Core', aliases: ['woodchopper', 'cable twist'], defaultSets: 3, defaultReps: 12 },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', category: 'Core', equipment: 'Other', primaryMuscle: 'Deep Core & Rectus Abdominis', aliases: ['ab wheel', 'rollout'], defaultSets: 3, defaultReps: 10 },
  { id: 'russian-twist', name: 'Russian Twists', category: 'Core', equipment: 'Bodyweight', primaryMuscle: 'Obliques', aliases: ['russian twist'], defaultSets: 3, defaultReps: 20 },
  { id: 'cable-crunch', name: 'Kneeling Cable Crunch', category: 'Core', equipment: 'Cable', primaryMuscle: 'Upper & Middle Abs', aliases: ['cable crunch', 'molitva stomacni'], defaultSets: 3, defaultReps: 15 },
  { id: 'decline-situp', name: 'Decline Bench Sit-Ups', category: 'Core', equipment: 'Bodyweight', primaryMuscle: 'Abdominals', aliases: ['decline situp'], defaultSets: 3, defaultReps: 15 },

  // FULL BODY & FUNCTIONAL / CARDIO
  { id: 'kettlebell-swing', name: 'Kettlebell Swings', category: 'Full Body', equipment: 'Kettlebell', primaryMuscle: 'Glutes, Hamstrings & Core', aliases: ['kb swing', 'kettlebell swing'], defaultSets: 4, defaultReps: 15 },
  { id: 'burpees', name: 'Burpees', category: 'Full Body', equipment: 'Bodyweight', primaryMuscle: 'Full Body Conditioning', aliases: ['burpee'], defaultSets: 3, defaultReps: 15 },
  { id: 'clean-and-press', name: 'Barbell Clean and Press', category: 'Full Body', equipment: 'Barbell', primaryMuscle: 'Total Body Power', aliases: ['clean and press', 'power clean'], defaultSets: 4, defaultReps: 6 },
  { id: 'farmers-walk', name: 'Dumbbell Farmers Walk', category: 'Full Body', equipment: 'Dumbbell', primaryMuscle: 'Grip, Traps & Core', aliases: ['farmers walk', 'farmers carry'], defaultSets: 3, defaultReps: 30 },
  { id: 'jump-rope', name: 'Jump Rope Session', category: 'Cardio', equipment: 'Other', primaryMuscle: 'Cardiovascular & Calves', aliases: ['skakanje jaze', 'jump rope', 'skipping'], defaultSets: 3, defaultReps: 180 },
  { id: 'rowing-machine', name: 'Rowing Machine (Ergometer)', category: 'Cardio', equipment: 'Machine', primaryMuscle: 'Full Body Endurance', aliases: ['veslanje masina', 'rowing erg'], defaultSets: 1, defaultReps: 1000 },
  { id: 'treadmill-incline', name: 'Incline Treadmill Walk', category: 'Cardio', equipment: 'Machine', primaryMuscle: 'Cardio & Calves', aliases: ['treadmill', 'walking', 'trcanje'], defaultSets: 1, defaultReps: 20 },
];

/**
 * Ultra-responsive exercise filter based on typed letters (query).
 * Prioritizes:
 * 1. Exact startsWith match on exercise name
 * 2. Exact match on aliases/acronyms (e.g. "rdl", "ohp", "bp", "sq", "dl")
 * 3. Word startsWith match (e.g. typing "bench" matches "Incline Dumbbell Bench Press")
 * 4. Substring in name or alias
 * 5. Primary muscle or equipment match
 */
export function searchExercises(
  query: string,
  historyExercises: string[] = [],
  limit = 16
): ExerciseItem[] {
  const clean = query.trim().toLowerCase();

  // Custom user items from logging history
  const customItems: ExerciseItem[] = [];
  const catalogNames = new Set(EXERCISE_CATALOG.map((e) => e.name.toLowerCase()));

  for (const hist of historyExercises) {
    if (hist && !catalogNames.has(hist.toLowerCase())) {
      customItems.push({
        id: `custom-${hist.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: hist,
        category: 'Full Body',
        equipment: 'Other',
        primaryMuscle: 'Custom Logged Movement',
        defaultSets: 3,
        defaultReps: 10,
      });
      catalogNames.add(hist.toLowerCase());
    }
  }

  const allItems = [...customItems, ...EXERCISE_CATALOG];

  if (!clean) {
    // Return top foundation exercises across categories
    return allItems.slice(0, limit);
  }

  // Multi-tier scoring
  const scored = allItems
    .map((item) => {
      const nameLower = item.name.toLowerCase();
      const muscleLower = item.primaryMuscle.toLowerCase();
      const catLower = item.category.toLowerCase();
      const equipLower = item.equipment.toLowerCase();
      const aliases = item.aliases || [];

      let score = 0;

      // Check alias exact match (e.g. "rdl" -> Romanian Deadlift)
      if (aliases.some((a) => a.toLowerCase() === clean)) {
        score = 200;
      } else if (aliases.some((a) => a.toLowerCase().startsWith(clean))) {
        score = 150;
      } else if (nameLower.startsWith(clean)) {
        // Starts with exact typed letters (e.g. "b" -> Barbell Bench Press)
        score = 120 - Math.min(20, nameLower.length - clean.length);
      } else {
        // Check if any word in the exercise name starts with the typed letters
        const words = nameLower.split(/[\s\-()]+/);
        const wordMatchIndex = words.findIndex((w) => w.startsWith(clean));
        if (wordMatchIndex >= 0) {
          score = 90 - wordMatchIndex * 5;
        } else if (aliases.some((a) => a.toLowerCase().includes(clean))) {
          score = 70;
        } else if (nameLower.includes(clean)) {
          score = 60;
        } else if (muscleLower.startsWith(clean) || muscleLower.includes(clean)) {
          score = 40;
        } else if (catLower.startsWith(clean)) {
          score = 30;
        } else if (equipLower.startsWith(clean)) {
          score = 25;
        }
      }

      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.item);
}
