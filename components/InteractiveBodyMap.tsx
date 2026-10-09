'use client';

import React, { useState } from 'react';

export interface MuscleHighlightMap {
  [muscleGroup: string]: {
    active: boolean;
    color: string;
    label: string;
  };
}

interface MuscleMapProps {
  activeMuscles?: string[]; // e.g. ['Chest', 'Triceps'] or specific muscle names
  selectedExerciseName?: string;
  onMuscleClick?: (muscle: string) => void;
}

// Distinct vibrant color palette for each muscle group
export const MUSCLE_PALETTE: Record<string, { fill: string; stroke: string; glow: string; label: string; group: string }> = {
  Chest: { fill: '#ef4444', stroke: '#fca5a5', glow: '#ef4444', label: 'Градни Мускули (Pectoralis Major)', group: 'Upper Body Push' },
  'Upper Chest': { fill: '#f87171', stroke: '#fecaca', glow: '#f87171', label: 'Горен Дел Гради (Clavicular Head)', group: 'Upper Body Push' },
  'Lower Chest': { fill: '#dc2626', stroke: '#f87171', glow: '#dc2626', label: 'Долен Дел Гради (Sternal Head)', group: 'Upper Body Push' },
  Lats: { fill: '#3b82f6', stroke: '#93c5fd', glow: '#3b82f6', label: 'Широк Грб / Латс (Latissimus Dorsi)', group: 'Upper Body Pull' },
  'Middle Back': { fill: '#2563eb', stroke: '#bfdbfe', glow: '#2563eb', label: 'Среден Грб & Ромбоиди (Rhomboids)', group: 'Upper Body Pull' },
  'Lower Back': { fill: '#1d4ed8', stroke: '#93c5fd', glow: '#1d4ed8', label: 'Долен Грб (Erector Spinae)', group: 'Posterior Chain' },
  Traps: { fill: '#8b5cf6', stroke: '#c4b5fd', glow: '#8b5cf6', label: 'Трапез (Trapezius)', group: 'Back & Neck' },
  Shoulders: { fill: '#f97316', stroke: '#fdba74', glow: '#f97316', label: 'Рамена (Deltoids)', group: 'Shoulders' },
  'Front Delts': { fill: '#fb923c', stroke: '#fed7aa', glow: '#fb923c', label: 'Предно Рамо (Anterior Deltoid)', group: 'Shoulders' },
  'Lateral Delts': { fill: '#f97316', stroke: '#fdba74', glow: '#f97316', label: 'Странично Рамо (Lateral Deltoid)', group: 'Shoulders' },
  'Rear Delts': { fill: '#ea580c', stroke: '#fdba74', glow: '#ea580c', label: 'Задно Рамо (Posterior Deltoid)', group: 'Shoulders' },
  Biceps: { fill: '#10b981', stroke: '#6ee7b7', glow: '#10b981', label: 'Бицепс (Biceps Brachii)', group: 'Arms' },
  Triceps: { fill: '#06b6d4', stroke: '#67e8f9', glow: '#06b6d4', label: 'Трицепс (Triceps Brachii)', group: 'Arms' },
  Forearms: { fill: '#14b8a6', stroke: '#5eead4', glow: '#14b8a6', label: 'Подлактици (Brachioradialis & Flexors)', group: 'Arms' },
  Abs: { fill: '#eab308', stroke: '#fef08a', glow: '#eab308', label: 'Стомачни Мускули (Rectus Abdominis)', group: 'Core' },
  Obliques: { fill: '#f59e0b', stroke: '#fde68a', glow: '#f59e0b', label: 'Коси Стомачни (External Obliques)', group: 'Core' },
  Quadriceps: { fill: '#ec4899', stroke: '#fbcfe8', glow: '#ec4899', label: 'Квадрицепс (Vastus Medialis & Lateralis)', group: 'Legs' },
  Hamstrings: { fill: '#d946ef', stroke: '#f5d0fe', glow: '#d946ef', label: 'Задна Ложа (Biceps Femoris & Semitendinosus)', group: 'Legs' },
  Glutes: { fill: '#a855f7', stroke: '#e9d5ff', glow: '#a855f7', label: 'Глутеус (Gluteus Maximus)', group: 'Legs' },
  Calves: { fill: '#6366f1', stroke: '#c7d2fe', glow: '#6366f1', label: 'Листови (Gastrocnemius & Soleus)', group: 'Legs' },
};

/**
 * Maps raw exercise names/strings to primary active muscle keys
 */
