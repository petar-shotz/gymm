'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Search, ChevronDown, ChevronUp, Dumbbell, Activity } from 'lucide-react';
import exercises from '@/lib/exercises.json';

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  category: string;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  instructions: string[];
  images?: string[];
  hasPhotoDemo: boolean;
  demonstrationSteps: {
    phase: string;
    description: string;
    cue: string;
  }[];
}

// Additional comprehensive exercise demonstrations to satisfy the user request:
// "for the training add more exercises with demonstration"
const ADDITIONAL_DEMONSTRATION_EXERCISES: ExerciseLibraryItem[] = [
  {
    id: 'overhead-barbell-press-demo',
    name: 'Standing Overhead Barbell Press (Military Press)',
    category: 'Shoulders',
    equipment: 'Barbell',
    primaryMuscles: ['shoulders', 'triceps'],
    secondaryMuscles: ['upper chest', 'core', 'traps'],
    hasPhotoDemo: false,
    instructions: [
      'Set the barbell in a rack at upper collarbone height. Grip the bar just outside shoulder width with a full grip.',
      'Unrack the bar and take 2 steady steps back. Squeeze your glutes, lock your knees, and brace your abdominals tightly.',
      'Tuck your chin slightly and press the bar straight vertically close to your face until arms are fully locked overhead.',
      'Shrug your shoulders slightly at the top for joint stability, then control the descent smoothly back to your clavicles.',
    ],
    demonstrationSteps: [
      {
        phase: 'Чекор 1: Почетна позиција (Front Rack)',
        description: 'Шипката почива на горниот дел од клучните коски. Лактите се благо нанапред под шипката, нозете се цврсто заземјени во ширина на раменици, а глутеусот и стомакот се максимално стегнати.',
        cue: '💡 Главен совет: Никогаш не го виткај грбот наназад. Телото мора да биде како цврст столб.',
      },
      {
        phase: 'Чекор 2: Вертикален потисок (Drive Phase)',
        description: 'Тргни ја главата благо наназад за шипката да помине директно пред носот. Експлозивно притисни нагоре користејќи ја силата од предните рамена и трицепсот.',
        cue: '💡 Главен совет: Шипката патува во права вертикална линија, не во лак.',
      },
      {
        phase: 'Чекор 3: Заклучување над глава (Overhead Lockout)',
        description: 'Кога шипката ќе го помине челото, врати ја главата напред во природна положба. Целосно заклучи ги лактите точно над центарот на главата и ' +
          'стапалата.',
        cue: '💡 Главен совет: Стабилноста доаѓа од активен трапез и цврст среден дел (core).',
      },
    ],
  },
  {
    id: 'incline-dumbbell-bench-demo',
    name: 'Incline Dumbbell Bench Press',
    category: 'Chest',
    equipment: 'Dumbbell',
    primaryMuscles: ['chest', 'shoulders'],
    secondaryMuscles: ['triceps'],
    hasPhotoDemo: false,
    instructions: [
      'Set an adjustable bench to a 30° to 45° incline. Sit with dumbbells resting upright on your knees.',
      'Kick the dumbbells up with your knees as you lie back. Retract and depress your scapulae into the pad.',
      'Lower the dumbbells steadily with elbows flared at roughly 45-60° to the torso, feeling a deep stretch across the clavicular upper chest.',
      'Drive the dumbbells up in a gentle arc without clanking them together at the apex. Squeeze the upper chest hard.',
    ],
    demonstrationSteps: [
      {
        phase: 'Чекор 1: Сетап под агол 30-45°',
        description: 'Постави ја клупата на 30° (идеално за горен дел на гради) или 45°. Потпрени лопатки, стапала цврсто на под, благ природен лак во половината.',
        cue: '💡 Главен совет: Превисок агол (>45°) го префрла товарот на предното рамо наместо на горните гради.',
      },
      {
        phase: 'Чекор 2: Ексцентрично спуштање (3 секунди)',
        description: 'Спуштај ги теговите контролирано 3 секунди додека не почувствуваш истегнување на горните гради. Лактите под агол од 45° спрема телото за заштита на рамениот зглоб.',
        cue: '💡 Главен совет: Не дозволувај лактите да се шират 90° настрана.',
      },
      {
        phase: 'Чекор 3: Потисок со контракција',
        description: 'Потисни нагоре со силата на градните мускули, приближувајќи ги теговите на врвот без удирање на бучиците.',
        cue: '💡 Главен совет: Задржи 1 секунда на врвот и стегни ги горните гради.',
      },
    ],
  },
  {
    id: 'barbell-hip-thrust-demo',
    name: 'Barbell Hip Thrust',
    category: 'Legs',
    equipment: 'Barbell',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'quadriceps'],
    hasPhotoDemo: false,
    instructions: [
      'Sit on the ground with your upper back (lower shoulder blades) resting against a flat bench. Place a padded barbell directly over your hips.',
      'Plant your feet flat at roughly shoulder-width with shins vertical at top lockout.',
      'Drive through your heels to extend your hips fully toward the ceiling, maintaining a slight chin tuck to prevent lumbar hyperextension.',
      'Squeeze the glutes aggressively at horizontal lockout for 1 full second, then control the bar back down.',
    ],
    demonstrationSteps: [
      {
        phase: 'Чекор 1: Позиционирање на клупа и шипка',
        description: 'Долниот дел од лопатките се потпира на работ од клупата. Шипката со заштитен сунѓер е центрирана директно врз колковите. Стапалата се раширени во ширина на рамениците.',
        cue: '💡 Главен совет: Колената и потколениците на врвот мора да формираат точно 90 степени агол.',
      },
      {
        phase: 'Чекор 2: Експлозивна екстензија на колк',
        description: 'Притисни низ петиците и крени го колкот нагоре додека торзото и бутовите не формираат рамна хоризонтална линија.',
        cue: '💡 Главен совет: Брадата држи ја насочена кон градите, погледот нанапред (ова спречува виткање на половината).',
      },
      {
        phase: 'Чекор 3: Пик контракција (1-2 секунди)',
        description: 'Максимално стегни го глутеусот на врвот пред да ја спуштиш шипката назад кон подот.',
        cue: '💡 Главен совет: Не го превиткувај долниот грб — движењето доаѓа исклучиво од карлицата.',
      },
    ],
  },
  {
    id: 'cable-face-pulls-demo',
    name: 'Cable Face Pulls with Rope Attachment',
    category: 'Back',
    equipment: 'Cable',
    primaryMuscles: ['rear deltoids', 'traps'],
    secondaryMuscles: ['rotator cuff', 'rhomboids'],
    hasPhotoDemo: false,
    instructions: [
      'Attach a rope to a cable pulley positioned at eye or forehead level.',
      'Grip each rope end with a thumbs-backward or overhand grip and take a step back into a staggered stance.',
      'Pull the rope attachments toward your eyes/forehead while pulling the handles apart and driving elbows back.',
      'Externally rotate the shoulders at the end of the pull, pause for 1 second to strengthen the rear delts and rotator cuff, then return smoothly.',
    ],
    demonstrationSteps: [
      {
        phase: 'Чекор 1: Поставување на макара и фат',
        description: 'Постави ја макарата на висина на очите. Фати ги краевите од јажето со палците насочени наназад, направи чекор назад со стабилен раскорачен став.',
        cue: '💡 Главен совет: Одличен лек против заоблени рамена од седење на компјутер.',
      },
      {
        phase: 'Чекор 2: Влечење кон лицето со надворешна ротација',
        description: 'Влечи го јажето директно кон челото/носот додека ги шири рацете настрана, носејќи ги лактите високо и наназад.',
        cue: '💡 Главен совет: Мисли на правење „двоен бицепс“ поза на крајот од секое повторување.',
      },
      {
        phase: 'Чекор 3: Стекнување на задното рамо',
        description: 'Задржи ја контракцијата 1 цела секунда на најзадната точка и контролирано врати ја тежината.',
        cue: '💡 Главен совет: Користи умерена тежина со фокус на форма, не цимај со телото.',
      },
    ],
  },
  {
    id: 'hanging-leg-raise-demo',
    name: 'Hanging Leg / Knee Raises (Abs)',
    category: 'Core',
    equipment: 'Bodyweight',
    primaryMuscles: ['abdominals'],
    secondaryMuscles: ['hip flexors', 'forearms'],
    hasPhotoDemo: false,
    instructions: [
      'Hang from a pull-up bar with an overhand grip slightly wider than shoulder width.',
      'Depress your shoulders slightly so you are not in a dead hanging shrug.',
      'Without swinging momentum, initiate the movement by curling your pelvis up toward your sternum, lifting straight legs (or bent knees).',
      'Pause for a fraction at peak abdominal contraction, then lower your legs slowly back to the vertical start position.',
    ],
    demonstrationSteps: [
      {
        phase: 'Чекор 1: Стабилно висење без нишање',
        description: 'Зафати го вратилото, затегни ги лопатките за рамениците да не бидат „залепени“ до ушите. Телото е целосно смирено.',
        cue: '💡 Главен совет: Елиминирај го нишањето пред да започнеш.',
      },
      {
        phase: 'Чекор 2: Завртување на карлицата (Pelvic Curl)',
        description: 'Клучот за стомачните е ротација на карлицата нагоре кон градите, а не само кревање на нозете со мускулите на колковите.',
        cue: '💡 Главен совет: Замисли како да сакаш да го покажеш ѓонот од патиките напред.',
      },
      {
        phase: 'Чекор 3: Ексцентрично спуштање',
        description: 'Спуштај ги нозете 2-3 секунди контролирано за максимална микро-траума и зајакнување на длабоките стомачни мускули.',
        cue: '💡 Главен совет: Ако ти е тешко со исправени нозе, свиткај ги колената (Knee Raises).',
      },
    ],
  },
  {
    id: 'bulgarian-split-squat-demo',
    name: 'Bulgarian Split Squat (Rear-Foot Elevated)',
    category: 'Legs',
    equipment: 'Dumbbell',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'calves'],
    hasPhotoDemo: false,
    instructions: [
      'Stand about 2 to 3 feet in front of a sturdy bench. Place the top of one foot laces-down on the bench behind you.',
      'Hold a dumbbell in each hand or use bodyweight. Keep your chest tall and core braced.',
      'Lower your hips straight down by bending the front knee until the back knee hovers just above the floor.',
      'Drive forcefully through the middle and heel of your front foot to return to the starting position.',
    ],
    demonstrationSteps: [
      {
        phase: 'Чекор 1: Позиционирање на задната нога',
        description: 'Застани 60-80cm пред клупата. Постави го задниот гребен од стапалото на клупата. Предното стапало цврсто на под.',
        cue: '💡 Главен совет: Најдобра вежба за симетрија и поправање разлика во сила меѓу лева и десна нога.',
      },
      {
        phase: 'Чекор 2: Вертикално спуштање',
        description: 'Спушти се надолу додека задното колено речиси не го допре подот. Торзото е благо навалено нанапред за повеќе глутеус, или исправено за квадрицепс.',
        cue: '💡 Главен совет: 85% од тежината е секогаш на предната нога.',
      },
      {
        phase: 'Чекор 3: Потисок низ петицата',
        description: 'Притисни силно низ петицата на предната нога и врати се горе без да го заклучиш преагресивно коленото.',
        cue: '💡 Главен совет: Задржи рамнотежа со фокусирање на една точка пред тебе.',
      },
    ],
  },
];

