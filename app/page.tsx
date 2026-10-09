'use client';

import ExerciseLibrary from './exercise-library';
import { saveFitness } from '@/lib/save-fitness';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { TDEECalculator } from '@/components/TDEECalculator';
import { ExerciseAutocomplete } from '@/components/ExerciseAutocomplete';
import { MacedoniaSupplements, MACEDONIAN_SUPPLEMENTS, type SupplementItem } from '@/components/MacedoniaSupplements';
import { calculateAccurateHydration } from '@/lib/hydration';
import { calculateFoodNutrient, isSupplementFood } from '@/lib/nutrients';
import { VERIFIED_FOOD_CATALOG, calculateServingMicros } from '@/lib/foods';
import {
  getBodyweightMicroTargets,
  assessMicroDanger,
  BODYWEIGHT_MICRONUTRIENTS,
  type MicroCategory,
} from '@/lib/micronutrients';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  saveRecordToFirestore,
  loadRecordsFromFirestore,
  testConnection,
} from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  Flame,
  LayoutDashboard,
  Utensils,
  Dumbbell,
  Droplets,
  Timer,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  Check,
  Trash2,
  CalendarDays,
  Activity,
  Pause,
  Play,
  RotateCcw,
  Flag,
  Target,
  Cloud,
  Calculator,
  Lock,
  Search,
  Sparkles,
  Scale,
  Sun,
  CheckCircle2,
  Pill,
  AlertTriangle,
  Star,
  Shield,
  Trophy,
} from 'lucide-react';
import PlansSection from '@/components/PlansSection';
import PRsSection from '@/components/PRsSection';
import InteractiveBodyMap, { getMusclesForExercise } from '@/components/InteractiveBodyMap';

type Food = {
  id: string;
  name: string;
  meal: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  micros?: Record<string, number>;
  servingGrams?: number;
  perServing?: boolean;
  isSupplement?: boolean;
};

type Workout = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  done: boolean;
};

type Day = {
  foods: Food[];
  workouts: Workout[];
  water: number;
  micros: Record<string, number>;
  morningWeight?: number;
};

type Profile = {
  name: string;
  age: number;
  sex: string;
  weight: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
};

const blank = (): Day => ({
  foods: [],
  workouts: [],
  water: 0,
  micros: {},
});

const initialProfile: Profile = {
  name: 'Athlete',
  age: 25,
  sex: 'male',
  weight: 80,
  calories: 2400,
  protein: 160,
  carbs: 280,
  fat: 71,
  water: 2800, // 80kg * 35 ml/kg = 2800 ml (ACSM / EFSA accurate baseline)
};