export function getMusclesForExercise(exerciseName: string, primaryMuscle?: string): string[] {
  const norm = (exerciseName + ' ' + (primaryMuscle || '')).toLowerCase();
  const set = new Set<string>();

  if (norm.includes('bench') || norm.includes('chest') || norm.includes('pushup') || norm.includes('pec') || norm.includes('fly')) {
    set.add('Chest');
    set.add('Triceps');
    set.add('Front Delts');
    if (norm.includes('incline')) set.add('Upper Chest');
    if (norm.includes('decline') || norm.includes('dip')) set.add('Lower Chest');
  }
  if (norm.includes('squat') || norm.includes('leg press') || norm.includes('hack squat') || norm.includes('lunge') || norm.includes('quad')) {
    set.add('Quadriceps');
    set.add('Glutes');
    if (norm.includes('squat')) set.add('Abs');
  }
  if (norm.includes('deadlift') || norm.includes('rdl') || norm.includes('good morning')) {
    set.add('Hamstrings');
    set.add('Glutes');
    set.add('Lower Back');
    set.add('Traps');
    set.add('Forearms');
  }
  if (norm.includes('pullup') || norm.includes('chinup') || norm.includes('lat') || norm.includes('pulldown')) {
    set.add('Lats');
    set.add('Biceps');
    set.add('Middle Back');
  }
  if (norm.includes('row')) {
    set.add('Middle Back');
    set.add('Lats');
    set.add('Biceps');
    set.add('Rear Delts');
    set.add('Traps');
  }
  if (norm.includes('overhead') || norm.includes('ohp') || norm.includes('military') || norm.includes('shoulder')) {
    set.add('Shoulders');
    set.add('Front Delts');
    set.add('Triceps');
    set.add('Traps');
  }
  if (norm.includes('lateral raise')) {
    set.add('Lateral Delts');
    set.add('Shoulders');
  }
  if (norm.includes('rear delt') || norm.includes('face pull')) {
    set.add('Rear Delts');
    set.add('Traps');
  }
  if (norm.includes('bicep') || norm.includes('curl')) {
    if (norm.includes('leg curl') || norm.includes('hamstring curl')) {
      set.add('Hamstrings');
    } else {
      set.add('Biceps');
      set.add('Forearms');
    }
  }
  if (norm.includes('tricep') || norm.includes('pushdown') || norm.includes('skull crusher') || norm.includes('dip') || norm.includes('close-grip')) {
    set.add('Triceps');
    if (norm.includes('dip')) set.add('Lower Chest');
  }
  if (norm.includes('calf') || norm.includes('calves')) {
    set.add('Calves');
  }
  if (norm.includes('crunch') || norm.includes('plank') || norm.includes('leg raise') || norm.includes('abs') || norm.includes('situp')) {
    set.add('Abs');
    if (norm.includes('russian') || norm.includes('plank') || norm.includes('woodchopper') || norm.includes('oblique')) {
      set.add('Obliques');
    }
  }
  if (norm.includes('shrug')) {
    set.add('Traps');
  }
  if (norm.includes('hip thrust') || norm.includes('glute')) {
    set.add('Glutes');
    set.add('Hamstrings');
  }

  // Fallback to primary muscle
  if (set.size === 0 && primaryMuscle) {
    if (primaryMuscle.includes('Chest')) set.add('Chest');
    else if (primaryMuscle.includes('Back')) set.add('Middle Back');
    else if (primaryMuscle.includes('Legs') || primaryMuscle.includes('Quad')) set.add('Quadriceps');
    else if (primaryMuscle.includes('Hamstring')) set.add('Hamstrings');
    else if (primaryMuscle.includes('Shoulder')) set.add('Shoulders');
    else if (primaryMuscle.includes('Bicep')) set.add('Biceps');
    else if (primaryMuscle.includes('Tricep')) set.add('Triceps');
    else if (primaryMuscle.includes('Core') || primaryMuscle.includes('Ab')) set.add('Abs');
    else if (primaryMuscle.includes('Calf')) set.add('Calves');
  }

  return Array.from(set);
}