interface ExerciseLibraryProps {
  onAdd: (name: string) => void;
  onSelectForMuscles?: (name: string, muscles: string[]) => void;
}

export default function ExerciseLibrary({ onAdd, onSelectForMuscles }: ExerciseLibraryProps) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const groups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  const category = (muscles: string[]) =>
    muscles.some((m) => ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(m.toLowerCase()))
      ? 'Legs'
      : muscles.some((m) => m.toLowerCase().includes('chest'))
      ? 'Chest'
      : muscles.some((m) => ['lats', 'middle back', 'lower back', 'rear deltoids', 'traps'].includes(m.toLowerCase()))
      ? 'Back'
      : muscles.some((m) => m.toLowerCase().includes('shoulder'))
      ? 'Shoulders'
      : muscles.some((m) => ['abdominals', 'core'].includes(m.toLowerCase()))
      ? 'Core'
      : 'Arms';

  // Merge built-in 18 exercises + expanded demonstration exercises
  const allExercises: ExerciseLibraryItem[] = [
    ...exercises.map((e) => ({
      id: e.id,
      name: e.name,
      category: category(e.primaryMuscles),
      equipment: e.equipment,
      primaryMuscles: e.primaryMuscles,
      secondaryMuscles: e.secondaryMuscles,
      instructions: e.instructions,
      images: e.images,
      hasPhotoDemo: true,
      demonstrationSteps: [
        {
          phase: 'Чекор 1: Почетна форма и сетап',
          description: e.instructions[0] || 'Постави ја правилната позиција според прикажаната слика 1.',
          cue: '💡 Фокусирај се на стабилност и правилно дишење пред секое повторување.',
        },
        {
          phase: 'Чекор 2: Контракција и движење',
          description: e.instructions[1] || e.instructions[2] || 'Изведи ја експлозивната фаза според прикажаната слика 2.',
          cue: '💡 Вдиши при спуштање, издиши силно при напор.',
        },
      ],
    })),
    ...ADDITIONAL_DEMONSTRATION_EXERCISES,
  ];

  const filtered = allExercises.filter(
    (e) =>
      (group === 'All' || e.category === group) &&
      `${e.name} ${e.primaryMuscles.join(' ')} ${e.equipment}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  return (
    <section className="panel exercise-library">
      <div className="section-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#ff792f22',
                color: '#ff9a5e',
                border: '1px solid #ff792f55',
              }}
            >
              EXERCISE ENCYCLOPEDIA &amp; FORM DEMO
            </span>
            <span style={{ fontSize: '11px', color: '#97a28e' }}>
              {allExercises.length} вежби со фото &amp; чекор-по-чекор демонстрации
            </span>
          </div>
          <h2>Библиотека на Вежби со Демонстрација</h2>
          <p>
            Прегледај правилна техника, почетни и завршни позиции, и види ги активираните мускули пред да го започнеш тренингот.
          </p>
        </div>
        <Dumbbell size={26} color="#ff792f" />
      </div>

      <div className="exercise-search">
        <Search size={18} />
        <input
          aria-label="Search exercise library"
          placeholder="Пребарај вежби, мускули (гради, нозе, рамо, грб) или опрема..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="exercise-filters">
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            className={group === g ? 'active' : ''}
            onClick={() => setGroup(g)}
          >
            {g === 'All' ? 'Сите Вежби' : g}
          </button>
        ))}
      </div>

      <div className="exercise-cards">
        {filtered.map((e) => {
          const isExp = expanded === e.id;
          return (
            <article className="exercise-card" key={e.id}>
              {e.hasPhotoDemo && e.images && e.images.length > 0 ? (
                <div className="exercise-photos">
                  {e.images.map((src, i) => (
                    <figure key={src}>
                      <Image
                        src={src}
                        alt={`${e.name}: demonstration position ${i + 1}`}
                        width={280}
                        height={200}
                        style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <figcaption>Позиција {i + 1}</figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    background: '#12140f',
                    border: '1px solid #293021',
                    borderRadius: '8px',
                    padding: '16px',
                    margin: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#ff9a5e', fontWeight: 700, marginBottom: '4px' }}>
                    📖 ЧЕКОР-ПО-ЧЕКОР СТРУЧНА ДЕМОНСТРАЦИЈА
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    Кликни на „Техника &amp; Демо“ подолу за детални чекори на изведба и совети од тренери.
                  </div>
                </div>
              )}

              <div className="exercise-card-content">
                <div className="exercise-meta">
                  {e.category} <span>·</span> {e.equipment || 'Bodyweight'}
                </div>
                <h3>{e.name.replace(' - Medium Grip', '')}</h3>
                <p>🎯 Примарни мускули: <b>{e.primaryMuscles.join(', ')}</b></p>

                <div className="exercise-card-actions">
                  <button
                    className="primary"
                    type="button"
                    onClick={() => {
                      onAdd(e.name);
                      if (onSelectForMuscles) {
                        onSelectForMuscles(e.name, e.primaryMuscles);
                      }
                    }}
                  >
                    <Plus size={16} /> Додај во тренинг
                  </button>

                  {onSelectForMuscles && (
                    <button
                      type="button"
                      onClick={() => onSelectForMuscles(e.name, e.primaryMuscles)}
                      style={{
                        background: '#1d2218',
                        border: '1px solid #36402d',
                        color: '#9ad0d4',
                        fontSize: '11px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Осветли ги мускулите на анатомскиот приказ"
                    >
                      <Activity size={13} /> Осветли Мускули
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpanded(isExp ? null : e.id)}
                    aria-expanded={isExp}
                  >
                    Техника &amp; Демо {isExp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {isExp && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #2a3122' }}>
                    {/* Demonstration phases */}
                    {e.demonstrationSteps && e.demonstrationSteps.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#ff9a5e', letterSpacing: '0.6px', marginBottom: '8px' }}>
                          КЛУЧНИ ФАЗИ НА ДЕМОНСТРАЦИЈА:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {e.demonstrationSteps.map((step, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: '#12140f',
                                border: '1px solid #282f20',
                                borderRadius: '8px',
                                padding: '10px 12px',
                              }}
                            >
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginBottom: '3px' }}>
                                {step.phase}
                              </div>
                              <div style={{ fontSize: '12px', color: '#b5bcae', lineHeight: '1.4' }}>
                                {step.description}
                              </div>
                              <div style={{ fontSize: '11px', color: '#86efac', marginTop: '4px', fontWeight: 600 }}>
                                {step.cue}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#97a28e', marginBottom: '6px' }}>
                      ДЕТАЛНИ ИНСТРУКЦИИ:
                    </div>
                    <ol className="exercise-instructions">
                      {e.instructions.map((instruction, i) => (
                        <li key={i}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!filtered.length && (
        <p style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
          Нема пронајдено вежби за овој поим. Пробајте со друг мускул или име на вежба.
        </p>
      )}

      <p className="fine">
        Демонстративни фотографии и упатства: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">Free Exercise DB</a> · Јавна лиценца. Секогаш загреј се пред секоја работна серија и почитувај ја природната кинематика на зглобовите.
      </p>
    </section>
  );
}