const nutrients = ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'] as const;

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parse = (s: string) => new Date(s + 'T12:00:00');
const round = (n: number) => Math.round(n * 10) / 10;
const fmt = (ms: number) =>
  `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

const MONTHS_LIST = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const formatLongDate = (d: Date) =>
  `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LIST[d.getMonth()]} ${d.getFullYear()}`;
const formatMonthYear = (d: Date) => `${MONTHS_LIST[d.getMonth()]} ${d.getFullYear()}`;
const formatDayShort = (d: Date) => DAYS_SHORT[d.getDay()];

const STATIC_CANONICAL_DATE = '2026-10-06';
const emptySubscribe = () => () => {};
const clientDateSnapshot = () => dateKey(new Date());
const serverDateSnapshot = () => STATIC_CANONICAL_DATE;

function useClientToday() {
  return useSyncExternalStore(emptySubscribe, clientDateSnapshot, serverDateSnapshot);
}

async function readResponse(response: Response): Promise<Record<string, unknown>> {
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    if (response.status === 401 || response.status === 403 || response.redirected) {
      throw new Error('Your session needs to be refreshed. Open the app in a new tab and sign in, then retry.');
    }
    throw new Error('The data service returned an unexpected response. Please retry in a moment.');
  }
  const result = (await response.json()) as { error?: string } & Record<string, unknown>;
  if (!response.ok) {
    throw new Error(result.error || 'The request could not be completed. Please retry.');
  }
  return result;
}

export default function App() {
  const todayKey = useClientToday();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selected = selectedDate ?? todayKey;
  const setSelected = (d: string) => setSelectedDate(d);

  const [records, setRecords] = useState<Record<string, Day | Profile | unknown>>({});
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const profileRef = useRef<Profile>(initialProfile);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const [tab, setTab] = useState('Overview');
  const [modal, setModal] = useState('');
  const [status, setStatus] = useState('Ready');
  const [ready, setReady] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [search, setSearch] = useState('');
  const [foodCategory, setFoodCategory] = useState('All');
  const [microFilter, setMicroFilter] = useState<'All' | MicroCategory | 'Danger Zones'>('All');
  const [microModalSearch, setMicroModalSearch] = useState('');
  const [microModalCategory, setMicroModalCategory] = useState<'All' | MicroCategory>('All');
  const [suppModalSearch, setSuppModalSearch] = useState('');
  const [suppModalTab, setSuppModalTab] = useState<'catalog' | 'custom'>('catalog');
  const [stashSearch, setStashSearch] = useState('');
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [analog, setAnalog] = useState(false);
  const base = useRef(0);
  const started = useRef(0);

  const [morningWeightInput, setMorningWeightInput] = useState('');
  const [morningWeighInSaved, setMorningWeighInSaved] = useState(false);
  const [quickExerciseQuery, setQuickExerciseQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedMuscleExercise, setSelectedMuscleExercise] = useState<string>('Barbell Bench Press');
  const [selectedActiveMuscles, setSelectedActiveMuscles] = useState<string[]>(['Chest', 'Triceps', 'Front Delts']);

  const [favoriteSupplements, setFavoriteSupplements] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('trainforge_favorite_supplements');
        return saved
          ? JSON.parse(saved)
          : ['on-gold-standard-whey', 'cregaatine-60-packs', 'alkaloid-magnezium-400-b-complex', 'alkaloid-c-vitam-1000mg'];
      } catch {
        return ['on-gold-standard-whey', 'cregaatine-60-packs', 'alkaloid-magnezium-400-b-complex', 'alkaloid-c-vitam-1000mg'];
      }
    }
    return ['on-gold-standard-whey', 'cregaatine-60-packs', 'alkaloid-magnezium-400-b-complex', 'alkaloid-c-vitam-1000mg'];
  });

  function handleToggleFavorite(id: string) {
    setFavoriteSupplements((prev) => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem('trainforge_favorite_supplements', JSON.stringify(next));
      } catch {}
      if (currentUser) {
        saveRecordToFirestore(currentUser.uid, 'favorite_supplements', { items: next }).catch(() => {});
      }
      const item = MACEDONIAN_SUPPLEMENTS.find((s) => s.id === id);
      const title = item ? item.nameMk.split('(')[0].trim() : id;
      showNotice(isFav ? `⭐ Отстрането од омилени: ${title}` : `⭐ Додадено во твојот активен стек: ${title}`);
      return next;
    });
  }

  function showNotice(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5500);
  }

  const favoriteItems = useMemo(() => {
    return MACEDONIAN_SUPPLEMENTS.filter((s) => favoriteSupplements.includes(s.id));
  }, [favoriteSupplements]);

  const filteredStashItems = useMemo(() => {
    if (!stashSearch.trim()) return favoriteItems;
    const q = stashSearch.toLowerCase().trim();
    return favoriteItems.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nameMk.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.retailers.some((r) => r.toLowerCase().includes(q))
    );
  }, [favoriteItems, stashSearch]);

  const userHistoryExercises = useMemo(() => {
    const names = new Set<string>();
    Object.values(records).forEach((r) => {
      if (r && typeof r === 'object' && 'workouts' in r) {
        const ws = (r as { workouts: Array<{ name: string }> }).workouts;
        if (Array.isArray(ws)) {
          ws.forEach((w) => {
            if (w.name) names.add(w.name.trim());
          });
        }
      }
    });
    return Array.from(names);
  }, [records]);

  const todayRaw = records[todayKey];
  const todayRecord: Day =
    todayRaw && typeof todayRaw === 'object' && 'foods' in todayRaw
      ? (todayRaw as Day)
      : blank();
  const hasWeighedInToday = Boolean(
    todayRecord.morningWeight && todayRecord.morningWeight > 0
  );

  async function handleLogMorningWeight(valKg: number) {
    if (valKg <= 0) return;
    await save(todayKey, { ...todayRecord, morningWeight: valKg });
    const autoWater = Math.round(valKg * (profile.sex === 'female' ? 33 : 35));
    await save('profile', { ...profile, weight: valKg, water: autoWater });
    try {
      const saved = localStorage.getItem('trainforge_21day_adaptive_logs');
      if (saved) {
        const logs = JSON.parse(saved);
        if (Array.isArray(logs)) {
          const todayEntry =
            logs.find((l: { dateStr: string }) => l.dateStr === todayKey) || logs[logs.length - 1];
          if (todayEntry) {
            todayEntry.weightInput = String(valKg);
            localStorage.setItem('trainforge_21day_adaptive_logs', JSON.stringify(logs));
          }
        }
      }
    } catch {}
    setMorningWeighInSaved(true);
    setTimeout(() => setMorningWeighInSaved(false), 5000);
  }

  useEffect(() => {
    if (!running) return;
    const tick = () => setElapsed(base.current + performance.now() - started.current);
    const id = setInterval(tick, 40);
    return () => clearInterval(id);
  }, [running]);

  async function load() {
    setError('');
    try {
      const r = await fetch('/api/data', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const d = await readResponse(r);
      setRecords(d);
      if (d.profile && typeof d.profile === 'object') {
        setProfile({ ...initialProfile, ...(d.profile as Profile) });
      }
      setReady(true);
      setStatus('All changes saved');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Not connected';
      setError(msg);
      setStatus('Not connected');
    }
  }

  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setStatus('Syncing with Cloud…');
        try {
          const cloud = await loadRecordsFromFirestore(user.uid);
          if (cloud && Object.keys(cloud).length > 0) {
            setRecords(cloud);
            if (cloud.profile && typeof cloud.profile === 'object') {
              setProfile({ ...initialProfile, ...(cloud.profile as Profile) });
            }
            if (cloud.favorite_supplements && typeof cloud.favorite_supplements === 'object') {
              const favObj = cloud.favorite_supplements as { items?: string[] };
              if (Array.isArray(favObj.items)) {
                setFavoriteSupplements(favObj.items);
                try {
                  localStorage.setItem('trainforge_favorite_supplements', JSON.stringify(favObj.items));
                } catch {}
              }
            }
          } else {
            await load();
            await saveRecordToFirestore(user.uid, 'profile', profileRef.current).catch(() => {});
          }
          setReady(true);
          setStatus('Cloud synced');
        } catch (err: unknown) {
          console.warn('Firestore load fallback:', err);
          await load();
        }
      } else {
        await load();
      }
    });

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => unsubscribe();
  }, []);

  const rawDay = records[selected];
  const day: Day =
    rawDay && typeof rawDay === 'object' && 'foods' in rawDay ? (rawDay as Day) : blank();

  const total = Object.fromEntries(
    nutrients.map((k) => [
      k,
      day.foods.reduce((a, f) => a + calculateFoodNutrient(f, k), 0),
    ])
  ) as Record<string, number>;

  // Automatically calculate all vitamins & minerals provided by foods logged on this day
  const foodMicros: Record<string, number> = {};
  for (const f of day.foods) {
    let itemMicros = f.micros;
    if (!itemMicros) {
      const match = VERIFIED_FOOD_CATALOG.find((x) => x.name === f.name || x.id === f.id);
      if (match) {
        itemMicros = calculateServingMicros(match, f.grams);
      }
    }
    if (itemMicros) {
      for (const [k, v] of Object.entries(itemMicros)) {
        if (typeof v === 'number' && v > 0) {
          foodMicros[k] = (foodMicros[k] || 0) + v;
        }
      }
    }
  }
  for (const k in foodMicros) {
    foodMicros[k] = Math.round(foodMicros[k] * 10) / 10;
  }

  const monday = parse(selected);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  async function save(key: string, value: unknown) {
    setSaving(true);
    setError('');
    setStatus('Saving…');
    try {
      if (currentUser) {
        await saveRecordToFirestore(currentUser.uid, key, value);
      }
      await saveFitness(key, value).catch(() => {});
      setRecords((prev) => ({ ...prev, [key]: value }));
      if (key === 'profile' && typeof value === 'object' && value !== null) {
        setProfile(value as Profile);
      }
      setStatus(currentUser ? 'Saved to Cloud' : 'All changes saved');
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Changes not saved';
      setError(msg);
      setStatus('Changes not saved');
      return false;
    } finally {
      setSaving(false);
    }
  }

  const update = (patch: Partial<Day>) => save(selected, { ...day, ...patch });

  async function handleLogSupplementFromDirectory(item: SupplementItem) {
    let proteinVal = 0;
    let carbsVal = 0;
    let fatVal = 0;
    let kcalVal = 0;
    const itemMicros: Record<string, number> = {};

    if (item.category === 'Proteins') {
      proteinVal = item.proteinGramsPerServing || 24;
      carbsVal = 2;
      fatVal = 1.5;
      kcalVal = Math.round(proteinVal * 4 + 25);
      itemMicros['Calcium'] = 150;
      itemMicros['Potassium'] = 180;
      itemMicros['Phosphorus'] = 120;
    } else if (item.category === 'Mass Gainers') {
      proteinVal = item.proteinGramsPerServing || 50;
      carbsVal = 250;
      fatVal = 4;
      kcalVal = 1250;
      itemMicros['Calcium'] = 300;
    } else if (item.category === 'Amino Acids') {
      proteinVal = 8; // 8g pure amino acid equivalent counting toward daily protein
      carbsVal = 0.5;
      fatVal = 0;
      kcalVal = 35;
      itemMicros['Vitamin B6'] = 2;
    } else if (item.category === 'Omega & Healthy Fats') {
      proteinVal = 0.2;
      carbsVal = 0;
      fatVal = 2.0; // 2g healthy EPA/DHA omega-3 fats
      kcalVal = 20;
      itemMicros['Vitamin E'] = 5;
    } else if (item.category === 'Pre-Workout') {
      proteinVal = 1;
      carbsVal = 1;
      fatVal = 0;
      kcalVal = 15;
      itemMicros['Vitamin B3'] = 20;
      itemMicros['Vitamin B6'] = 5;
      itemMicros['Vitamin B12'] = 10;
    } else if (item.category === 'Joints & Health') {
      proteinVal = 3; // Collagen peptide protein
      carbsVal = 0;
      fatVal = 0.5;
      kcalVal = 25;
      itemMicros['Vitamin C'] = 100;
      itemMicros['Zinc'] = 15;
    }

    // Check specific micronutrient mappings
    const idOrName = (item.id + ' ' + item.name + ' ' + item.nameMk).toLowerCase();
    if (idOrName.includes('magnezium') || idOrName.includes('magnesium')) {
      itemMicros['Magnesium'] = (itemMicros['Magnesium'] || 0) + 400;
    }
    if (idOrName.includes('d3') || idOrName.includes('vitamin d') || idOrName.includes('витамин д')) {
      itemMicros['Vitamin D'] = (itemMicros['Vitamin D'] || 0) + 100;
    }
    if (idOrName.includes('zma') || idOrName.includes('зма')) {
      itemMicros['Zinc'] = (itemMicros['Zinc'] || 0) + 25;
      itemMicros['Magnesium'] = (itemMicros['Magnesium'] || 0) + 350;
      itemMicros['Vitamin B6'] = (itemMicros['Vitamin B6'] || 0) + 10;
    }
    if (idOrName.includes('c-1000') || idOrName.includes('vitamin c') || idOrName.includes('витамин ц')) {
      itemMicros['Vitamin C'] = (itemMicros['Vitamin C'] || 0) + 1000;
    }
    if (idOrName.includes('zinc') || idOrName.includes('цинк')) {
      itemMicros['Zinc'] = (itemMicros['Zinc'] || 0) + 25;
    }
    if (idOrName.includes('calcium') || idOrName.includes('калциум')) {
      itemMicros['Calcium'] = (itemMicros['Calcium'] || 0) + 800;
    }
    if (idOrName.includes('animal-pak')) {
      itemMicros['Vitamin C'] = (itemMicros['Vitamin C'] || 0) + 1000;
      itemMicros['Zinc'] = (itemMicros['Zinc'] || 0) + 25;
      itemMicros['Vitamin D'] = (itemMicros['Vitamin D'] || 0) + 50;
      itemMicros['Magnesium'] = (itemMicros['Magnesium'] || 0) + 400;
      itemMicros['Vitamin B12'] = (itemMicros['Vitamin B12'] || 0) + 50;
      itemMicros['Vitamin B6'] = (itemMicros['Vitamin B6'] || 0) + 10;
      itemMicros['Calcium'] = (itemMicros['Calcium'] || 0) + 1000;
    }

    // Update micros on day
    const updatedMicros = { ...day.micros };
    for (const [k, v] of Object.entries(itemMicros)) {
      if (v > 0) {
        updatedMicros[k] = Math.round(((updatedMicros[k] || 0) + v) * 10) / 10;
      }
    }

    const cleanName = `${item.brand} ${item.nameMk.split('(')[0].trim()}`;
    const newFoodItem: Food = {
      id: crypto.randomUUID(),
      name: cleanName,
      meal: 'Supplements',
      grams: 30,
      servingGrams: 30,
      perServing: true,
      isSupplement: true,
      kcal: kcalVal,
      protein: proteinVal, // Exact grams per serving!
      carbs: carbsVal,
      fat: fatVal,
      fiber: 0,
      sugar: 0.5,
      sodium: 120,
      micros: itemMicros,
    };

    await update({
      foods: [...day.foods, newFoodItem],
      micros: updatedMicros,
    });

    const summaryParts: string[] = [];
    if (proteinVal > 0) summaryParts.push(`+${proteinVal}g protein`);
    if (kcalVal > 0) summaryParts.push(`+${kcalVal} kcal`);
    const summaryText = summaryParts.length > 0 ? summaryParts.join(' · ') + ' ' : '';
    showNotice(`💊 Logged ${item.name}! Combined ${summaryText}directly into today's nutrition.`);
  }

  function shift(n: number) {
    const d = parse(selected);
    d.setDate(d.getDate() + n);
    setSelected(dateKey(d));
  }

  function open(type: string) {
    setSearch('');
    setFoodCategory('All');
    const defaultFood = VERIFIED_FOOD_CATALOG[0];
    setDraft(
      type === 'Profile'
        ? { ...profile }
        : type === 'Food'
          ? {
              foodId: defaultFood.id,
              name: defaultFood.name,
              meal: 'Breakfast',
              grams: 100,
              kcal: defaultFood.kcal,
              protein: defaultFood.protein,
              carbs: defaultFood.carbs,
              fat: defaultFood.fat,
              fiber: defaultFood.fiber,
              sugar: defaultFood.sugar,
              sodium: defaultFood.sodium,
            }
          : type === 'Workout'
            ? { name: '', sets: 3, reps: 10, weight: '' }
            : type === 'Supplement'
              ? {
                  mode: 'catalog',
                  supplementId: 'on-gold-standard-whey',
                  name: 'Optimum Nutrition Gold Standard 100% Whey',
                  brand: 'Optimum Nutrition',
                  category: 'Proteins',
                  servingGrams: 30,
                  servings: 1,
                  protein: 24, // e.g. 24g or 30g customizable
                  kcal: 130,
                  carbs: 2,
                  fat: 1.5,
                  sugar: 1,
                  sodium: 120,
                  meal: 'Supplements',
                  micros: { Calcium: 140, Potassium: 160 },
                }
            : type === 'Micronutrients'
              ? { ...day.micros }
              : {
                  amount: day.water > 0 ? day.water : '',
                  glasses: day.water > 0 ? Math.round(day.water / 250) : '',
                }
    );
    setModal(type);
  }

  function start() {
    started.current = performance.now();
    setRunning(true);
  }
  function pause() {
    base.current = elapsed;
    setRunning(false);
  }
  function stop() {
    pause();
  }
  function reset() {
    setRunning(false);
    base.current = 0;
    setElapsed(0);
    setLaps([]);
  }

  // Scientifically calculated micronutrient targets dynamically linked to user bodyweight (kg)
  const microTargets = getBodyweightMicroTargets(profile);

  const progress = (v: number, g: number) => (g > 0 ? Math.min(100, (v / g) * 100) : 0);

  const header = (title: string, subtitle: string, button?: string, action?: () => void) => (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {button && (
        <button className="text-button" onClick={action}>
          <Plus size={16} />
          {button}
        </button>
      )}
    </div>
  );

  const currentGlasses = Math.round(day.water / 250);
  const accurateHydration = calculateAccurateHydration(
    profile.weight,
    profile.sex,
    day.workouts.length
  );
  const targetGlasses = Math.max(1, Math.round(profile.water / 250));
  const maxGlassesToDisplay = Math.max(8, Math.max(targetGlasses, currentGlasses + 2));

  const mealPanel = (
    <section className="panel meals">
      <div className="section-head">
        <div>
          <h2>Food &amp; supplement journal</h2>
          <p>Every meal and supplement combined into your daily targets.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="text-button"
            onClick={() => open('Supplement')}
            style={{ color: '#ff9a5e', borderColor: '#5c3920', background: '#251c14' }}
            title="Log protein powders, vitamins, creatine or supplements"
          >
            <Pill size={15} />
            Log supplement
          </button>
          <button className="text-button" onClick={() => open('Food')}>
            <Plus size={16} />
            Log food
          </button>
        </div>
      </div>
      <div className="table-head">
        <span>MEAL / FOOD / SUPPLEMENT</span>
        <span>CALORIES</span>
        <span>PROTEIN</span>
        <span />
      </div>
      {[
        'Breakfast',
        'Lunch',
        'Dinner',
        'Snacks',
        ...(day.foods.some((f) => f.meal === 'Supplements' || f.isSupplement) ? ['Supplements'] : []),
      ].map((meal) => (
        <div className="meal-group" key={meal}>
          <div className="meal-label">
            <span className="meal-icon">
              {meal === 'Supplements' ? <Pill size={17} /> : <Utensils size={17} />}
            </span>
            <strong>{meal}</strong>
            <span className="muted">{day.foods.filter((f) => f.meal === meal).length} items</span>
            <button
              aria-label={'Add ' + meal}
              onClick={() => {
                if (meal === 'Supplements') {
                  open('Supplement');
                } else {
                  open('Food');
                  setDraft((d) => ({ ...d, meal }));
                }
              }}
            >
              <Plus size={17} />
            </button>
          </div>
          {day.foods
            .filter((f) => f.meal === meal)
            .map((f) => {
              const servingKcal = Math.round(calculateFoodNutrient(f, 'kcal'));
              const servingProtein = round(calculateFoodNutrient(f, 'protein'));
              const servingCarbs = round(calculateFoodNutrient(f, 'carbs'));
              const servingFat = round(calculateFoodNutrient(f, 'fat'));
              const isSupp = Boolean(f.isSupplement || f.perServing || f.meal === 'Supplements');
              const stepGrams = isSupp ? (f.servingGrams || 30) : 50;

              return (
                <div className="food-row" key={f.id}>
                  <span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 500, color: '#eef2e7' }}>{f.name}</span>
                      {isSupp && (
                        <span
                          style={{
                            fontSize: '10px',
                            background: '#39281a',
                            border: '1px solid #6b4324',
                            color: '#ffa359',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                          }}
                        >
                          💊 SUPP
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#ff9a5e', fontWeight: 600 }}>
                        {f.grams} g {isSupp && f.grams === 30 ? '(1 scoop/dose)' : ''}
                      </span>
                      <span style={{ fontSize: '11px', color: '#889182' }}>
                        · {servingCarbs}g C · {servingFat}g F
                      </span>
                      <span style={{ display: 'inline-flex', gap: '3px', marginLeft: '3px' }}>
                        <button
                          type="button"
                          disabled={saving || f.grams <= stepGrams}
                          onClick={() => {
                            const newGrams = Math.max(stepGrams, f.grams - stepGrams);
                            update({
                              foods: day.foods.map((x) =>
                                x.id === f.id ? { ...x, grams: newGrams } : x
                              ),
                            });
                          }}
                          title={`Decrease ${stepGrams}g portion`}
                          style={{
                            padding: '1px 5px',
                            fontSize: '10px',
                            background: '#232620',
                            border: '1px solid #373e2e',
                            borderRadius: '4px',
                            color: '#a0a897',
                          }}
                        >
                          -{stepGrams}g
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            const newGrams = f.grams + stepGrams;
                            update({
                              foods: day.foods.map((x) =>
                                x.id === f.id ? { ...x, grams: newGrams } : x
                              ),
                            });
                          }}
                          title={`Increase ${stepGrams}g portion`}
                          style={{
                            padding: '1px 5px',
                            fontSize: '10px',
                            background: '#232620',
                            border: '1px solid #373e2e',
                            borderRadius: '4px',
                            color: '#a0a897',
                          }}
                        >
                          +{stepGrams}g
                        </button>
                      </span>
                    </div>
                  </span>
                  <span>
                    {servingKcal} <small>kcal</small>
                  </span>
                  <span>
                    {servingProtein} <small>g</small>
                  </span>
                  <button
                    disabled={saving}
                    onClick={() => update({ foods: day.foods.filter((x) => x.id !== f.id) })}
                    aria-label={'Delete ' + f.name}
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          {!day.foods.some((f) => f.meal === meal) && (
            <button
              className="empty-meal"
              onClick={() => {
                open('Food');
                setDraft((d) => ({ ...d, meal }));
              }}
            >
              Add your {meal.toLowerCase()} <Plus size={14} />
            </button>
          )}
        </div>
      ))}
      <div className="meal-footer">
        <span>
          Fiber <b>{round(total.fiber)} g</b>
        </span>
        <span>
          Sugar <b>{round(total.sugar)} g</b>
        </span>
        <span>
          Sodium <b>{Math.round(total.sodium)} mg</b>
        </span>
      </div>
    </section>
  );

  const waterPanel = (
    <section className="panel hydration">
      {header('Hydration', 'Every glass and sip counts.')}
      <div className="water-main">
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="big-number">{currentGlasses}</span>
            <span className="unit" style={{ fontSize: '18px', fontWeight: 600, color: '#8bb9bc' }}>
              / {targetGlasses} glasses
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#97a6a7', marginTop: '2px' }}>
            {round(day.water / 1000)} L / {round(profile.water / 1000)} L logged ({day.water} ml)
          </div>
          <p>
            {day.water >= profile.water
              ? 'Daily drink goal reached! Keep it up.'
              : `${Math.max(0, targetGlasses - currentGlasses)} glasses (${Math.max(0, profile.water - day.water)} ml) to your drink goal`}
          </p>

          <div
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#192527',
              border: '1px solid #2a4144',
              fontSize: '12px',
              color: '#9ad0d4',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <span>
                ⚖️ <b>Bodyweight-linked target:</b> {accurateHydration.baselineMl} ml ({accurateHydration.baselineGlasses} glasses)
                {accurateHydration.workoutBufferMl > 0 ? ` + ${accurateHydration.workoutBufferMl} ml exercise sweat replacement` : ''}
              </span>
              {profile.water !== accurateHydration.totalTargetMl && (
                <button
                  type="button"
                  disabled={!ready || saving}
                  onClick={() => save('profile', { ...profile, water: accurateHydration.totalTargetMl })}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    background: '#234449',
                    border: '1px solid #3d6a71',
                    color: '#c2f1f4',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                  title="Update your profile hydration target to match your current bodyweight"
                >
                  Sync to {accurateHydration.totalTargetMl} ml
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="water-icon">
          <Droplets size={34} />
        </div>
      </div>

      {/* Interactive Glasses Row */}
      <div style={{ margin: '18px 0 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', letterSpacing: '0.8px', color: '#8bb9bc', fontWeight: 600 }}>
            TAP A GLASS TO LOG INTAKE
          </span>
          <span style={{ fontSize: '11px', color: '#748b8d' }}>1 glass ≈ 250 ml (8 oz)</span>
        </div>
        <div className="glasses-row">
          {Array.from({ length: maxGlassesToDisplay }, (_, i) => {
            const glassNumber = i + 1;
            const isFilled = glassNumber <= currentGlasses;
            return (
              <button
                type="button"
                key={glassNumber}
                disabled={!ready || saving}
                onClick={() => update({ water: glassNumber * 250 })}
                className={'glass-btn ' + (isFilled ? 'filled' : '')}
                title={`Log ${glassNumber} glasses (${glassNumber * 250} ml)`}
              >
                <Droplets size={18} fill={isFilled ? 'currentColor' : 'none'} />
                <span className="glass-number">{glassNumber}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="water-bars">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={progress(day.water, profile.water) > (i / 12) * 100 ? 'filled' : ''}
          />
        ))}
      </div>
      <div className="water-buttons">
        <button
          disabled={!ready || saving || day.water <= 0}
          onClick={() => update({ water: Math.max(0, day.water - 250) })}
          style={{ flex: 1 }}
        >
          <Minus size={15} /> -1 Glass
        </button>
        <button
          disabled={!ready || saving}
          onClick={() => update({ water: day.water + 250 })}
          style={{ flex: 1 }}
        >
          <Plus size={15} /> +1 Glass (250 ml)
        </button>
        <button
          disabled={!ready || saving}
          onClick={() => update({ water: day.water + 500 })}
          style={{ flex: 1 }}
        >
          <Plus size={15} /> +2 Glasses (500 ml)
        </button>
        <button onClick={() => open('Water')} style={{ flex: 0.8 }}>
          Edit
        </button>
      </div>
      <p className="fine">Tracks logged drinks and glasses. 1 standard glass = 250 ml (approx 8.5 fl oz).</p>
    </section>
  );

  const timerPanel = (
    <section className="panel timer-panel">
      {header('Session stopwatch', 'Find your rhythm.')}
      <div className="segmented">
        <button className={!analog ? 'active' : ''} onClick={() => setAnalog(false)}>
          Digital
        </button>
        <button className={analog ? 'active' : ''} onClick={() => setAnalog(true)}>
          Analog
        </button>
      </div>
      {analog ? (
        <div className="clock">
          <svg viewBox="0 0 200 200" role="img" aria-label={`Elapsed ${fmt(elapsed)}`}>
            <circle cx="100" cy="100" r="91" fill="none" stroke="#3c3d3d" strokeWidth="2" />
            {Array.from({ length: 60 }, (_, i) => (
              <line
                key={i}
                x1="100"
                y1="14"
                x2="100"
                y2={i % 5 === 0 ? 25 : 19}
                stroke={i % 5 === 0 ? '#bbb' : '#555'}
                transform={`rotate(${i * 6} 100 100)`}
              />
            ))}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="47"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              transform={`rotate(${(elapsed / 60000) * 6} 100 100)`}
            />
            <line
              x1="100"
              y1="115"
              x2="100"
              y2="28"
              stroke="#ff792f"
              strokeWidth="2"
              transform={`rotate(${(elapsed / 1000) * 6} 100 100)`}
            />
            <circle cx="100" cy="100" r="5" fill="#ff792f" />
          </svg>
          <small>{fmt(elapsed)}</small>
        </div>
      ) : (
        <div className="time-display">
          {fmt(elapsed)}
          <small>.{String(Math.floor(elapsed / 10) % 100).padStart(2, '0')}</small>
        </div>
      )}
      <div className="timer-actions">
        <button className="primary" onClick={running ? pause : start}>
          {running ? <Pause size={16} /> : <Play size={16} />}{' '}
          {running ? 'Pause' : elapsed ? 'Resume' : 'Start'}
        </button>
        <button disabled={!running} onClick={() => setLaps((l) => [...l, elapsed])}>
          <Flag size={16} /> Lap
        </button>
        <button disabled={!running} onClick={stop}>
          Stop
        </button>
        <button aria-label="Reset stopwatch" onClick={reset}>
          <RotateCcw size={17} />
        </button>
      </div>
      {laps.length > 0 && (
        <div className="laps">
          {laps
            .map((l, i) => (
              <div key={i}>
                <span>Lap {String(i + 1).padStart(2, '0')}</span>
                <span>+{fmt(l - (laps[i - 1] || 0))}</span>
                <b>{fmt(l)}</b>
              </div>
            ))
            .reverse()}
        </div>
      )}
    </section>
  );

  const workoutPanel = (
    <section className="panel workouts">
      {header('Training log', 'Show up. Put in the work.', 'Add exercise', () => open('Workout'))}

      {/* Quick Add Exercise Autocomplete Bar (shows matching exercises as you type letters) */}
      <div
        style={{
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #1f231b, #181b15)',
          border: '1px solid #3d4a34',
          borderRadius: '12px',
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#f3f6ee', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Dumbbell size={15} color="#ff792f" /> Quick Exercise Search (Type letters to see movements)
          </span>
          <span style={{ fontSize: '11px', color: '#97a28e' }}>
            Type letters to find exercises (e.g. bench, rdl, squat, curl, pull, ohp…)
          </span>
        </div>
        <ExerciseAutocomplete
          value={quickExerciseQuery}
          userHistoryExercises={userHistoryExercises}
          placeholder="Type letters to search exercises, e.g. Bench, Squat, Curl, Deadlift, RDL, OHP…"
          onChange={(name, defaultSets, defaultReps) => {
            setSelectedMuscleExercise(name);
            const activated = getMusclesForExercise(name);
            setSelectedActiveMuscles(activated.length > 0 ? activated : ['Chest']);
            open('Workout');
            setDraft({
              name,
              sets: defaultSets || 3,
              reps: defaultReps || 10,
              weight: '',
            });
            setQuickExerciseQuery('');
          }}
        />
      </div>

      {day.workouts.length === 0 ? (
        <div className="empty-workout">
          <div className="outlined-icon">
            <Dumbbell size={26} />
          </div>
          <h3>A fresh start for your next session</h3>
          <p>Log your exercises, sets, reps and weights.</p>
          <button onClick={() => open('Workout')}>
            <Plus size={16} /> Add first exercise
          </button>
        </div>
      ) : (
        day.workouts.map((w) => (
          <div
            className={'workout-row ' + (w.done ? 'completed' : '')}
            key={w.id}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedMuscleExercise(w.name);
              const m = getMusclesForExercise(w.name);
              setSelectedActiveMuscles(m.length > 0 ? m : ['Chest']);
            }}
          >
            <button
              className="check-button"
              disabled={saving}
              aria-label="Toggle exercise completion"
              onClick={(e) => {
                e.stopPropagation();
                update({
                  workouts: day.workouts.map((x) => (x.id === w.id ? { ...x, done: !x.done } : x)),
                });
              }}
            >
              {w.done ? <Check size={16} /> : <span />}
            </button>
            <div style={{ flex: 1 }}>
              <strong>{w.name}</strong>
              <small>
                {w.sets} sets × {w.reps} reps · {w.weight} kg
              </small>
            </div>
            <button
              aria-label="Delete exercise"
              disabled={saving}
              onClick={(e) => {
                e.stopPropagation();
                update({ workouts: day.workouts.filter((x) => x.id !== w.id) });
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))
      )}
      <div className="workout-footer">
        <span>
          <Activity size={15} /> {day.workouts.filter((w) => w.done).length}/{day.workouts.length}{' '}
          completed
        </span>
        <span>
          {day.workouts
            .filter((w) => w.done)
            .reduce((a, w) => a + w.sets * w.reps * w.weight, 0)
            .toLocaleString()}{' '}
          kg volume
        </span>
      </div>
    </section>
  );

  const microDangerSummary = (() => {
    let dangerCount = 0;
    let approachingCount = 0;
    const criticalAlerts: Array<{
      name: string;
      current: number;
      upperLimit: number;
      unit: string;
      percentage: number;
      toxicityRisks: string;
      organTarget: string;
      formulaLabel: string;
      status: 'approaching' | 'danger';
    }> = [];

    microTargets.forEach((m) => {
      const fromFood = foodMicros[m.name] || 0;
      const fromSupplements = day.micros[m.name] || 0;
      const total = Math.round((fromFood + fromSupplements) * 100) / 100;
      const assess = assessMicroDanger(m.name, total, {
        weight: profile.weight,
        sex: profile.sex || 'male',
        age: profile.age || 25,
      });

      if (assess.status === 'danger') {
        dangerCount++;
        criticalAlerts.push({
          name: m.name,
          current: total,
          upperLimit: assess.upperLimit,
          unit: m.unit,
          percentage: assess.percentageOfUpperLimit,
          toxicityRisks: assess.toxicityRisks,
          organTarget: assess.organTarget,
          formulaLabel: assess.formulaLabel,
          status: 'danger',
        });
      } else if (assess.status === 'approaching') {
        approachingCount++;
        criticalAlerts.push({
          name: m.name,
          current: total,
          upperLimit: assess.upperLimit,
          unit: m.unit,
          percentage: assess.percentageOfUpperLimit,
          toxicityRisks: assess.toxicityRisks,
          organTarget: assess.organTarget,
          formulaLabel: assess.formulaLabel,
          status: 'approaching',
        });
      }
    });

    return { dangerCount, approachingCount, criticalAlerts };
  })();

  const filteredMicroTargets =
    microFilter === 'Danger Zones'
      ? microTargets.filter((m) => {
          const fromFood = foodMicros[m.name] || 0;
          const fromSupplements = day.micros[m.name] || 0;
          const total = Math.round((fromFood + fromSupplements) * 100) / 100;
          const assess = assessMicroDanger(m.name, total, {
            weight: profile.weight,
            sex: profile.sex || 'male',
            age: profile.age || 25,
          });
          return assess.status !== 'optimal';
        })
      : microFilter === 'All'
        ? microTargets
        : microTargets.filter((m) => m.category === microFilter);

  const microCategories: { label: string; value: 'All' | MicroCategory | 'Danger Zones'; count: number }[] = [
    { label: 'All', value: 'All', count: microTargets.length },
    { label: 'Vitamins', value: 'Vitamins', count: microTargets.filter((m) => m.category === 'Vitamins').length },
    { label: 'B-Complex', value: 'B-Complex', count: microTargets.filter((m) => m.category === 'B-Complex').length },
    {
      label: 'Minerals & Electrolytes',
      value: 'Minerals & Electrolytes',
      count: microTargets.filter((m) => m.category === 'Minerals & Electrolytes').length,
    },
    {
      label: 'Trace Elements',
      value: 'Trace Elements',
      count: microTargets.filter((m) => m.category === 'Trace Elements').length,
    },
    {
      label: `🚨 Danger Zones (${microDangerSummary.dangerCount + microDangerSummary.approachingCount})`,
      value: 'Danger Zones',
      count: microDangerSummary.dangerCount + microDangerSummary.approachingCount,
    },
  ];

  const microPanel = (
    <section className="panel micros">
      {header(
        'The small things matter',
        'Vitamins & minerals (Linked to bodyweight • Foods auto-sync + supplement logs)',
        'Log supplement',
        () => open('Micronutrients')
      )}

      {/* Bodyweight Connection & Toxicity Shield Banner */}
      <div className="weight-sync-banner">
        <div className="weight-sync-header">
          <span className="weight-sync-title">
            <Scale size={16} color="#34d399" />
            Bodyweight-Linked Micronutrient Engine: {profile.weight} kg
          </span>
          <button
            type="button"
            className="weight-edit-btn"
            onClick={() => open('Profile')}
            title="Adjust your body weight"
          >
            Edit Profile Weight ({profile.weight} kg) ↗
          </button>
        </div>
        <p className="weight-sync-desc">
          Unlike generic statistical averages (which assume a static 70 kg individual regardless of stature),
          your 24 daily micronutrient targets and <b>Tolerable Upper Intake Levels (Danger Zones)</b> scale dynamically with your actual body weight (<b>{profile.weight} kg</b>).
          Intracellular fluids, active muscle cell mass, and circulating blood volume determine true metabolic demand and toxicity thresholds.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
          <span className="auto-tag">
            <Sparkles size={12} /> Auto-credited from food catalog
          </span>
          <span style={{ fontSize: '11px', color: '#8fa098' }}>
            Logged meals automatically calculate and deposit verified vitamin and mineral amounts below.
          </span>
        </div>
      </div>

      {/* Bodyweight Toxicity & Danger Zone Safety Shield Monitor */}
      <div className={`danger-shield-box ${microDangerSummary.dangerCount > 0 ? 'has-danger' : ''}`}>
        <div className="danger-shield-header">
          <div className="danger-shield-title">
            <Shield size={16} color={microDangerSummary.dangerCount > 0 ? '#ef4444' : '#34d399'} />
            Bodyweight Danger Zone Safety Shield ({profile.weight} kg)
          </div>
          <div className="danger-metrics-row">
            <span className="danger-metric-pill safe">
              🛡️ {24 - microDangerSummary.dangerCount - microDangerSummary.approachingCount} Safe Zone
            </span>
            <span className="danger-metric-pill approaching">
              ⚠️ {microDangerSummary.approachingCount} Approaching UL
            </span>
            <span className={`danger-metric-pill ${microDangerSummary.dangerCount > 0 ? 'danger' : 'safe'}`}>
              🚨 {microDangerSummary.dangerCount} Exceeding UL
            </span>
          </div>
        </div>

        {microDangerSummary.dangerCount > 0 && (
          <div className="danger-critical-card">
            <strong>🚨 CRITICAL BODYWEIGHT TOXICITY WARNING ({profile.weight} kg limit exceeded):</strong>
            {microDangerSummary.criticalAlerts
              .filter((a) => a.status === 'danger')
              .map((alert) => (
                <div key={alert.name} style={{ marginTop: '4px' }}>
                  • <b>{alert.name}</b>: Logged {alert.current} {alert.unit} ({alert.percentage}% of tolerable limit {alert.upperLimit} {alert.unit}). Risk to {alert.organTarget}: {alert.toxicityRisks}
                </div>
              ))}
          </div>
        )}

        {microDangerSummary.approachingCount > 0 && microDangerSummary.dangerCount === 0 && (
          <div style={{ fontSize: '11px', color: '#fde047', marginTop: '6px' }}>
            ⚠️ {microDangerSummary.approachingCount} nutrient(s) are approaching their safe upper limit (≥75% of UL). Exercise caution when stacking multivitamins or fortified supplements.
          </div>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="micro-filter-row">
        {microCategories.map((c) => {
          const isDangerTab = c.value === 'Danger Zones';
          const isActive = microFilter === c.value;
          return (
            <button
              type="button"
              key={c.label}
              className={`micro-filter-btn ${isActive ? (isDangerTab ? 'danger-active' : 'active') : ''}`}
              onClick={() => setMicroFilter(c.value)}
            >
              {c.label} ({c.count})
            </button>
          );
        })}
      </div>

      {/* Micronutrient Cards Grid */}
      <div className="micro-grid">
        {filteredMicroTargets.map((m) => {
          const fromFood = foodMicros[m.name] || 0;
          const fromSupplements = day.micros[m.name] || 0;
          const totalAmount = Math.round((fromFood + fromSupplements) * 100) / 100;
          const targetReached = totalAmount >= Number(m.target);
          const pct = Math.min(100, progress(totalAmount, Number(m.target)));
          const dangerCheck = assessMicroDanger(m.name, totalAmount, {
            weight: profile.weight,
            sex: profile.sex || 'male',
            age: profile.age || 25,
          });

          const isDanger = dangerCheck.status === 'danger';
          const isApproaching = dangerCheck.status === 'approaching';

          let cardClass = 'micro';
          if (isDanger) cardClass += ' danger-card';
          else if (isApproaching) cardClass += ' approaching-card';
          else if (targetReached) cardClass += ' goal-reached';

          return (
            <div className={cardClass} key={m.name}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {m.name}
                      {targetReached && !isDanger && <Check size={13} color="#2dd4bf" />}
                      {isDanger && <AlertTriangle size={14} color="#ef4444" />}
                      {isApproaching && !isDanger && <AlertTriangle size={13} color="#f59e0b" />}
                    </strong>
                    <span className="micro-cat-pill">{m.category}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isDanger ? '#f87171' : isApproaching ? '#fbbf24' : targetReached ? '#4ade80' : '#8fa098',
                    }}
                  >
                    {isDanger
                      ? `${dangerCheck.percentageOfUpperLimit}% OF UL!`
                      : isApproaching
                        ? `${dangerCheck.percentageOfUpperLimit}% of UL`
                        : `${Math.round(pct)}%`}
                  </span>
                </div>

                <span>
                  <b>{totalAmount}</b> <small>/ {m.target} {m.unit}</small>
                  <small style={{ marginLeft: '6px', color: '#9ca3af' }}>
                    (Safe UL: {dangerCheck.upperLimit} {m.unit})
                  </small>
                </span>

                <div style={{ marginTop: '3px' }}>
                  <span className="micro-formula-tag" title={m.physiologicalRole}>
                    ⚖️ {m.formulaLabel}
                  </span>
                </div>

                {/* Danger zone status pill */}
                {isDanger ? (
                  <div className="danger-tag-pill danger">
                    🚨 DANGER ZONE ({dangerCheck.percentageOfUpperLimit}% of Upper Limit for {profile.weight}kg)
                  </div>
                ) : isApproaching ? (
                  <div className="danger-tag-pill approaching">
                    ⚠️ Approaching UL ({dangerCheck.percentageOfUpperLimit}% of max {dangerCheck.upperLimit} {m.unit})
                  </div>
                ) : (
                  <div className="danger-tag-pill optimal">
                    🛡️ Safe Zone (&lt; {dangerCheck.upperLimit} {m.unit} UL for {profile.weight}kg)
                  </div>
                )}

                {/* Toxicity explanation when approaching or in danger */}
                {isDanger && (
                  <div className="danger-risk-note danger">
                    ⚠️ <b>Risk to {dangerCheck.organTarget}:</b> {dangerCheck.toxicityRisks}
                  </div>
                )}
                {isApproaching && !isDanger && (
                  <div className="danger-risk-note approaching">
                    Monitor intake. Safe upper limit for {profile.weight}kg is {dangerCheck.upperLimit} {m.unit}.
                  </div>
                )}

                <p className="micro-role-text" style={{ marginTop: '6px' }}>
                  {m.shortDesc}
                </p>

                <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {fromFood > 0 && <span style={{ color: '#86efac' }}>🥗 {fromFood} {m.unit} food</span>}
                  {fromSupplements > 0 && <span style={{ color: '#93c5fd' }}>💊 {fromSupplements} {m.unit} supp</span>}
                  {fromFood === 0 && fromSupplements === 0 && <span>0 logged</span>}
                </div>
              </div>

              <div className="track" style={{ marginTop: '8px' }}>
                <i
                  style={{
                    width: isDanger ? '100%' : isApproaching ? `${Math.min(100, dangerCheck.percentageOfUpperLimit)}%` : `${pct}%`,
                    background: isDanger ? '#ef4444' : isApproaching ? '#f59e0b' : targetReached ? '#10b981' : '#38bdf8',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="fine">
        Daily micronutrient targets dynamically calibrated for {profile.weight} kg body weight ({profile.sex}, age {profile.age}).
        Formulas derived from EFSA, ACSM, and NIH dietary reference physiology.
        <b> Food entries automatically calculate and deposit verified vitamin and mineral contents.</b> You can also log standalone supplements or multivitamins via the button above.{' '}
        <a
          href="https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx"
          target="_blank"
          rel="noreferrer"
        >
          NIH physiological reference ↗
        </a>
      </p>
    </section>
  );

  return (
    <div className="app-shell">
      <OfflineIndicator />
      <aside className="sidebar">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setTab('Overview');
          }}
        >
          <div>
            <Flame size={24} fill="currentColor" />
          </div>
          EMBER<span>FITNESS</span>
        </a>
        <div className="nav-label">YOUR WORKSPACE</div>
        <nav>
          {(
            [
              [LayoutDashboard, 'Overview'],
              [Target, 'Plans'],
              [Utensils, 'Nutrition'],
              [Dumbbell, 'Training'],
              [Trophy, 'PRs'],
              [Pill, 'Supplements'],
              [Droplets, 'Hydration'],
              [Calculator, 'TDEE Calculator'],
              [Timer, 'Stopwatch'],
            ] as const
          ).map(([Icon, name]) => (
            <button
              key={name}
              className={tab === name ? 'selected' : ''}
              onClick={() => setTab(name)}
            >
              <Icon size={20} />
              {name}
              {tab === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <PWAInstallButton variant="sidebar" />
          {currentUser ? (
            <div
              style={{
                padding: '9px 12px',
                background: '#222820',
                border: '1px solid #3c4a35',
                borderRadius: '10px',
                margin: '8px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: '#9ec47e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 600,
                  }}
                >
                  <Cloud size={14} /> Cloud Synced
                </span>
                <button
                  type="button"
                  onClick={() => signOutUser()}
                  style={{
                    padding: '2px 7px',
                    fontSize: '10px',
                    background: 'none',
                    border: '1px solid #4a5444',
                    color: '#abb3a5',
                    borderRadius: '5px',
                  }}
                >
                  Sign out
                </button>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#889182',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentUser.displayName || currentUser.email}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              style={{
                width: '100%',
                margin: '8px 0',
                padding: '9px 12px',
                backgroundColor: '#2b231d',
                border: '1px solid #5e3921',
                color: '#ff9a5e',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
              }}
            >
              <Cloud size={14} /> Sign in to sync
            </button>
          )}
          <div className="focus-card">
            <Target size={23} />
            <strong>Progress is a practice.</strong>
            <p>
              One day. One meal.
              <br />
              One more rep.
            </p>
            <span>KEEP YOUR FIRE ALIVE</span>
          </div>
          <button className="profile-button" onClick={() => open('Profile')}>
            <span className="avatar">{profile.name.slice(0, 1).toUpperCase()}</span>
            <span>
              <b>{profile.name}</b>
              <small>Your profile & goals</small>
            </span>
            <Settings size={18} />
          </button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            My workspace <span className="slash">/</span> <b>{tab}</b>
          </span>
          <div>
            {currentUser ? (
              <span
                style={{
                  fontSize: '12px',
                  color: '#9ec47e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Cloud size={14} /> Synced
              </span>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  backgroundColor: '#2d251f',
                  border: '1px solid #5a3822',
                  color: '#ff9a5e',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Cloud size={13} /> Sync Cloud
              </button>
            )}
            <PWAInstallButton variant="topbar" />
            <span className="save-status">
              <Check size={14} />
              {status}
            </span>
            <button
              className="icon-button"
              aria-label="Profile and goals"
              onClick={() => open('Profile')}
            >
              <Settings size={19} />
            </button>
          </div>
        </header>
        <div className="content">
          <div className="page-title">
            <div>
              <div className="eyebrow">
                {tab === 'TDEE Calculator' ? 'PRECISION METABOLIC INTELLIGENCE' : 'BUILD YOUR EVERYDAY'}
              </div>
              <h1>
                {tab === 'Overview'
                  ? 'Your fitness, in focus.'
                  : tab === 'Plans'
                    ? 'Target Nutrition & Goal Calibration.'
                    : tab === 'Nutrition'
                      ? 'Fuel your potential.'
                      : tab === 'Training'
                        ? 'Make every rep count.'
                        : tab === 'PRs'
                          ? 'Personal Records & Strength Standards.'
                          : tab === 'Supplements'
                            ? 'Supplements in Macedonia.'
                            : tab === 'Hydration'
                              ? 'Keep your flow.'
                              : tab === 'TDEE Calculator'
                                ? 'TrainForge Energy Engine.'
                                : 'Your time. Your pace.'}
              </h1>
              <p suppressHydrationWarning>
                {tab === 'Plans'
                  ? 'Maintain, Cut, Bulk, Aggressive Cut or Aggressive Bulk — optimized precisely to your body weight.'
                  : tab === 'PRs'
                    ? 'Compare your lifts against Beginner, Normal, Advanced, Expert and Pro levels fair to your body weight.'
                    : tab === 'TDEE Calculator'
                      ? 'Advanced Mifflin-St Jeor, Katch-McArdle, Harris-Benedict & Cunningham calculators.'
                      : tab === 'Supplements'
                        ? 'Verified sports nutrition catalog with Opti-Men/Women, No Limit MK, HardCore Shop, Polleo & Zegin.'
                        : `${formatLongDate(parse(selected))} · A little better, every day.`}
              </p>
            </div>
            <button
              className="primary"
              disabled={!ready}
              onClick={() =>
                tab === 'Training'
                  ? open('Workout')
                  : tab === 'PRs'
                    ? open('Workout')
                    : tab === 'Hydration'
                      ? open('Water')
                      : tab === 'TDEE Calculator' || tab === 'Plans'
                        ? open('Profile')
                        : tab === 'Supplements'
                          ? open('Supplement')
                          : open('Food')
              }
            >
              <Plus size={18} />
              {tab === 'Training'
                ? 'Log workout'
                : tab === 'PRs'
                  ? 'New Lift'
                  : tab === 'Hydration'
                    ? 'Log water'
                    : tab === 'TDEE Calculator' || tab === 'Plans'
                      ? 'Custom profile'
                      : tab === 'Supplements'
                        ? 'Log supplement'
                        : 'Log food'}
            </button>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}{' '}
              {!ready && <button onClick={load}>Retry connection</button>}
            </div>
          )}
          <section className="calendar">
            <div className="calendar-top">
              <div>
                <CalendarDays size={19} />
                <strong suppressHydrationWarning>{formatMonthYear(monday)}</strong>
                <span className="week-tag">WEEK VIEW</span>
              </div>
              <div>
                <button aria-label="Previous week" onClick={() => shift(-7)}>
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => {
                    setSelected(dateKey(new Date()));
                  }}
                >
                  Today
                </button>
                <input
                  aria-label="Choose calendar date"
                  type="date"
                  value={selected}
                  onChange={(e) => e.target.value && setSelected(e.target.value)}
                />
                <button aria-label="Next week" onClick={() => shift(7)}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="week">
              {days.map((d) => {
                const key = dateKey(d);
                const rawRecord = records[key];
                const dayData =
                  rawRecord && typeof rawRecord === 'object' && 'foods' in rawRecord
                    ? (rawRecord as Day)
                    : undefined;
                const isSelectedDay = key === selected;
                const isTodayDay = key === todayKey;

                return (
                  <button
                    key={key}
                    suppressHydrationWarning
                    className={(isSelectedDay ? 'active ' : '') + (isTodayDay ? 'today' : '')}
                    onClick={() => setSelected(key)}
                  >
                    <span suppressHydrationWarning>{formatDayShort(d)}</span>
                    <b>{d.getDate()}</b>
                    <small suppressHydrationWarning>
                      {dayData &&
                      (dayData.foods.length || dayData.workouts.length || dayData.water)
                        ? 'Logged'
                        : isTodayDay
                          ? 'Today'
                          : '—'}
                    </small>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Dedicated Supplement Stash & Favorites Window Under Calendar */}
          {tab === 'Supplements' && (
            <section className="supplement-favorites-window">
              <div className="stash-window-head">
                <div className="stash-head-left">
                  <div className="stash-icon-badge">
                    <Star size={20} fill="#fbbf24" />
                  </div>
                  <div>
                    <h2 className="stash-title">
                      ⭐ Твој Кабинет за Суплементи (Омилени во Твојот Стек)
                      <span className="stash-count-pill">{favoriteItems.length} омилени</span>
                    </h2>
                    <p className="stash-desc">
                      Суплементи што веќе ги имаш дома и ги користиш во Македонија. Евидентирај 1 доза со 1 клик за денешниот ден ({selected}).
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={stashSearch}
                    onChange={(e) => setStashSearch(e.target.value)}
                    placeholder="🔍 Пребарај во омилените..."
                    style={{
                      background: '#191c16',
                      border: '1px solid #363e30',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      color: '#e5e7eb',
                      width: '220px',
                    }}
                  />
                </div>
              </div>

              {filteredStashItems.length > 0 ? (
                <div className="stash-grid">
                  {filteredStashItems.map((item) => {
                    const isLoggedToday = (day.foods || []).some(
                      (f) =>
                        Boolean(f) &&
                        ((f.name && f.name.toLowerCase().includes(item.name.toLowerCase())) ||
                          (f.name && f.name.toLowerCase().includes(item.nameMk.toLowerCase())) ||
                          (item.proteinGramsPerServing &&
                            Number(f.protein) === item.proteinGramsPerServing &&
                            f.meal === 'Supplements'))
                    );
                    const loggedCount = (day.foods || []).filter(
                      (f) =>
                        Boolean(f) &&
                        ((f.name && f.name.toLowerCase().includes(item.name.toLowerCase())) ||
                          (f.name && f.name.toLowerCase().includes(item.nameMk.toLowerCase())))
                    ).length;

                    return (
                      <div
                        key={item.id}
                        className={`stash-card ${isLoggedToday ? 'logged-today' : ''}`}
                      >
                        <div className="stash-card-top">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="stash-brand-row">
                              <span className="stash-brand-tag">{item.brand}</span>
                              <span className="stash-retailer-tag">{item.retailers[0]}</span>
                            </div>
                            <h4 className="stash-item-name">{item.nameMk}</h4>
                            <div className="stash-dose-row">
                              🥄 <b>Дозирање:</b> {item.dosage}
                            </div>
                            <div className="stash-price-tag">{item.priceMkd.toLocaleString()} МКД</div>
                          </div>
                          <button
                            type="button"
                            className="stash-fav-toggle-btn"
                            onClick={() => handleToggleFavorite(item.id)}
                            title="Отстрани од омилени"
                          >
                            <Star size={18} fill="#fbbf24" />
                          </button>
                        </div>

                        <div className="stash-actions-row">
                          <div>
                            {isLoggedToday ? (
                              <span className="stash-logged-indicator">
                                <Check size={14} /> Земено денес ({loggedCount}x)
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                Сеуште не е земено денес
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className={`stash-quick-log-btn ${justLoggedId === item.id ? 'logged-success' : ''}`}
                            onClick={async () => {
                              setJustLoggedId(item.id);
                              await handleLogSupplementFromDirectory(item);
                              showNotice(`✅ Евидентирано: 1 доза ${item.nameMk}!`);
                              setTimeout(() => setJustLoggedId(null), 2500);
                            }}
                          >
                            {justLoggedId === item.id ? (
                              <>
                                <Check size={14} /> Евидентирано!
                              </>
                            ) : (
                              <>
                                <Plus size={14} /> ⚡ Земи 1 доза денес
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="stash-empty-box">
                  <p className="stash-empty-p">
                    {stashSearch
                      ? `Нема омилен суплемент со назив "${stashSearch}".`
                      : 'Немаш омилени суплементи во твојот стек. Кликни ја ѕвездичката (⭐) на било кој суплемент во каталогот подолу или додај ги најпопуларните македонски суплементи за брз пристап:'}
                  </p>
                  <div className="stash-quick-add-pills">
                    {MACEDONIAN_SUPPLEMENTS.slice(0, 6).map((quick) => (
                      <button
                        key={quick.id}
                        type="button"
                        className="stash-quick-add-btn"
                        onClick={() => handleToggleFavorite(quick.id)}
                      >
                        <Star size={12} fill="#fbbf24" /> + Додај {quick.brand} {quick.nameMk.split('(')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Morning Fasted Weigh-In Protocol & Reminder */}
          {(tab === 'Overview' || tab === 'Nutrition' || tab === 'TDEE Calculator') && (
            <section
              style={{
                marginBottom: '18px',
                borderRadius: '12px',
                padding: '16px 20px',
                background: hasWeighedInToday
                  ? 'linear-gradient(135deg, #1c271e, #1a221b)'
                  : 'linear-gradient(135deg, #2b2216, #1f1d18)',
                border: hasWeighedInToday ? '1px solid #365036' : '1px solid #5a3d24',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: hasWeighedInToday ? '#284628' : '#4d301b',
                        color: hasWeighedInToday ? '#86efac' : '#ffb27a',
                      }}
                    >
                      {hasWeighedInToday ? <CheckCircle2 size={16} /> : <Sun size={16} />}
                    </span>
                    <strong style={{ fontSize: '15px', color: hasWeighedInToday ? '#e6f7e8' : '#fceddd' }}>
                      {hasWeighedInToday
                        ? `Morning Weigh-In Completed (${todayRecord.morningWeight} kg)`
                        : '🌅 Morning Weigh-In Protocol (Post-Sleep Calibration)'}
                    </strong>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        background: hasWeighedInToday ? '#243a25' : '#3e291b',
                        color: hasWeighedInToday ? '#a3e8b0' : '#ffa566',
                        letterSpacing: '0.6px',
                      }}
                    >
                      {hasWeighedInToday ? 'CALIBRATED' : 'SPORTS SCIENCE GOLD STANDARD'}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#b5bcae', lineHeight: '1.5', maxWidth: '780px' }}>
                    {hasWeighedInToday
                      ? `Your fasted baseline of ${todayRecord.morningWeight} kg is logged for today and automatically synced into the 21-Day Adaptive TDEE Engine. Daily calories from your food journal are also auto-loaded to calculate your true metabolic burn rate.`
                      : 'For highest accuracy: measure your weight immediately after waking up, post-urination, and before consuming food or fluids. 7–8 hours of sleep stabilizes fluid balance and clears digestive variance (even one glass of water adds 0.5 kg of noise). Logging daily morning weight gives the 21-Day TDEE Calculator true metabolic precision.'}
                  </p>

                  {morningWeighInSaved && (
                    <div style={{ fontSize: '12px', color: '#86efac', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={14} /> Morning weight successfully recorded and synced into 21-Day TDEE!
                    </div>
                  )}
                </div>

                {/* Quick Log Form or Completed Locked State */}
                {hasWeighedInToday ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: '#19281a',
                      border: '1px solid #2e5932',
                      padding: '10px 16px',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={20} color="#86efac" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#e6f7e8' }}>
                          Внесот на утринска тежина за денес е заклучен ({todayRecord.morningWeight} kg)
                        </div>
                        <div style={{ fontSize: '11px', color: '#97c79e' }}>
                          🔒 Согласно научниот протокол, дневната тежина се мери само еднаш наутро на празен стомак. Внесот за денес е завршен и заштитен од понатамошни промени.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Scale size={16} color="#ff985d" />
                      <input
                        type="number"
                        step="0.1"
                        min="30"
                        max="300"
                        placeholder={String(profile.weight || 80)}
                        value={morningWeightInput}
                        onChange={(e) => setMorningWeightInput(e.target.value)}
                        style={{
                          width: '88px',
                          padding: '7px 10px',
                          background: '#151713',
                          border: '1px solid #3c4434',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      />
                      <span style={{ fontSize: '12px', color: '#9fa894' }}>kg</span>
                    </div>

                    <button
                      type="button"
                      className="primary"
                      disabled={!ready || saving || (!morningWeightInput && !profile.weight)}
                      onClick={() => {
                        const num = parseFloat(morningWeightInput) || profile.weight;
                        if (num > 0) {
                          handleLogMorningWeight(num);
                          setMorningWeightInput('');
                        }
                      }}
                      style={{ fontSize: '12px', padding: '7px 14px' }}
                    >
                      Евидентирај Утринска Тежина
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {(tab === 'Overview' || tab === 'Nutrition') && (
            <div className="stats">
              <section className="stat calorie-stat">
                <div>
                  <span className="stat-label">
                    <Flame size={17} /> CALORIES
                  </span>
                  <div className="stat-number">
                    {Math.round(total.kcal).toLocaleString()}
                    <small>kcal</small>
                  </div>
                  <p>of {profile.calories.toLocaleString()} kcal goal</p>
                </div>
                <div
                  className="ring"
                  style={{
                    background: `conic-gradient(#ff7b35 ${progress(total.kcal, profile.calories)}%, #49372e 0)`,
                  }}
                >
                  <div>
                    <b>{Math.round(progress(total.kcal, profile.calories))}%</b>
                    <small>of goal</small>
                  </div>
                </div>
              </section>
              {[
                ['protein', 'Protein', profile.protein],
                ['carbs', 'Carbs', profile.carbs],
                ['fat', 'Fat', profile.fat],
              ].map(([key, label, goal]) => {
                const suppProtein =
                  key === 'protein'
                    ? round(
                        (day.foods || [])
                          .filter((f) => Boolean(f) && isSupplementFood(f))
                          .reduce((acc, f) => acc + calculateFoodNutrient(f, 'protein'), 0)
                      )
                    : 0;

                return (
                  <section className={'stat ' + key} key={String(key)}>
                    <span className="stat-label">
                      <span className="macro-dot" />
                      {String(label).toUpperCase()}
                    </span>
                    <div className="stat-number">
                      {round(total[String(key)])}
                      <small>/ {Number(goal)} g</small>
                    </div>
                    <div className="track">
                      <i style={{ width: progress(total[String(key)], Number(goal)) + '%' }} />
                    </div>
                    <p>{round(Math.max(0, Number(goal) - total[String(key)]))} g remaining</p>
                    {key === 'carbs' && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#fef08a',
                          marginTop: '4px',
                          fontWeight: 600,
                          background: '#713f1235',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          border: '1px solid #854d0e50',
                        }}
                      >
                        🍬 Од нив шеќери: <b>{round(total.sugar)} g</b> ({total.carbs > 0 ? Math.round((total.sugar / total.carbs) * 100) : 0}% од вкупните ЈХ)
                      </div>
                    )}
                    {suppProtein > 0 && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#ffb373',
                          marginTop: '3px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        💊 Includes {suppProtein}g from supplements
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
          {tab === 'Overview' ? (
            <div className="dashboard-grid">
              <div className="main-column">
                {mealPanel}
                {workoutPanel}
                {microPanel}
              </div>
              <div className="side-column">
                {waterPanel}
                {timerPanel}
                <section className="week-summary panel">
                  {header('Your week at a glance', 'Calories logged each day')}
                  <div className="bar-chart">
                    {days.map((d) => {
                      const dayKey = dateKey(d);
                      const rec = records[dayKey];
                      const fs: Food[] =
                        rec && typeof rec === 'object' && 'foods' in rec
                          ? (rec as Day).foods
                          : [];
                      const n = fs.reduce((a, f) => a + calculateFoodNutrient(f, 'kcal'), 0);
                      return (
                        <div key={dayKey}>
                          <small>{Math.round(n)}</small>
                          <div>
                            <i
                              style={{
                                height:
                                  Math.max(2, Math.min(100, (n / profile.calories) * 100)) + '%',
                              }}
                            />
                          </div>
                          <span suppressHydrationWarning>{formatDayShort(d).slice(0, 1)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="fine">Daily target: {profile.calories} kcal</p>
                </section>
              </div>
            </div>
          ) : tab === 'Nutrition' ? (
            <div className="main-column">
              {/* Quick Link to Macedonian Supplements Directory */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #24211b, #1a1c17)',
                  border: '1px solid #4a3e28',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Pill size={20} color="#ff792f" />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#f3f6ee', display: 'block' }}>
                      Суплементи во Македонија (Додатоци во исхраната)
                    </strong>
                    <span style={{ fontSize: '11px', color: '#a0a996' }}>
                      Протеини, Креатин (CreGAAtine), C4, Animal Pak &amp; Flex достапни во Скопје и МК (HardCore, Polleo, Proteini.si, Зегин).
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('Supplements')}
                  style={{
                    padding: '6px 14px',
                    background: '#ff792f',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Отвори Каталог ↗
                </button>
              </div>
              {mealPanel}
              {microPanel}
            </div>
          ) : tab === 'Plans' ? (
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
              <PlansSection
                currentWeightKg={profile.weight}
                currentSex={profile.sex === 'female' ? 'female' : 'male'}
                currentCalories={profile.calories}
                currentProtein={profile.protein}
                currentCarbs={profile.carbs}
                currentFat={profile.fat}
                currentWaterMl={profile.water}
                onApplyPlan={async ({ calories, protein, carbs, fat, water, planName }) => {
                  const updatedProfile = {
                    ...profile,
                    calories,
                    protein,
                    carbs,
                    fat,
                    water,
                  };
                  await save('profile', updatedProfile);
                  showNotice(`🎯 Примен план „${planName}“: ${calories} kcal · ${protein}g P · ${carbs}g C · ${fat}g F · ${water}ml Вода`);
                }}
              />
            </div>
          ) : tab === 'PRs' ? (
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
              <PRsSection
                userBodyweightKg={profile.weight}
                userSex={profile.sex === 'female' ? 'female' : 'male'}
                onAddWorkoutExercise={(name, weight, reps) => {
                  open('Workout');
                  setDraft({ name, sets: 3, reps, weight });
                  setSelectedMuscleExercise(name);
                  const m = getMusclesForExercise(name);
                  setSelectedActiveMuscles(m.length > 0 ? m : ['Chest']);
                  setTab('Training');
                }}
              />
            </div>
          ) : tab === 'Training' ? (
            <div className="main-column">
              {workoutPanel}

              {/* Interactive Front & Back Body Anatomy with Dynamic Muscle Lighting */}
              <div style={{ marginBottom: '20px' }}>
                <InteractiveBodyMap
                  activeMuscles={selectedActiveMuscles}
                  selectedExerciseName={selectedMuscleExercise}
                  onMuscleClick={(item) => {
                    const muscles = getMusclesForExercise(item);
                    if (muscles.length > 0) {
                      setSelectedMuscleExercise(item);
                      setSelectedActiveMuscles(muscles);
                      showNotice(`🧬 Осветлени мускули за: ${item}`);
                    } else {
                      setSelectedMuscleExercise(item);
                      setSelectedActiveMuscles([item]);
                      showNotice(`🧬 Активирана мускулна зона: ${item}`);
                    }
                  }}
                />
              </div>

              <ExerciseLibrary
                onAdd={(name: string) => {
                  setSelectedMuscleExercise(name);
                  const m = getMusclesForExercise(name);
                  setSelectedActiveMuscles(m.length > 0 ? m : ['Chest']);
                  open('Workout');
                  setDraft({ name, sets: 3, reps: 10, weight: 0 });
                }}
                onSelectForMuscles={(name: string, muscles: string[]) => {
                  setSelectedMuscleExercise(name);
                  const m = getMusclesForExercise(name, muscles.join(' '));
                  setSelectedActiveMuscles(m.length > 0 ? m : ['Chest']);
                  showNotice(`💡 Мускулите за „${name}“ се осветлени на телото погоре!`);
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
              />
            </div>
          ) : tab === 'Supplements' ? (
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
              <MacedoniaSupplements
                onLogSupplement={handleLogSupplementFromDirectory}
                favoriteIds={favoriteSupplements}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          ) : tab === 'Hydration' ? (
            <div className="narrow-panel">{waterPanel}</div>
          ) : tab === 'TDEE Calculator' ? (
            <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
              <TDEECalculator
                initialWeightKg={profile.weight}
                initialAge={profile.age}
                initialSex={profile.sex}
                existingRecords={records}
                saving={saving}
                onApplyTargets={(newTargets) => {
                  save('profile', { ...profile, ...newTargets });
                }}
              />
            </div>
          ) : (
            <div className="narrow-panel">{timerPanel}</div>
          )}
          <footer>
            EMBER <span>Consistency over perfection.</span>
            <button onClick={() => open('Profile')}>
              Customize your goals <Settings size={13} />
            </button>
          </footer>
        </div>
      </main>
      {modal && (
        <div className="modal-backdrop" onClick={() => !saving && setModal('')}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2>
                {modal === 'Profile'
                  ? 'Make it yours'
                  : modal === 'Micronutrients'
                    ? 'Daily vitamin & mineral intake'
                    : modal === 'Supplement'
                      ? 'Log supplement · Combined with daily nutrition'
                      : modal === 'Water'
                        ? 'Edit water intake'
                        : `Log ${modal.toLowerCase()}`}
              </h2>
              <button aria-label="Close dialog" onClick={() => setModal('')}>
                <X size={21} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                let ok = false;
                if (modal === 'Profile') {
                  const cleanedProfile: Profile = {
                    name: String(draft.name || profile.name || 'Athlete').trim(),
                    age: Number(draft.age) > 0 ? Number(draft.age) : profile.age,
                    sex: (draft.sex === 'female' ? 'female' : 'male') as 'male' | 'female',
                    weight: Number(draft.weight) > 0 ? Number(draft.weight) : profile.weight,
                    calories: Number(draft.calories) > 0 ? Number(draft.calories) : profile.calories,
                    protein: Number(draft.protein) > 0 ? Number(draft.protein) : profile.protein,
                    carbs: Number(draft.carbs) > 0 ? Number(draft.carbs) : profile.carbs,
                    fat: Number(draft.fat) > 0 ? Number(draft.fat) : profile.fat,
                    water:
                      Number(draft.water) > 0
                        ? Number(draft.water)
                        : Math.round((Number(draft.weight) || profile.weight) * (draft.sex === 'female' ? 33 : 35)),
                  };
                  ok = await save('profile', cleanedProfile);
                }
                if (modal === 'Food') {
                  const g = Math.max(1, Number(draft.grams) || 100);
                  const selectedFood =
                    VERIFIED_FOOD_CATALOG.find((f) => f.id === draft.foodId) ||
                    VERIFIED_FOOD_CATALOG.find((f) => f.name === draft.name) ||
                    VERIFIED_FOOD_CATALOG[0];
                  const servingMicros = calculateServingMicros(selectedFood, g);

                  ok = await update({
                    foods: [
                      ...day.foods,
                      {
                        id: crypto.randomUUID(),
                        name: selectedFood.name,
                        meal: String(draft.meal || 'Breakfast'),
                        grams: g,
                        kcal: selectedFood.kcal,
                        protein: selectedFood.protein,
                        carbs: selectedFood.carbs,
                        fat: selectedFood.fat,
                        fiber: selectedFood.fiber,
                        sugar: selectedFood.sugar,
                        sodium: selectedFood.sodium,
                        micros: servingMicros,
                      },
                    ],
                  });
                }
                if (modal === 'Workout')
                  ok = await update({
                    workouts: [
                      ...day.workouts,
                      {
                        id: crypto.randomUUID(),
                        name: String(draft.name || 'Exercise').trim(),
                        sets: Math.max(1, Number(draft.sets) || 3),
                        reps: Math.max(1, Number(draft.reps) || 10),
                        weight: Math.max(0, Number(draft.weight) || 0),
                        done: false,
                      },
                    ],
                  });
                if (modal === 'Water') {
                  const ml = Math.max(0, Number(draft.amount || 0));
                  ok = await update({ water: Math.round(ml) });
                }
                if (modal === 'Micronutrients') {
                  const cleaned: Record<string, number> = {};
                  for (const [k, v] of Object.entries(draft)) {
                    const num = Number(v);
                    if (!isNaN(num) && num > 0) {
                      cleaned[k] = Math.round(num * 100) / 100;
                    }
                  }
                  ok = await update({ micros: cleaned });
                }
                if (modal === 'Supplement') {
                  const servingGrams = Math.max(1, Number(draft.servingGrams) || 30);
                  const servings = Math.max(0.1, Number(draft.servings) || 1);
                  const proteinVal = Math.round((Number(draft.protein) || 0) * servings * 10) / 10;
                  const kcalVal = Math.round(
                    (Number(draft.kcal) > 0 ? Number(draft.kcal) : proteinVal * 4 + 20) * servings
                  );
                  const carbsVal = Math.round((Number(draft.carbs) || 0) * servings * 10) / 10;
                  const fatVal = Math.round((Number(draft.fat) || 0) * servings * 10) / 10;
                  const totalGrams = Math.round(servingGrams * servings);

                  const supplementMicros = (draft.micros as Record<string, number>) || {};
                  const newMicros = { ...day.micros };
                  for (const [k, v] of Object.entries(supplementMicros)) {
                    if (v && Number(v) > 0) {
                      newMicros[k] = Math.round(((newMicros[k] || 0) + Number(v) * servings) * 10) / 10;
                    }
                  }

                  const newFoodItem: Food = {
                    id: crypto.randomUUID(),
                    name: String(draft.name || 'Supplement').trim(),
                    meal: String(draft.meal || 'Supplements'),
                    grams: totalGrams,
                    servingGrams: totalGrams,
                    perServing: true,
                    isSupplement: true,
                    kcal: kcalVal,
                    protein: proteinVal, // Exact grams added to daily totals!
                    carbs: carbsVal,
                    fat: fatVal,
                    fiber: 0,
                    sugar: Math.round((Number(draft.sugar) || 0) * servings * 10) / 10,
                    sodium: Math.round((Number(draft.sodium) || 0) * servings),
                    micros: supplementMicros,
                  };

                  ok = await update({
                    foods: [...day.foods, newFoodItem],
                    micros: newMicros,
                  });
                  if (ok) {
                    showNotice(
                      `💊 Added ${newFoodItem.name}: +${proteinVal}g protein & +${kcalVal} kcal combined into daily nutrition!`
                    );
                  }
                }
                if (ok) setModal('');
              }}
            >
              {modal === 'Food' && (() => {
                const selectedFood =
                  VERIFIED_FOOD_CATALOG.find((f) => f.id === draft.foodId) ||
                  VERIFIED_FOOD_CATALOG.find((f) => f.name === draft.name) ||
                  VERIFIED_FOOD_CATALOG[0];

                const currentGrams = Math.max(1, Number(draft.grams) || 100);
                const multiplier = currentGrams / 100;

                // Exact calculated nutrients scaled by amount (if 200g instead of 100g, multiplier is 2)
                const calcKcal = Math.round(selectedFood.kcal * multiplier);
                const calcProtein = round(selectedFood.protein * multiplier);
                const calcCarbs = round(selectedFood.carbs * multiplier);
                const calcFat = round(selectedFood.fat * multiplier);
                const calcFiber = round(selectedFood.fiber * multiplier);
                const calcSugar = round(selectedFood.sugar * multiplier);
                const calcSodium = Math.round(selectedFood.sodium * multiplier);

                const categories = [
                  'All',
                  'Proteins',
                  'Carbohydrates',
                  'Fruits & Vegetables',
                  'Dairy & Alternatives',
                  'Fats & Nuts',
                  'Legumes & Plant',
                ];

                const filteredFoods = VERIFIED_FOOD_CATALOG.filter((f) => {
                  const matchesSearch =
                    !search ||
                    f.name.toLowerCase().includes(search.toLowerCase()) ||
                    f.category.toLowerCase().includes(search.toLowerCase());
                  const matchesCategory =
                    foodCategory === 'All' || f.category === foodCategory;
                  return matchesSearch && matchesCategory;
                });

                return (
                  <>
                    <div className="locked-badge">
                      <Lock size={13} />
                      <span>VERIFIED USDA DATABASE · NUTRIENT VALUES LOCKED</span>
                    </div>

                    <p className="muted" style={{ margin: '0 0 10px 0' }}>
                      Nutrient profiles are verified from official standards and cannot be changed manually. <b>Only your meal and portion amount (grams) can be adjusted</b>; all nutrients automatically scale with your serving weight.
                    </p>

                    {/* Category Filter Chips */}
                    <div className="chips-row">
                      {categories.map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          className={'chip-btn ' + (foodCategory === cat ? 'active' : '')}
                          onClick={() => setFoodCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                      <input
                        placeholder="Search verified foods, e.g. chicken breast, oats, salmon, eggs…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '34px' }}
                      />
                      <Search
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '11px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#8b9385',
                        }}
                      />
                    </div>

                    {/* Food Selection List */}
                    <div
                      className="food-options"
                      style={{
                        maxHeight: '145px',
                        overflowY: 'auto',
                        border: '1px solid #383f30',
                        borderRadius: '8px',
                        background: '#1b1d19',
                        padding: '4px',
                      }}
                    >
                      {filteredFoods.map((f) => {
                        const isSelected = selectedFood.id === f.id;
                        return (
                          <button
                            type="button"
                            key={f.id}
                            onClick={() => {
                              setDraft((prev) => ({
                                ...prev,
                                foodId: f.id,
                                name: f.name,
                                kcal: f.kcal,
                                protein: f.protein,
                                carbs: f.carbs,
                                fat: f.fat,
                                fiber: f.fiber,
                                sugar: f.sugar,
                                sodium: f.sodium,
                              }));
                            }}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              background: isSelected ? '#3c2e22' : 'transparent',
                              borderColor: isSelected ? '#724a2c' : '#2b3125',
                              color: isSelected ? '#ff9e63' : '#d7decb',
                              borderRadius: '6px',
                              textAlign: 'left',
                              width: '100%',
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: '13px', display: 'block' }}>{f.name}</strong>
                              <small style={{ color: '#889080', fontSize: '11px' }}>
                                {f.kcal} kcal · {f.protein}g P · {f.carbs}g C · {f.fat}g F (per 100g)
                                {f.portionTip ? ` · ${f.portionTip}` : ''}
                              </small>
                            </div>
                            {isSelected ? <Check size={16} /> : <Plus size={14} />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Food Protected Summary */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#242720',
                        border: '1px solid #404835',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginTop: '14px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '10px', letterSpacing: '0.8px', color: '#97a28e', fontWeight: 600 }}>
                          SELECTED FOOD ITEM (LOCKED)
                        </span>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#f3f6ee', marginTop: '2px' }}>
                          {selectedFood.name}
                        </div>
                        {selectedFood.portionTip && (
                          <div style={{ fontSize: '11px', color: '#ff9a5e', marginTop: '2px' }}>
                            Portion tip: {selectedFood.portionTip}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#8da87c',
                          background: '#1e241c',
                          padding: '4px 8px',
                          borderRadius: '5px',
                        }}
                      >
                        <Lock size={12} /> Nutrients Fixed
                      </span>
                    </div>

                    {/* The ONLY Two Editable Fields: MEAL and AMOUNT */}
                    <div className="form-grid" style={{ marginTop: '14px' }}>
                      <label>
                        Meal (Editable)
                        <select
                          value={String(draft.meal || 'Breakfast')}
                          onChange={(e) => setDraft({ ...draft, meal: e.target.value })}
                          style={{ fontWeight: 600 }}
                        >
                          {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Amount in grams (Editable)
                        <input
                          type="number"
                          required
                          min="1"
                          max="5000"
                          step="1"
                          value={draft.grams === undefined || draft.grams === null ? '' : String(draft.grams)}
                          placeholder="100"
                          onChange={(e) => {
                            setDraft({ ...draft, grams: e.target.value });
                          }}
                          style={{ fontWeight: 600 }}
                        />
                      </label>
                    </div>

                    {/* Quick Portion Chips */}
                    <div>
                      <span style={{ fontSize: '11px', color: '#8d9585', fontWeight: 600 }}>QUICK PORTION SHORTCUTS</span>
                      <div className="chips-row" style={{ marginTop: '4px' }}>
                        {[50, 100, 150, 200, 250, 300].map((gm) => (
                          <button
                            type="button"
                            key={gm}
                            className={'chip-btn ' + (currentGrams === gm ? 'active' : '')}
                            onClick={() => setDraft({ ...draft, grams: gm })}
                          >
                            {gm} g {gm === 100 ? '(1x base)' : gm === 200 ? '(2x base)' : ''}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Multiplied Nutrients Readouts (Locked - Read Only) */}
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', letterSpacing: '0.8px', color: '#ff9a5e', fontWeight: 600 }}>
                          CALCULATED NUTRIENTS FOR {currentGrams}g ({multiplier.toFixed(2)}× MULTIPLIER)
                        </span>
                        <span style={{ fontSize: '11px', color: '#889182', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Lock size={11} /> Read-only
                        </span>
                      </div>

                      <div className="nutrient-cards-grid">
                        <div className="nutrient-card highlight">
                          <span className="card-label">CALORIES</span>
                          <span className="card-value">{calcKcal}</span>
                          <span className="card-unit">kcal</span>
                        </div>
                        <div className="nutrient-card">
                          <span className="card-label">PROTEIN</span>
                          <span className="card-value">{calcProtein}</span>
                          <span className="card-unit">grams</span>
                        </div>
                        <div className="nutrient-card">
                          <span className="card-label">CARBS</span>
                          <span className="card-value">{calcCarbs}</span>
                          <span className="card-unit">grams</span>
                        </div>
                        <div className="nutrient-card">
                          <span className="card-label">FAT</span>
                          <span className="card-value">{calcFat}</span>
                          <span className="card-unit">grams</span>
                        </div>
                        <div className="nutrient-card">
                          <span className="card-label">FIBER</span>
                          <span className="card-value">{calcFiber}</span>
                          <span className="card-unit">grams</span>
                        </div>
                        <div className="nutrient-card">
                          <span className="card-label">SUGAR</span>
                          <span className="card-value">{calcSugar}</span>
                          <span className="card-unit">grams</span>
                        </div>
                        <div className="nutrient-card">
                          <span className="card-label">SODIUM</span>
                          <span className="card-value">{calcSodium}</span>
                          <span className="card-unit">mg</span>
                        </div>
                      </div>

                      {/* Vitamins & Minerals (Auto-Logged to Vitamin section) */}
                      {(() => {
                        const servingMicros = calculateServingMicros(selectedFood, currentGrams);
                        const microEntries = Object.entries(servingMicros);
                        const getUnit = (name: string) =>
                          BODYWEIGHT_MICRONUTRIENTS.find((x) => x.name === name)?.unit || 'mg';

                        return (
                          <div style={{ marginTop: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '11px', letterSpacing: '0.8px', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Sparkles size={12} /> VITAMINS &amp; MINERALS IN THIS SERVING (AUTO-LOGS TO VITAMIN SECTION)
                              </span>
                              <span style={{ fontSize: '11px', color: '#7e8a75' }}>
                                {microEntries.length} verified micronutrient{microEntries.length === 1 ? '' : 's'}
                              </span>
                            </div>

                            {microEntries.length === 0 ? (
                              <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
                                Trace or negligible micronutrient density in standard serving.
                              </div>
                            ) : (
                              <div className="micros-pill-grid">
                                {microEntries.map(([mName, mVal]) => (
                                  <div key={mName} className="micro-badge">
                                    <span className="micro-badge-name">{mName}</span>
                                    <span className="micro-badge-val">
                                      {mVal} {getUnit(mName)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                );
              })()}
              {modal === 'Workout' && (
                <>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Exercise (Search As You Type)</span>
                      <span style={{ fontSize: '11px', color: '#97a28e' }}>
                        Type letters to see matching movements
                      </span>
                    </div>
                    <ExerciseAutocomplete
                      value={String(draft.name || '')}
                      userHistoryExercises={userHistoryExercises}
                      autoFocus={true}
                      required={true}
                      placeholder="Type letters to search exercises, e.g. Bench, Squat, Curl, Deadlift, RDL…"
                      onChange={(name, defaultSets, defaultReps) => {
                        setDraft((prev) => ({
                          ...prev,
                          name,
                          sets: prev.sets || defaultSets || 3,
                          reps: prev.reps || defaultReps || 10,
                        }));
                      }}
                    />
                  </label>
                  <div className="form-grid" style={{ marginTop: '12px' }}>
                    {['sets', 'reps', 'weight'].map((k) => (
                      <label key={k}>
                        {k === 'weight' ? 'Weight (kg)' : k}
                        <input
                          required
                          type="number"
                          min={k === 'weight' ? 0 : 1}
                          max="1000"
                          step={k === 'weight' ? 0.5 : 1}
                          value={draft[k] === undefined || draft[k] === null ? '' : String(draft[k])}
                          placeholder={k === 'sets' ? '3' : k === 'reps' ? '10' : '0'}
                          onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                        />
                      </label>
                    ))}
                  </div>
                  <p className="fine">
                    Add the same exercise again for sets with different weights or reps. Mark it
                    completed after your session.
                  </p>
                </>
              )}
              {modal === 'Water' && (
                <>
                  <p className="muted">
                    Track by standard glasses of water or enter the exact liquid volume in milliliters.
                  </p>
                  <div className="form-grid">
                    <label>
                      Glasses of water (Editable)
                      <input
                        type="number"
                        min="0"
                        max="80"
                        step="1"
                        autoFocus
                        value={draft.glasses === undefined || draft.glasses === null ? '' : String(draft.glasses)}
                        placeholder="8"
                        onChange={(e) => {
                          const val = e.target.value;
                          const glasses = val === '' ? '' : Math.max(0, Number(val));
                          const ml = val === '' ? '' : Number(glasses) * 250;
                          setDraft({ ...draft, glasses: val, amount: ml });
                        }}
                      />
                      <small>1 glass ≈ 250 ml (approx 8.5 fl oz)</small>
                    </label>
                    <label>
                      Total volume in milliliters (ml)
                      <input
                        type="number"
                        min="0"
                        max="20000"
                        step="50"
                        value={draft.amount === undefined || draft.amount === null ? '' : String(draft.amount)}
                        placeholder="2000"
                        onChange={(e) => {
                          const val = e.target.value;
                          const ml = val === '' ? '' : Math.max(0, Number(val));
                          const glasses = val === '' ? '' : Math.round(Number(ml) / 250);
                          setDraft({ ...draft, amount: val, glasses });
                        }}
                      />
                      <small>{((Number(draft.amount) || 0) / 1000).toFixed(2)} Liters</small>
                    </label>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#9da595', fontWeight: 600 }}>QUICK PRESETS</span>
                    <div className="chips-row" style={{ marginTop: '6px' }}>
                      {[
                        { label: '4 Glasses (1.0 L)', ml: 1000 },
                        { label: '6 Glasses (1.5 L)', ml: 1500 },
                        { label: '8 Glasses (2.0 L)', ml: 2000 },
                        { label: '10 Glasses (2.5 L)', ml: 2500 },
                        { label: '12 Glasses (3.0 L)', ml: 3000 },
                      ].map((p) => (
                        <button
                          type="button"
                          key={p.label}
                          className={'chip-btn ' + (Number(draft.amount) === p.ml ? 'active' : '')}
                          onClick={() => setDraft({ ...draft, amount: p.ml, glasses: p.ml / 250 })}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {modal === 'Supplement' && (
                <>
                  <p className="muted" style={{ margin: '0 0 12px 0' }}>
                    Log protein powders, mass gainers, creatine, vitamins, omega-3, or custom workout supplements.{' '}
                    <b style={{ color: '#ffb373' }}>
                      All macro nutrients (protein, calories, carbs, fats) and vitamins are automatically combined into your overall daily totals!
                    </b>
                  </p>

                  {/* Mode Tabs: Catalog vs Custom */}
                  <div className="chips-row" style={{ marginBottom: '12px' }}>
                    <button
                      type="button"
                      className={'chip-btn ' + (suppModalTab === 'catalog' ? 'active' : '')}
                      onClick={() => setSuppModalTab('catalog')}
                    >
                      📦 Macedonian Catalog Presets
                    </button>
                    <button
                      type="button"
                      className={'chip-btn ' + (suppModalTab === 'custom' ? 'active' : '')}
                      onClick={() => setSuppModalTab('custom')}
                    >
                      ✍️ Custom Supplement Entry
                    </button>
                  </div>

                  {suppModalTab === 'catalog' && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <input
                          type="text"
                          placeholder="Search Macedonian supplements (e.g. Whey, Iso, Gold Standard, Creatine, ZMA, Magnezium)..."
                          value={suppModalSearch}
                          onChange={(e) => setSuppModalSearch(e.target.value)}
                          style={{ paddingLeft: '32px' }}
                        />
                        <Search
                          size={14}
                          style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8',
                          }}
                        />
                      </div>

                      {/* Quick click presets list */}
                      <div
                        style={{
                          maxHeight: '135px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          border: '1px solid #3c3425',
                          borderRadius: '8px',
                          padding: '4px',
                          background: '#191b16',
                        }}
                      >
                        {MACEDONIAN_SUPPLEMENTS.filter((s) => {
                          if (!suppModalSearch.trim()) return true;
                          const q = suppModalSearch.toLowerCase();
                          return (
                            s.name.toLowerCase().includes(q) ||
                            s.nameMk.toLowerCase().includes(q) ||
                            s.brand.toLowerCase().includes(q) ||
                            s.category.toLowerCase().includes(q)
                          );
                        })
                          .slice(0, 20)
                          .map((s) => {
                            const isSelected = draft.supplementId === s.id;
                            const pGrams =
                              s.proteinGramsPerServing ||
                              (s.category === 'Mass Gainers' ? 50 : s.category === 'Amino Acids' ? 8 : 0);
                            const kVal = Math.round(
                              pGrams > 0
                                ? pGrams * 4 + 25
                                : s.category === 'Omega & Healthy Fats'
                                  ? 20
                                  : 15
                            );
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setDraft({
                                    ...draft,
                                    supplementId: s.id,
                                    name: `${s.brand} ${s.nameMk.split('(')[0].trim()}`,
                                    brand: s.brand,
                                    category: s.category,
                                    protein: pGrams,
                                    kcal: kVal,
                                    carbs:
                                      s.category === 'Mass Gainers' ? 250 : s.category === 'Proteins' ? 2 : 0,
                                    fat:
                                      s.category === 'Omega & Healthy Fats' ? 2 : s.category === 'Proteins' ? 1.5 : 0,
                                    servingGrams: 30,
                                    servings: 1,
                                    meal: 'Supplements',
                                  });
                                }}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  textAlign: 'left',
                                  background: isSelected ? '#3a2918' : 'transparent',
                                  border: isSelected ? '1px solid #7c4c23' : '1px solid transparent',
                                  color: isSelected ? '#ffa861' : '#d2d8ca',
                                  cursor: 'pointer',
                                }}
                              >
                                <div>
                                  <b>{s.brand}</b> {s.nameMk.split('(')[0].trim()}
                                  <span style={{ fontSize: '11px', color: '#889182', marginLeft: '6px' }}>
                                    ({s.category})
                                  </span>
                                </div>
                                <div style={{ fontWeight: 700, color: '#ff9a5e' }}>
                                  {pGrams > 0 ? `${pGrams}g Protein` : s.dosage.split('·')[0].trim()}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Form fields for supplement */}
                  <div className="form-grid">
                    <label style={{ gridColumn: '1 / -1' }}>
                      Supplement name
                      <input
                        required
                        type="text"
                        value={String(draft.name || '')}
                        placeholder="e.g. Optimum Nutrition Gold Standard Whey, BioTech Iso Whey..."
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      />
                    </label>

                    <label>
                      Protein per serving (grams)
                      <input
                        type="number"
                        min="0"
                        max="200"
                        step="0.5"
                        required
                        value={draft.protein !== undefined && draft.protein !== null ? String(draft.protein) : ''}
                        placeholder="30"
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          setDraft({
                            ...draft,
                            protein: e.target.value,
                            kcal: Math.round(p * 4 + 20),
                          });
                        }}
                      />
                      <small style={{ color: '#ffb373' }}>
                        e.g. <b>30g</b> adds +30g protein directly to your daily target
                      </small>
                    </label>

                    <label>
                      Calories (kcal)
                      <input
                        type="number"
                        min="0"
                        max="3000"
                        step="1"
                        value={draft.kcal !== undefined && draft.kcal !== null ? String(draft.kcal) : ''}
                        placeholder="140"
                        onChange={(e) => setDraft({ ...draft, kcal: e.target.value })}
                      />
                      <small>Combined into today&apos;s total calories &amp; TDEE</small>
                    </label>

                    <label>
                      Carbohydrates (grams)
                      <input
                        type="number"
                        min="0"
                        max="500"
                        step="0.5"
                        value={draft.carbs !== undefined && draft.carbs !== null ? String(draft.carbs) : ''}
                        placeholder="2"
                        onChange={(e) => setDraft({ ...draft, carbs: e.target.value })}
                      />
                    </label>

                    <label>
                      Fat (grams)
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={draft.fat !== undefined && draft.fat !== null ? String(draft.fat) : ''}
                        placeholder="1.5"
                        onChange={(e) => setDraft({ ...draft, fat: e.target.value })}
                      />
                    </label>

                    <label>
                      Servings / Scoops count
                      <input
                        type="number"
                        min="0.25"
                        max="10"
                        step="0.25"
                        value={draft.servings !== undefined && draft.servings !== null ? String(draft.servings) : '1'}
                        placeholder="1"
                        onChange={(e) => setDraft({ ...draft, servings: e.target.value })}
                      />
                      <small>1 scoop = standard dose (scales protein &amp; calories)</small>
                    </label>

                    <label>
                      Time / Meal grouping
                      <select
                        value={String(draft.meal || 'Supplements')}
                        onChange={(e) => setDraft({ ...draft, meal: e.target.value })}
                      >
                        <option value="Supplements">Supplements (Dedicated)</option>
                        <option value="Snacks">Snacks</option>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                      </select>
                    </label>
                  </div>

                  {/* Real-time Impact Preview */}
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px 14px',
                      background: '#231d14',
                      border: '1px solid #573a21',
                      borderRadius: '10px',
                      color: '#ffb373',
                      fontSize: '13px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} color="#ffa552" />
                      COMBINED DIRECTLY INTO TODAY&apos;S OVERALL NUTRITION:
                    </div>
                    <div style={{ color: '#f5f5f5', fontWeight: 700, fontSize: '15px' }}>
                      +{Math.round((Number(draft.protein) || 0) * (Number(draft.servings) || 1))}g Protein ·{' '}
                      +{Math.round(((Number(draft.kcal) > 0 ? Number(draft.kcal) : (Number(draft.protein) || 0) * 4 + 20)) * (Number(draft.servings) || 1))} kcal ·{' '}
                      +{Math.round((Number(draft.carbs) || 0) * (Number(draft.servings) || 1))}g Carbs ·{' '}
                      +{Math.round((Number(draft.fat) || 0) * (Number(draft.servings) || 1) * 10) / 10}g Fat
                    </div>
                    <div style={{ fontSize: '11px', color: '#a89885' }}>
                      This supplement immediately updates your top macro bars, calorie goals, and TDEE energy logs.
                    </div>
                  </div>
                </>
              )}
              {modal === 'Micronutrients' && (
                <>
                  <p className="muted">
                    Log standalone supplements or multivitamin doses here. (Your logged foods already automatically calculate and deposit their verified vitamins and minerals to your daily tracker!).
                  </p>

                  {/* Search and Category Filters in Modal */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px', position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search vitamins &amp; minerals (e.g. B12, Zinc, Magnesium)..."
                        value={microModalSearch}
                        onChange={(e) => setMicroModalSearch(e.target.value)}
                        style={{ paddingLeft: '32px' }}
                      />
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    </div>
                  </div>

                  <div className="micro-filter-row" style={{ marginBottom: '14px' }}>
                    {(['All', 'Vitamins', 'B-Complex', 'Minerals & Electrolytes', 'Trace Elements'] as const).map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        className={'micro-filter-btn ' + (microModalCategory === cat ? 'active' : '')}
                        onClick={() => setMicroModalCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="form-grid">
                    {microTargets
                      .filter((m) => {
                        if (microModalCategory !== 'All' && m.category !== microModalCategory) return false;
                        if (microModalSearch.trim()) {
                          const q = microModalSearch.toLowerCase();
                          return m.name.toLowerCase().includes(q) || m.shortDesc.toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .map((m) => {
                        const fromFood = foodMicros[m.name] || 0;
                        return (
                          <label key={m.name}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{m.name} ({m.unit})</span>
                              <span className="micro-cat-pill">{m.category}</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              max="100000"
                              step="any"
                              value={draft[m.name] !== undefined && draft[m.name] !== null ? String(draft[m.name]) : ''}
                              placeholder="0"
                              onChange={(e) => setDraft({ ...draft, [m.name]: e.target.value })}
                            />
                            <small style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '3px' }}>
                              <span style={{ color: '#86efac' }}>
                                Target: {m.target} {m.unit} • ⚖️ {m.formulaLabel}
                              </span>
                              {fromFood > 0 ? (
                                <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                                  🥗 {fromFood} {m.unit} already credited from logged food
                                </span>
                              ) : (
                                <span style={{ color: '#64748b' }}>0 from food today</span>
                              )}
                            </small>
                          </label>
                        );
                      })}
                  </div>
                  <p className="fine" style={{ marginTop: '12px' }}>
                    Targets dynamically linked to your body weight ({profile.weight} kg).
                    More is not always better. Do not use reference targets to diagnose a deficiency or megadose supplements.
                  </p>
                </>
              )}
              {modal === 'Profile' && (
                <>
                  <label>
                    Your name
                    <input
                      required
                      maxLength={40}
                      value={String(draft.name || '')}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      Age (adults 19+)
                      <input
                        required
                        type="number"
                        min="19"
                        max="110"
                        value={draft.age === undefined || draft.age === null ? '' : String(draft.age)}
                        placeholder="25"
                        onChange={(e) => setDraft({ ...draft, age: e.target.value })}
                      />
                    </label>
                    <label>
                      Sex for nutrient references
                      <select
                        value={String(draft.sex || 'male')}
                        onChange={(e) => setDraft({ ...draft, sex: e.target.value })}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </label>
                    {[
                      ['weight', 'Body weight (kg)', '80'],
                      ['calories', 'Daily calories (kcal)', '2400'],
                      ['protein', 'Protein goal (g)', '160'],
                      ['carbs', 'Carbs goal (g)', '250'],
                      ['fat', 'Fat goal (g)', '70'],
                      ['water', 'Drink goal (ml)', '2800'],
                    ].map(([k, label, placeholder]) => {
                      const curWeight = Number(draft.weight) > 0 ? Number(draft.weight) : profile.weight;
                      const curSex = String(draft.sex || profile.sex || 'male');
                      const autoWater = Math.round(curWeight * (curSex === 'female' ? 33 : 35));

                      return (
                        <label key={k}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{label}</span>
                            {k === 'water' && (
                              <button
                                type="button"
                                onClick={() => setDraft((d) => ({ ...d, water: autoWater }))}
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  background: '#233d40',
                                  border: '1px solid #375d62',
                                  color: '#a5e7ec',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                Match Weight ({autoWater} ml)
                              </button>
                            )}
                          </div>
                          <input
                            required
                            type="number"
                            min="1"
                            max="20000"
                            step="any"
                            readOnly={k === 'water'}
                            value={k === 'water' ? autoWater : draft[k] === undefined || draft[k] === null ? '' : String(draft[k])}
                            placeholder={placeholder}
                            onChange={(e) => {
                              if (k !== 'water') {
                                setDraft({ ...draft, [k]: e.target.value });
                              }
                            }}
                            style={k === 'water' ? { background: '#192527', border: '1px solid #2d4c51', color: '#c2f1f4', cursor: 'not-allowed' } : undefined}
                          />
                          {k === 'water' && (
                            <small style={{ color: '#8bb9bc', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                              🔒 <b>Фиксна научна доза:</b> Препорачаниот дневен внес на вода е автоматски заклучен според твојата телесна тежина ({autoWater} ml = {Math.round(autoWater / 250)} чаши) • {curSex === 'female' ? '33' : '35'} ml/kg.
                            </small>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <p className="fine">
                    Starting goals are editable examples, not a personalized diet prescription.
                    Vitamin references use age and sex. Body weight alone cannot determine vitamin
                    needs. Drink needs vary with exercise, climate, food and health.
                  </p>
                </>
              )}
              {error && <div className="error">{error}</div>}
              <div className="modal-actions">
                <button type="button" onClick={() => setModal('')}>
                  Cancel
                </button>
                <button
                  className="primary"
                  type="submit"
                  disabled={!ready || saving}
                >
                  {saving ? 'Saving…' : 'Save ' + (modal === 'Profile' ? 'profile' : 'entry')}
                  <Check size={16} />
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Floating Supplement / Action Notification Toast */}
      {notification && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            maxWidth: '420px',
            background: '#19261a',
            border: '1px solid #3e6843',
            color: '#bbf7d0',
            padding: '12px 18px',
            borderRadius: '12px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '13px',
            lineHeight: 1.4,
          }}
        >
          <CheckCircle2 size={18} color="#4ade80" style={{ flexShrink: 0 }} />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