export default function InteractiveBodyMap({
  activeMuscles = [],
  selectedExerciseName,
  onMuscleClick,
}: MuscleMapProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  const isMuscleActive = (keys: string[]): { active: boolean; color: string; stroke: string; label: string } => {
    for (const k of keys) {
      if (
        activeMuscles.some(
          (m) =>
            m.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(m.toLowerCase())
        )
      ) {
        const item = MUSCLE_PALETTE[k] || { fill: '#ff792f', stroke: '#fed7aa', label: k };
        return { active: true, color: item.fill, stroke: item.stroke, label: item.label };
      }
    }
    return { active: false, color: '#272d22', stroke: '#3f4937', label: '' };
  };

  const chestStatus = isMuscleActive(['Chest', 'Upper Chest', 'Lower Chest']);
  const frontDeltsStatus = isMuscleActive(['Front Delts', 'Shoulders']);
  const lateralDeltsStatus = isMuscleActive(['Lateral Delts', 'Shoulders']);
  const rearDeltsStatus = isMuscleActive(['Rear Delts', 'Shoulders']);
  const bicepsStatus = isMuscleActive(['Biceps']);
  const tricepsStatus = isMuscleActive(['Triceps']);
  const forearmsStatus = isMuscleActive(['Forearms']);
  const absStatus = isMuscleActive(['Abs']);
  const obliquesStatus = isMuscleActive(['Obliques']);
  const quadsStatus = isMuscleActive(['Quadriceps']);
  const hamstringsStatus = isMuscleActive(['Hamstrings']);
  const glutesStatus = isMuscleActive(['Glutes']);
  const calvesStatus = isMuscleActive(['Calves']);
  const trapsStatus = isMuscleActive(['Traps']);
  const latsStatus = isMuscleActive(['Lats', 'Middle Back']);
  const lowerBackStatus = isMuscleActive(['Lower Back']);

  const handleHover = (muscle: string | null) => {
    setHoveredMuscle(muscle);
  };

  const handleClick = (muscle: string) => {
    if (onMuscleClick) onMuscleClick(muscle);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #161a13 0%, #11140f 100%)',
        border: '1px solid #333d2b',
        borderRadius: '16px',
        padding: '22px',
        color: '#e5e7eb',
        position: 'relative',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.8px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#ff792f25',
                color: '#ff9a5e',
                border: '1px solid #ff792f44',
              }}
            >
              HUMAN ANATOMY ATLAS
            </span>
            <span style={{ fontSize: '11px', color: '#97a88e' }}>
              Анатомски приказ со слободни раце и 2 нозе (Front &amp; Back)
            </span>
          </div>
          <h3
            style={{
              margin: '4px 0 0',
              fontSize: '18px',
              fontWeight: 800,
              color: '#f3f6ee',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🧬</span> Интерактивна Човечка Мускулна Анатомија
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#97a28e' }}>
            {selectedExerciseName ? (
              <span>
                Активирани мускулни зони за:{' '}
                <strong style={{ color: '#ff9a5e', fontSize: '13px' }}>
                  {selectedExerciseName}
                </strong>
              </span>
            ) : (
              'Избери вежба од тренингот за динамички да се осветлат ангажираните мускули во различна боја.'
            )}
          </p>
        </div>

        {/* ACTIVE MUSCLE CHIPS */}
        {activeMuscles.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              maxWidth: '460px',
              justifyContent: 'flex-end',
            }}
          >
            {activeMuscles.map((m) => {
              const pal = MUSCLE_PALETTE[m] || { fill: '#ff792f', label: m };
              return (
                <span
                  key={m}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '12px',
                    background: pal.fill + '25',
                    border: `1.5px solid ${pal.fill}`,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: `0 0 10px ${pal.fill}44`,
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: pal.fill,
                      boxShadow: `0 0 6px ${pal.fill}`,
                    }}
                  />
                  {pal.label.split('(')[0].trim()}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK PRESET BUTTONS FOR IMMEDIATE VISUAL TESTING */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          marginBottom: '16px',
          padding: '8px 12px',
          background: '#0e110c',
          borderRadius: '10px',
          border: '1px solid #23291d',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#8aa37b', letterSpacing: '0.6px' }}>
          БРЗ ТЕСТ НА МУСКУЛИ:
        </span>
        {[
          { label: 'Гради & Трицепс (Bench)', ex: 'Barbell Bench Press' },
          { label: 'Широк Грб & Бицепс (Pull-Up)', ex: 'Pull-Up' },
          { label: 'Квадрицепс & Глутеус (Squat)', ex: 'Barbell Back Squat' },
          { label: 'Задна Ложа & Трапез (Deadlift)', ex: 'Barbell Deadlift' },
          { label: 'Рамена & Трицепс (OHP)', ex: 'Standing Overhead Press' },
          { label: 'Стомачни Мускули (Abs)', ex: 'Hanging Leg Raise' },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              handleClick(item.ex);
            }}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              background: selectedExerciseName === item.ex ? '#ff792f' : '#1b2016',
              color: selectedExerciseName === item.ex ? '#ffffff' : '#b2bbab',
              border: '1px solid ' + (selectedExerciseName === item.ex ? '#ff792f' : '#2e3725'),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {hoveredMuscle && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            right: '24px',
            zIndex: 10,
            background: 'rgba(23, 27, 20, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid #ff792f',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#ffffff',
            boxShadow: '0 6px 16px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        >
          🔍 {hoveredMuscle}
        </div>
      )}

      {/* ANATOMICAL SVG CONTAINER: FRONT BODY & BACK BODY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at 50% 40%, #1b2117 0%, #0c0e0a 100%)',
          borderRadius: '14px',
          padding: '24px 14px',
          border: '1px solid #283020',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
        }}
      >
        {/* ========================================================= */}
        {/* FRONT HUMAN ANATOMY (ANTERIOR VIEW) */}
        {/* ========================================================= */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#9cb58e',
              letterSpacing: '1.2px',
              marginBottom: '12px',
            }}
          >
            ПРЕДНА АНАТОМИЈА (ANTERIOR VIEW)
          </div>

          <svg
            viewBox="0 0 280 520"
            style={{
              width: '100%',
              maxWidth: '280px',
              height: 'auto',
              margin: '0 auto',
              display: 'block',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.75))',
            }}
          >
            <defs>
              <filter id="humanGlowFront" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComponentTransfer in="blur" result="boost">
                  <feFuncA type="linear" slope="1.8" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode in="boost" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <radialGradient id="headVolumeFront" cx="45%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#37412e" />
                <stop offset="70%" stopColor="#242b1e" />
                <stop offset="100%" stopColor="#181d14" />
              </radialGradient>
            </defs>

            {/* REALISTIC HUMAN HEAD, EARS, JAW & CHIN (CENTERED AT X=140) */}
            <path
              d="M 140 18 
                 C 153 18, 160 26, 159 40 
                 C 159 48, 156 56, 152 62 
                 C 148 67, 144 69, 140 69 
                 C 136 69, 132 67, 128 62 
                 C 124 56, 121 48, 121 40 
                 C 120 26, 127 18, 140 18 Z"
              fill="url(#headVolumeFront)"
              stroke="#43503a"
              strokeWidth="1.2"
            />
            {/* Ears (Left & Right) */}
            <path d="M 121 38 C 118 40, 117 48, 120 52 C 121 50, 121 42, 121 38 Z" fill="#2b3324" stroke="#43503a" strokeWidth="1" />
            <path d="M 159 38 C 162 40, 163 48, 160 52 C 159 50, 159 42, 159 38 Z" fill="#2b3324" stroke="#43503a" strokeWidth="1" />
            {/* Facial anatomical markers */}
            <path d="M 132 36 Q 140 34 148 36" stroke="#1c2217" strokeWidth="1.2" fill="none" opacity="0.6" />
            <path d="M 140 36 L 140 48 L 143 48" stroke="#1c2217" strokeWidth="1.1" fill="none" opacity="0.6" />
            <path d="M 136 54 Q 140 56 144 54" stroke="#1c2217" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M 128 55 Q 140 67 152 55" stroke="#191e14" strokeWidth="1.3" fill="none" opacity="0.8" />

            {/* NECK & STERNOCLEIDOMASTOID COLUMNS */}
            <path d="M 133 67 L 132 82 L 148 82 L 147 67 Z" fill="#272d20" stroke="#3a4431" strokeWidth="0.8" />
            <path d="M 132 68 Q 135 76 138 83 M 148 68 Q 145 76 142 83" stroke="#191e14" strokeWidth="1.2" fill="none" />
            <ellipse cx="140" cy="83" rx="2.5" ry="1.5" fill="#151911" />

            {/* TRAPEZIUS (ANTERIOR SLOPES) */}
            <path
              d="M 133 67 
                 C 137 73, 143 73, 147 67 
                 L 168 82 
                 C 158 85, 146 86, 140 86 
                 C 134 86, 122 85, 112 82 Z"
              fill={trapsStatus.active ? trapsStatus.color : '#282f22'}
              stroke={trapsStatus.active ? trapsStatus.stroke : '#3d4834'}
              strokeWidth={trapsStatus.active ? 2 : 1}
              filter={trapsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Traps')}
              onMouseEnter={() => handleHover('Трапез (Trapezius) - Горен дел')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Trapezius (Трапез)</title>
            </path>

            {/* CLAVICLES (Collarbone S-curves) */}
            <path d="M 140 84 C 132 82, 122 81, 112 82 M 140 84 C 148 82, 158 81, 168 82" stroke="#181d13" strokeWidth="2.2" fill="none" />

            {/* DELTOIDS (SHOULDERS - WRAPPING NATURAL ANGLE) */}
            {/* Left Deltoid */}
            <path
              d="M 112 82 
                 C 98 84, 84 95, 80 112 
                 C 77 125, 84 135, 96 138 
                 C 101 126, 108 112, 111 98 
                 C 112 91, 112 84, 112 82 Z"
              fill={
                frontDeltsStatus.active || lateralDeltsStatus.active
                  ? frontDeltsStatus.active ? frontDeltsStatus.color : lateralDeltsStatus.color
                  : '#282f22'
              }
              stroke={
                frontDeltsStatus.active || lateralDeltsStatus.active
                  ? frontDeltsStatus.active ? frontDeltsStatus.stroke : lateralDeltsStatus.stroke
                  : '#3d4834'
              }
              strokeWidth={frontDeltsStatus.active || lateralDeltsStatus.active ? 2 : 1}
              filter={frontDeltsStatus.active || lateralDeltsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Shoulders')}
              onMouseEnter={() => handleHover('Рамена / Предно и Странично Рамо (Deltoids)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Left Deltoid (Лево Рамо)</title>
            </path>
            {/* Right Deltoid */}
            <path
              d="M 168 82 
                 C 182 84, 196 95, 200 112 
                 C 203 125, 196 135, 184 138 
                 C 179 126, 172 112, 169 98 
                 C 168 91, 168 84, 168 82 Z"
              fill={
                frontDeltsStatus.active || lateralDeltsStatus.active
                  ? frontDeltsStatus.active ? frontDeltsStatus.color : lateralDeltsStatus.color
                  : '#282f22'
              }
              stroke={
                frontDeltsStatus.active || lateralDeltsStatus.active
                  ? frontDeltsStatus.active ? frontDeltsStatus.stroke : lateralDeltsStatus.stroke
                  : '#3d4834'
              }
              strokeWidth={frontDeltsStatus.active || lateralDeltsStatus.active ? 2 : 1}
              filter={frontDeltsStatus.active || lateralDeltsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Shoulders')}
              onMouseEnter={() => handleHover('Рамена / Предно и Странично Рамо (Deltoids)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Right Deltoid (Десно Рамо)</title>
            </path>

            {/* PECTORALIS MAJOR (CHEST - CLAVICULAR & STERNAL PLATES) */}
            {/* Left Pectoral */}
            <path
              d="M 113 83 
                 C 122 85, 134 86, 139 86 
                 L 139 135 
                 C 132 138, 116 137, 105 128 
                 C 103 118, 108 100, 113 83 Z"
              fill={chestStatus.active ? chestStatus.color : '#2c3324'}
              stroke={chestStatus.active ? chestStatus.stroke : '#424d37'}
              strokeWidth={chestStatus.active ? 2 : 1}
              filter={chestStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Chest')}
              onMouseEnter={() => handleHover('Градни Мускули (Pectoralis Major - Лево)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Pectoralis Major (Гради Лево)</title>
            </path>
            {/* Right Pectoral */}
            <path
              d="M 167 83 
                 C 158 85, 146 86, 141 86 
                 L 141 135 
                 C 148 138, 164 137, 175 128 
                 C 177 118, 172 100, 167 83 Z"
              fill={chestStatus.active ? chestStatus.color : '#2c3324'}
              stroke={chestStatus.active ? chestStatus.stroke : '#424d37'}
              strokeWidth={chestStatus.active ? 2 : 1}
              filter={chestStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Chest')}
              onMouseEnter={() => handleHover('Градни Мускули (Pectoralis Major - Десно)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Pectoralis Major (Гради Десно)</title>
            </path>
            {/* Sternum Center Groove */}
            <line x1="140" y1="86" x2="140" y2="136" stroke="#141810" strokeWidth="2" />
            <path d="M 107 127 C 118 137, 132 137, 139 135" stroke="#161b11" strokeWidth="1.6" fill="none" />
            <path d="M 173 127 C 162 137, 148 137, 141 135" stroke="#161b11" strokeWidth="1.6" fill="none" />

            {/* SERRATUS ANTERIOR (LATERAL RIBS) */}
            <path d="M 103 140 C 107 143, 110 148, 108 152 M 105 153 C 109 156, 112 161, 110 165 M 108 166 C 112 169, 115 174, 113 178" stroke="#181d13" strokeWidth="1.5" fill="none" />
            <path d="M 177 140 C 173 143, 170 148, 172 152 M 175 153 C 171 156, 168 161, 170 165 M 172 166 C 168 169, 165 174, 167 178" stroke="#181d13" strokeWidth="1.5" fill="none" />

            {/* BICEPS BRACHII (ARMS FLARED OUTWARD AWAY FROM BODY) */}
            {/* Left Bicep: angled outwards to X=60 */}
            <path
              d="M 94 138 
                 C 82 148, 72 168, 66 186 
                 C 74 190, 84 186, 92 172 
                 C 98 160, 99 146, 94 138 Z"
              fill={bicepsStatus.active ? bicepsStatus.color : '#2a3223'}
              stroke={bicepsStatus.active ? bicepsStatus.stroke : '#414d36'}
              strokeWidth={bicepsStatus.active ? 2 : 1}
              filter={bicepsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Biceps')}
              onMouseEnter={() => handleHover('Бицепс (Biceps Brachii)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Biceps Brachii (Бицепс)</title>
            </path>
            {/* Right Bicep: angled outwards to X=220 */}
            <path
              d="M 186 138 
                 C 198 148, 208 168, 214 186 
                 C 206 190, 196 186, 188 172 
                 C 182 160, 181 146, 186 138 Z"
              fill={bicepsStatus.active ? bicepsStatus.color : '#2a3223'}
              stroke={bicepsStatus.active ? bicepsStatus.stroke : '#414d36'}
              strokeWidth={bicepsStatus.active ? 2 : 1}
              filter={bicepsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Biceps')}
              onMouseEnter={() => handleHover('Бицепс (Biceps Brachii)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Biceps Brachii (Бицепс)</title>
            </path>

            {/* FOREARMS (ANGLED OUTWARD IN ATHLETIC A-POSE) */}
            {/* Left Forearm */}
            <path
              d="M 66 188 
                 C 56 206, 46 234, 42 260 
                 L 52 263 
                 C 60 238, 72 212, 76 190 Z"
              fill={forearmsStatus.active ? forearmsStatus.color : '#282f21'}
              stroke={forearmsStatus.active ? forearmsStatus.stroke : '#3c4733'}
              strokeWidth={forearmsStatus.active ? 2 : 1}
              filter={forearmsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Forearms')}
              onMouseEnter={() => handleHover('Подлактици (Forearms / Brachioradialis)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Forearms (Подлактици)</title>
            </path>
            {/* Right Forearm */}
            <path
              d="M 214 188 
                 C 224 206, 234 234, 238 260 
                 L 228 263 
                 C 220 238, 208 212, 204 190 Z"
              fill={forearmsStatus.active ? forearmsStatus.color : '#282f21'}
              stroke={forearmsStatus.active ? forearmsStatus.stroke : '#3c4733'}
              strokeWidth={forearmsStatus.active ? 2 : 1}
              filter={forearmsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Forearms')}
              onMouseEnter={() => handleHover('Подлактици (Forearms / Brachioradialis)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Forearms (Подлактици)</title>
            </path>

            {/* HANDS (ANGLED CLEAR OF TORSO) */}
            <path d="M 42 262 C 37 272, 33 286, 34 296 C 39 296, 44 284, 50 265 Z" fill="#262d1f" stroke="#3a4431" strokeWidth="1" />
            <path d="M 238 262 C 243 272, 247 286, 246 296 C 241 296, 236 284, 230 265 Z" fill="#262d1f" stroke="#3a4431" strokeWidth="1" />

            {/* RECTUS ABDOMINIS (6-PACK) */}
            {/* Upper Abs */}
            <path
              d="M 123 140 C 123 138, 138 138, 138 140 L 138 158 C 134 160, 125 160, 123 158 Z"
              fill={absStatus.active ? absStatus.color : '#293022'}
              stroke={absStatus.active ? absStatus.stroke : '#3e4935'}
              strokeWidth={absStatus.active ? 1.8 : 1}
              filter={absStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Abs')}
              onMouseEnter={() => handleHover('Стомачни Мускули - Горен Сектор (Upper Abs)')}
              onMouseLeave={() => handleHover(null)}
            />
            <path
              d="M 142 140 C 142 138, 157 138, 157 140 L 157 158 C 155 160, 146 160, 142 158 Z"
              fill={absStatus.active ? absStatus.color : '#293022'}
              stroke={absStatus.active ? absStatus.stroke : '#3e4935'}
              strokeWidth={absStatus.active ? 1.8 : 1}
              filter={absStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Abs')}
              onMouseEnter={() => handleHover('Стомачни Мускули - Горен Сектор (Upper Abs)')}
              onMouseLeave={() => handleHover(null)}
            />

            {/* Middle Abs */}
            <path
              d="M 124 162 L 138 162 L 138 181 C 134 183, 125 183, 124 181 Z"
              fill={absStatus.active ? absStatus.color : '#293022'}
              stroke={absStatus.active ? absStatus.stroke : '#3e4935'}
              strokeWidth={absStatus.active ? 1.8 : 1}
              filter={absStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Abs')}
              onMouseEnter={() => handleHover('Стомачни Мускули - Среден Сектор (Mid Abs)')}
              onMouseLeave={() => handleHover(null)}
            />
            <path
              d="M 142 162 L 156 162 L 156 181 C 155 183, 146 183, 142 181 Z"
              fill={absStatus.active ? absStatus.color : '#293022'}
              stroke={absStatus.active ? absStatus.stroke : '#3e4935'}
              strokeWidth={absStatus.active ? 1.8 : 1}
              filter={absStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Abs')}
              onMouseEnter={() => handleHover('Стомачни Мускули - Среден Сектор (Mid Abs)')}
              onMouseLeave={() => handleHover(null)}
            />

            {/* Lower Abs */}
            <path
              d="M 125 185 L 138 185 L 138 206 C 132 208, 127 205, 125 197 Z"
              fill={absStatus.active ? absStatus.color : '#293022'}
              stroke={absStatus.active ? absStatus.stroke : '#3e4935'}
              strokeWidth={absStatus.active ? 1.8 : 1}
              filter={absStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Abs')}
              onMouseEnter={() => handleHover('Стомачни Мускули - Долен Сектор (Lower Abs)')}
              onMouseLeave={() => handleHover(null)}
            />
            <path
              d="M 142 185 L 155 185 L 155 197 C 153 205, 148 208, 142 206 Z"
              fill={absStatus.active ? absStatus.color : '#293022'}
              stroke={absStatus.active ? absStatus.stroke : '#3e4935'}
              strokeWidth={absStatus.active ? 1.8 : 1}
              filter={absStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Abs')}
              onMouseEnter={() => handleHover('Стомачни Мускули - Долен Сектор (Lower Abs)')}
              onMouseLeave={() => handleHover(null)}
            />
            {/* Linea Alba & Navel */}
            <line x1="140" y1="138" x2="140" y2="208" stroke="#13170e" strokeWidth="2.2" />
            <ellipse cx="140" cy="192" rx="1.5" ry="2" fill="#11140d" />

            {/* EXTERNAL OBLIQUES */}
            {/* Left Oblique */}
            <path
              d="M 108 136 
                 C 115 152, 120 176, 123 202 
                 L 115 201 
                 C 107 178, 103 154, 108 136 Z"
              fill={obliquesStatus.active ? obliquesStatus.color : '#282f21'}
              stroke={obliquesStatus.active ? obliquesStatus.stroke : '#3c4734'}
              strokeWidth={obliquesStatus.active ? 2 : 1}
              filter={obliquesStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Obliques')}
              onMouseEnter={() => handleHover('Коси Стомачни Мускули (External Obliques)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>External Obliques (Коси Стомачни)</title>
            </path>
            {/* Right Oblique */}
            <path
              d="M 172 136 
                 C 165 152, 160 176, 157 202 
                 L 165 201 
                 C 173 178, 177 154, 172 136 Z"
              fill={obliquesStatus.active ? obliquesStatus.color : '#282f21'}
              stroke={obliquesStatus.active ? obliquesStatus.stroke : '#3c4734'}
              strokeWidth={obliquesStatus.active ? 2 : 1}
              filter={obliquesStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Obliques')}
              onMouseEnter={() => handleHover('Коси Стомачни Мускули (External Obliques)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>External Obliques (Коси Стомачни)</title>
            </path>

            {/* PELVIS / GROIN CREASE */}
            <path d="M 122 204 Q 140 234 158 204" stroke="#161b11" strokeWidth="2" fill="none" />

            {/* ======================================================== */}
            {/* EXACTLY TWO LEGS (LEFT LEG & RIGHT LEG - NO DUPLICATES) */}
            {/* ======================================================== */}

            {/* LEFT LEG: QUADRICEPS (THIGH) */}
            <path
              d="M 118 232 
                 C 103 252, 94 286, 102 334 
                 C 108 344, 117 344, 122 342 
                 C 128 340, 134 326, 136 290 
                 C 137 264, 133 244, 126 232 Z"
              fill={quadsStatus.active ? quadsStatus.color : '#2b3323'}
              stroke={quadsStatus.active ? quadsStatus.stroke : '#424e36'}
              strokeWidth={quadsStatus.active ? 2 : 1}
              filter={quadsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Quadriceps')}
              onMouseEnter={() => handleHover('Квадрицепс / Предна Ложа (Quads - Vastus Medialis & Lateralis)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Quadriceps (Квадрицепс Лево)</title>
            </path>

            {/* RIGHT LEG: QUADRICEPS (THIGH) */}
            <path
              d="M 162 232 
                 C 177 252, 186 286, 178 334 
                 C 172 344, 163 344, 158 342 
                 C 152 340, 146 326, 144 290 
                 C 143 264, 147 244, 154 232 Z"
              fill={quadsStatus.active ? quadsStatus.color : '#2b3323'}
              stroke={quadsStatus.active ? quadsStatus.stroke : '#424e36'}
              strokeWidth={quadsStatus.active ? 2 : 1}
              filter={quadsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Quadriceps')}
              onMouseEnter={() => handleHover('Квадрицепс / Предна Ложа (Quads - Vastus Medialis & Lateralis)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Quadriceps (Квадрицепс Десно)</title>
            </path>

            {/* KNEECAPS (PATELLA) */}
            <ellipse cx="113" cy="350" rx="7.5" ry="8.5" fill="#242b1d" stroke="#3b4632" strokeWidth="1.2" />
            <path d="M 113 358 L 113 366" stroke="#1c2217" strokeWidth="2.2" />
            <ellipse cx="167" cy="350" rx="7.5" ry="8.5" fill="#242b1d" stroke="#3b4632" strokeWidth="1.2" />
            <path d="M 167 358 L 167 366" stroke="#1c2217" strokeWidth="2.2" />

            {/* LEFT LEG: CALF & SHIN */}
            <path
              d="M 106 364 
                 C 97 386, 97 420, 107 458 
                 L 117 458 
                 C 122 422, 122 386, 119 364 Z"
              fill={calvesStatus.active ? calvesStatus.color : '#272d1f'}
              stroke={calvesStatus.active ? calvesStatus.stroke : '#3b4631'}
              strokeWidth={calvesStatus.active ? 2 : 1}
              filter={calvesStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Calves')}
              onMouseEnter={() => handleHover('Листови & Предна Голеница (Calves & Tibialis Anterior)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Calves (Лист Лево)</title>
            </path>

            {/* RIGHT LEG: CALF & SHIN */}
            <path
              d="M 174 364 
                 C 183 386, 183 420, 173 458 
                 L 163 458 
                 C 158 422, 158 386, 161 364 Z"
              fill={calvesStatus.active ? calvesStatus.color : '#272d1f'}
              stroke={calvesStatus.active ? calvesStatus.stroke : '#3b4631'}
              strokeWidth={calvesStatus.active ? 2 : 1}
              filter={calvesStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Calves')}
              onMouseEnter={() => handleHover('Листови & Предна Голеница (Calves & Tibialis Anterior)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Calves (Лист Десно)</title>
            </path>

            {/* LEFT & RIGHT FEET */}
            <path d="M 105 460 C 103 470, 99 486, 94 492 L 116 492 C 118 482, 118 470, 117 460 Z" fill="#252b1e" stroke="#394430" strokeWidth="1.2" />
            <circle cx="105" cy="466" r="2.5" fill="#303828" />

            <path d="M 175 460 C 177 470, 181 486, 186 492 L 164 492 C 162 482, 162 470, 163 460 Z" fill="#252b1e" stroke="#394430" strokeWidth="1.2" />
            <circle cx="175" cy="466" r="2.5" fill="#303828" />
          </svg>
        </div>

        {/* ========================================================= */}
        {/* BACK HUMAN ANATOMY (POSTERIOR VIEW) */}
        {/* ========================================================= */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#9cb58e',
              letterSpacing: '1.2px',
              marginBottom: '12px',
            }}
          >
            ЗАДНА АНАТОМИЈА (POSTERIOR VIEW)
          </div>

          <svg
            viewBox="0 0 280 520"
            style={{
              width: '100%',
              maxWidth: '280px',
              height: 'auto',
              margin: '0 auto',
              display: 'block',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.75))',
            }}
          >
            {/* OCCIPITAL VAULT & BACK OF HEAD */}
            <path
              d="M 140 18 
                 C 153 18, 160 26, 159 40 
                 C 159 48, 156 56, 152 62 
                 C 148 67, 144 69, 140 69 
                 C 136 69, 132 67, 128 62 
                 C 124 56, 121 48, 121 40 
                 C 120 26, 127 18, 140 18 Z"
              fill="url(#headVolumeFront)"
              stroke="#43503a"
              strokeWidth="1.2"
            />
            <path d="M 130 46 Q 140 48 150 46" stroke="#1c2217" strokeWidth="1.2" fill="none" opacity="0.6" />
            <path d="M 121 38 C 118 40, 117 48, 120 52 C 121 50, 121 42, 121 38 Z" fill="#2b3324" stroke="#43503a" strokeWidth="1" />
            <path d="M 159 38 C 162 40, 163 48, 160 52 C 159 50, 159 42, 159 38 Z" fill="#2b3324" stroke="#43503a" strokeWidth="1" />

            {/* TRAPEZIUS DIAMOND (EXTENDING FROM SKULL TO T12) */}
            <path
              d="M 140 68 
                 L 168 82 
                 L 158 124 
                 L 140 156 
                 L 122 124 
                 L 112 82 Z"
              fill={trapsStatus.active ? trapsStatus.color : '#293122'}
              stroke={trapsStatus.active ? trapsStatus.stroke : '#3f4b36'}
              strokeWidth={trapsStatus.active ? 2 : 1}
              filter={trapsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Traps')}
              onMouseEnter={() => handleHover('Трапез - Комплетен грбен дијамант (Trapezius)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Trapezius (Трапез)</title>
            </path>

            {/* REAR DELTOIDS */}
            {/* Left Rear Delt */}
            <path
              d="M 112 82 
                 C 98 84, 84 95, 80 112 
                 C 77 125, 84 135, 96 138 
                 C 101 126, 108 112, 111 98 
                 C 112 91, 112 84, 112 82 Z"
              fill={
                rearDeltsStatus.active || lateralDeltsStatus.active
                  ? rearDeltsStatus.active ? rearDeltsStatus.color : lateralDeltsStatus.color
                  : '#282f22'
              }
              stroke={
                rearDeltsStatus.active || lateralDeltsStatus.active
                  ? rearDeltsStatus.active ? rearDeltsStatus.stroke : lateralDeltsStatus.stroke
                  : '#3d4834'
              }
              strokeWidth={rearDeltsStatus.active || lateralDeltsStatus.active ? 2 : 1}
              filter={rearDeltsStatus.active || lateralDeltsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Rear Delts')}
              onMouseEnter={() => handleHover('Задно Рамо (Rear Deltoids)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Rear Deltoid (Задно Рамо)</title>
            </path>
            {/* Right Rear Delt */}
            <path
              d="M 168 82 
                 C 182 84, 196 95, 200 112 
                 C 203 125, 196 135, 184 138 
                 C 179 126, 172 112, 169 98 
                 C 168 91, 168 84, 168 82 Z"
              fill={
                rearDeltsStatus.active || lateralDeltsStatus.active
                  ? rearDeltsStatus.active ? rearDeltsStatus.color : lateralDeltsStatus.color
                  : '#282f22'
              }
              stroke={
                rearDeltsStatus.active || lateralDeltsStatus.active
                  ? rearDeltsStatus.active ? rearDeltsStatus.stroke : lateralDeltsStatus.stroke
                  : '#3d4834'
              }
              strokeWidth={rearDeltsStatus.active || lateralDeltsStatus.active ? 2 : 1}
              filter={rearDeltsStatus.active || lateralDeltsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Rear Delts')}
              onMouseEnter={() => handleHover('Задно Рамо (Rear Deltoids)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Rear Deltoid (Задно Рамо)</title>
            </path>

            {/* TRICEPS BRACHII (POSTERIOR ARMS FLARED OUTWARD) */}
            {/* Left Tricep */}
            <path
              d="M 94 138 
                 C 82 148, 72 168, 66 186 
                 C 74 190, 84 186, 92 172 
                 C 98 160, 99 146, 94 138 Z"
              fill={tricepsStatus.active ? tricepsStatus.color : '#282f21'}
              stroke={tricepsStatus.active ? tricepsStatus.stroke : '#3d4834'}
              strokeWidth={tricepsStatus.active ? 2 : 1}
              filter={tricepsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Triceps')}
              onMouseEnter={() => handleHover('Трицепс (Triceps Brachii - Horseshoe)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Triceps Brachii (Трицепс)</title>
            </path>
            {/* Right Tricep */}
            <path
              d="M 186 138 
                 C 198 148, 208 168, 214 186 
                 C 206 190, 196 186, 188 172 
                 C 182 160, 181 146, 186 138 Z"
              fill={tricepsStatus.active ? tricepsStatus.color : '#282f21'}
              stroke={tricepsStatus.active ? tricepsStatus.stroke : '#3d4834'}
              strokeWidth={tricepsStatus.active ? 2 : 1}
              filter={tricepsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Triceps')}
              onMouseEnter={() => handleHover('Трицепс (Triceps Brachii - Horseshoe)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Triceps Brachii (Трицепс)</title>
            </path>

            {/* POSTERIOR FOREARMS (ANGLED OUTWARD) */}
            <path d="M 66 188 C 56 206, 46 234, 42 260 L 52 263 C 60 238, 72 212, 76 190 Z" fill={forearmsStatus.active ? forearmsStatus.color : '#282f21'} stroke={forearmsStatus.active ? forearmsStatus.stroke : '#3c4733'} strokeWidth={forearmsStatus.active ? 2 : 1} filter={forearmsStatus.active ? 'url(#humanGlowFront)' : undefined} style={{ transition: 'all 0.3s ease', cursor: 'pointer' }} onClick={() => handleClick('Forearms')} />
            <path d="M 214 188 C 224 206, 234 234, 238 260 L 228 263 C 220 238, 208 212, 204 190 Z" fill={forearmsStatus.active ? forearmsStatus.color : '#282f21'} stroke={forearmsStatus.active ? forearmsStatus.stroke : '#3c4733'} strokeWidth={forearmsStatus.active ? 2 : 1} filter={forearmsStatus.active ? 'url(#humanGlowFront)' : undefined} style={{ transition: 'all 0.3s ease', cursor: 'pointer' }} onClick={() => handleClick('Forearms')} />

            {/* HANDS (POSTERIOR) */}
            <path d="M 42 262 C 37 272, 33 286, 34 296 C 39 296, 44 284, 50 265 Z" fill="#262d1f" stroke="#3a4431" strokeWidth="1" />
            <path d="M 238 262 C 243 272, 247 286, 246 296 C 241 296, 236 284, 230 265 Z" fill="#262d1f" stroke="#3a4431" strokeWidth="1" />

            {/* LATISSIMUS DORSI (LATS - V-TAPER WINGS) */}
            {/* Left Lat */}
            <path
              d="M 123 125 
                 C 112 138, 104 154, 104 175 
                 C 104 194, 114 206, 127 212 
                 L 135 184 
                 L 139 157 Z"
              fill={latsStatus.active ? latsStatus.color : '#2b3323'}
              stroke={latsStatus.active ? latsStatus.stroke : '#414e36'}
              strokeWidth={latsStatus.active ? 2 : 1}
              filter={latsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Lats')}
              onMouseEnter={() => handleHover('Широк Грб / Латс (Latissimus Dorsi - V-Taper)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Latissimus Dorsi (Латс Лево)</title>
            </path>
            {/* Right Lat */}
            <path
              d="M 157 125 
                 C 168 138, 176 154, 176 175 
                 C 176 194, 166 206, 153 212 
                 L 145 184 
                 L 141 157 Z"
              fill={latsStatus.active ? latsStatus.color : '#2b3323'}
              stroke={latsStatus.active ? latsStatus.stroke : '#414e36'}
              strokeWidth={latsStatus.active ? 2 : 1}
              filter={latsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Lats')}
              onMouseEnter={() => handleHover('Широк Грб / Латс (Latissimus Dorsi - V-Taper)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Latissimus Dorsi (Латс Десно)</title>
            </path>

            {/* LOWER BACK (ERECTOR SPINAE) */}
            <path d="M 132 184 L 138 158 L 138 218 L 130 216 Z" fill={lowerBackStatus.active ? lowerBackStatus.color : '#282f21'} stroke={lowerBackStatus.active ? lowerBackStatus.stroke : '#3d4834'} strokeWidth={lowerBackStatus.active ? 1.8 : 1} filter={lowerBackStatus.active ? 'url(#humanGlowFront)' : undefined} style={{ transition: 'all 0.3s ease', cursor: 'pointer' }} onClick={() => handleClick('Lower Back')} />
            <path d="M 148 184 L 142 158 L 142 218 L 150 216 Z" fill={lowerBackStatus.active ? lowerBackStatus.color : '#282f21'} stroke={lowerBackStatus.active ? lowerBackStatus.stroke : '#3d4834'} strokeWidth={lowerBackStatus.active ? 1.8 : 1} filter={lowerBackStatus.active ? 'url(#humanGlowFront)' : undefined} style={{ transition: 'all 0.3s ease', cursor: 'pointer' }} onClick={() => handleClick('Lower Back')} />
            <line x1="140" y1="156" x2="140" y2="220" stroke="#12150e" strokeWidth="2.2" />

            {/* GLUTEUS MAXIMUS (GLUTES) */}
            {/* Left Glute */}
            <path
              d="M 118 218 
                 C 107 234, 103 256, 112 278 
                 C 124 282, 135 272, 139 254 
                 L 139 220 
                 L 126 218 Z"
              fill={glutesStatus.active ? glutesStatus.color : '#2c3424'}
              stroke={glutesStatus.active ? glutesStatus.stroke : '#435037'}
              strokeWidth={glutesStatus.active ? 2 : 1}
              filter={glutesStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Glutes')}
              onMouseEnter={() => handleHover('Глутеус (Gluteus Maximus)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Gluteus Maximus (Глутеус Лево)</title>
            </path>
            {/* Right Glute */}
            <path
              d="M 162 218 
                 C 173 234, 177 256, 168 278 
                 C 156 282, 145 272, 141 254 
                 L 141 220 
                 L 154 218 Z"
              fill={glutesStatus.active ? glutesStatus.color : '#2c3424'}
              stroke={glutesStatus.active ? glutesStatus.stroke : '#435037'}
              strokeWidth={glutesStatus.active ? 2 : 1}
              filter={glutesStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Glutes')}
              onMouseEnter={() => handleHover('Глутеус (Gluteus Maximus)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Gluteus Maximus (Глутеус Десно)</title>
            </path>
            <line x1="140" y1="220" x2="140" y2="272" stroke="#12160e" strokeWidth="2.2" />

            {/* ======================================================== */}
            {/* EXACTLY TWO LEGS: POSTERIOR HAMSTRINGS & CALVES */}
            {/* ======================================================== */}

            {/* LEFT LEG: HAMSTRINGS */}
            <path
              d="M 112 280 
                 C 106 302, 105 325, 110 346 
                 L 128 346 
                 C 134 325, 134 302, 138 280 Z"
              fill={hamstringsStatus.active ? hamstringsStatus.color : '#293122'}
              stroke={hamstringsStatus.active ? hamstringsStatus.stroke : '#3f4c35'}
              strokeWidth={hamstringsStatus.active ? 2 : 1}
              filter={hamstringsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Hamstrings')}
              onMouseEnter={() => handleHover('Задна Ложа (Hamstrings / Biceps Femoris)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Hamstrings (Задна Ложа Лево)</title>
            </path>

            {/* RIGHT LEG: HAMSTRINGS */}
            <path
              d="M 168 280 
                 C 174 302, 175 325, 170 346 
                 L 152 346 
                 C 146 302, 146 325, 142 280 Z"
              fill={hamstringsStatus.active ? hamstringsStatus.color : '#293122'}
              stroke={hamstringsStatus.active ? hamstringsStatus.stroke : '#3f4c35'}
              strokeWidth={hamstringsStatus.active ? 2 : 1}
              filter={hamstringsStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Hamstrings')}
              onMouseEnter={() => handleHover('Задна Ложа (Hamstrings / Biceps Femoris)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Hamstrings (Задна Ложа Десно)</title>
            </path>

            {/* BACK OF KNEE CREASES */}
            <path d="M 108 350 Q 119 356 130 350" stroke="#161b11" strokeWidth="2" fill="none" />
            <path d="M 150 350 Q 161 356 172 350" stroke="#161b11" strokeWidth="2" fill="none" />

            {/* LEFT LEG: CALVES (POSTERIOR) */}
            <path
              d="M 108 356 
                 C 96 382, 96 418, 106 456 
                 L 116 456 
                 C 123 418, 123 382, 127 356 Z"
              fill={calvesStatus.active ? calvesStatus.color : '#282f21'}
              stroke={calvesStatus.active ? calvesStatus.stroke : '#3d4833'}
              strokeWidth={calvesStatus.active ? 2 : 1}
              filter={calvesStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Calves')}
              onMouseEnter={() => handleHover('Листови (Calves / Gastrocnemius)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Gastrocnemius (Лист Лево)</title>
            </path>

            {/* RIGHT LEG: CALVES (POSTERIOR) */}
            <path
              d="M 172 356 
                 C 184 382, 184 418, 174 456 
                 L 164 456 
                 C 157 418, 157 382, 153 356 Z"
              fill={calvesStatus.active ? calvesStatus.color : '#282f21'}
              stroke={calvesStatus.active ? calvesStatus.stroke : '#3d4833'}
              strokeWidth={calvesStatus.active ? 2 : 1}
              filter={calvesStatus.active ? 'url(#humanGlowFront)' : undefined}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => handleClick('Calves')}
              onMouseEnter={() => handleHover('Листови (Calves / Gastrocnemius)')}
              onMouseLeave={() => handleHover(null)}
            >
              <title>Gastrocnemius (Лист Десно)</title>
            </path>

            {/* ACHILLES TENDONS & HEELS */}
            <path d="M 107 458 L 116 458 L 113 488 L 103 488 Z" fill="#242a1d" stroke="#38432f" strokeWidth="1.2" />
            <ellipse cx="108" cy="488" rx="5" ry="3" fill="#2c3424" />
            <path d="M 173 458 L 164 458 L 167 488 L 177 488 Z" fill="#242a1d" stroke="#38432f" strokeWidth="1.2" />
            <ellipse cx="172" cy="488" rx="5" ry="3" fill="#2c3424" />
          </svg>
        </div>
      </div>

      {/* FOOTER TIP */}
      <div
        style={{
          marginTop: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '11px',
          color: '#84937b',
        }}
      >
        <div>
          💡 <b>Совет:</b> Кликни директно на било кој мускул за да видиш детални информации или одбери вежба од каталогот за прецизно осветлување на ангажираните мускулни групи.
        </div>
        <div style={{ color: '#ff9a5e', fontWeight: 600 }}>
          {activeMuscles.length > 0 ? `${activeMuscles.length} активни мускулни зони` : 'Подготвено за селекција'}
        </div>
      </div>
    </div>
  );
}
