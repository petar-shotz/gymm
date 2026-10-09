'use client';

import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Trash2,
  Check,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  STRENGTH_EXERCISES,
  evaluateStrengthLevel,
  calculateOneRepMax,
} from '@/lib/strength-standards';

interface PRRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  date: string;
  oneRepMax: number;
  bodyweightAtTimeKg: number;
}

interface PRsSectionProps {
  userBodyweightKg: number;
  userSex: 'male' | 'female';
  onAddWorkoutExercise?: (name: string, weight: number, reps: number) => void;
}

const STORAGE_KEY = 'trainforge_user_personal_records';

export default function PRsSection({
  userBodyweightKg,
  userSex,
  onAddWorkoutExercise,
}: PRsSectionProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    STRENGTH_EXERCISES[0].exerciseId
  );
  const [inputWeightKg, setInputWeightKg] = useState<string>('80');
  const [inputReps, setInputReps] = useState<string>('5');
  const [savedPRs, setSavedPRs] = useState<PRRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    // Default starter PR records
    const bw = Math.max(50, userBodyweightKg || 80);
    return [
      {
        id: 'init-1',
        exerciseId: 'bb-bench-press',
        exerciseName: 'Barbell Bench Press',
        weightKg: Math.round(bw * 1.0),
        reps: 5,
        date: new Date().toISOString().split('T')[0],
        oneRepMax: calculateOneRepMax(Math.round(bw * 1.0), 5),
        bodyweightAtTimeKg: bw,
      },
      {
        id: 'init-2',
        exerciseId: 'bb-squat',
        exerciseName: 'Barbell Back Squat',
        weightKg: Math.round(bw * 1.25),
        reps: 5,
        date: new Date().toISOString().split('T')[0],
        oneRepMax: calculateOneRepMax(Math.round(bw * 1.25), 5),
        bodyweightAtTimeKg: bw,
      },
      {
        id: 'init-3',
        exerciseId: 'bb-deadlift',
        exerciseName: 'Barbell Deadlift (Conventional)',
        weightKg: Math.round(bw * 1.5),
        reps: 5,
        date: new Date().toISOString().split('T')[0],
        oneRepMax: calculateOneRepMax(Math.round(bw * 1.5), 5),
        bodyweightAtTimeKg: bw,
      },
    ];
  });

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const selectedExercise = useMemo(() => {
    return (
      STRENGTH_EXERCISES.find((e) => e.exerciseId === selectedExerciseId) ||
      STRENGTH_EXERCISES[0]
    );
  }, [selectedExerciseId]);

  const numWeight = parseFloat(inputWeightKg) || 0;
  const numReps = parseInt(inputReps, 10) || 1;
  const effectiveBw = Math.max(35, userBodyweightKg || 80);

  // Real-time instantaneous strength assessment
  const currentAssessment = useMemo(() => {
    return evaluateStrengthLevel(
      selectedExercise.exerciseId,
      numWeight,
      numReps,
      effectiveBw,
      userSex
    );
  }, [selectedExercise, numWeight, numReps, effectiveBw, userSex]);

  const saveCurrentPR = () => {
    if (numWeight <= 0) return;
    const oneRep = calculateOneRepMax(numWeight, numReps);
    const newRecord: PRRecord = {
      id: 'pr-' + Date.now(),
      exerciseId: selectedExercise.exerciseId,
      exerciseName: selectedExercise.exerciseName,
      weightKg: numWeight,
      reps: numReps,
      date: new Date().toISOString().split('T')[0],
      oneRepMax: oneRep,
      bodyweightAtTimeKg: effectiveBw,
    };

    setSavedPRs((prev) => {
      // Keep best 1RM or update existing record for this exercise
      const existing = prev.filter((r) => r.exerciseId !== selectedExercise.exerciseId);
      const next = [newRecord, ...existing];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    setSuccessToast(`🏆 Нов PR Зачуван: ${selectedExercise.exerciseName} — ${numWeight}kg x ${numReps} (1RM: ${oneRep}kg)!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const deletePR = (id: string) => {
    setSavedPRs((prev) => {
      const next = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

  const filteredExercises = useMemo(() => {
    if (activeCategoryFilter === 'All') return STRENGTH_EXERCISES;
    return STRENGTH_EXERCISES.filter((e) => e.category === activeCategoryFilter);
  }, [activeCategoryFilter]);

  return (
    <section className="panel" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* HEADER */}
      <div className="section-head" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.8px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: '#ff792f25',
                color: '#ff9a5e',
                border: '1px solid #ff792f55',
              }}
            >
              STRENGTH STANDARDS &amp; PR VAULT
            </span>
            <span style={{ fontSize: '11px', color: '#97a28e' }}>
              Фер споредба со твојата телесна тежина ({effectiveBw} kg · {userSex === 'female' ? 'Жена' : 'Маж'})
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f3f6ee' }}>
            Лични Рекорди (PRs) &amp; Нивоа на Сила
          </h2>
          <p style={{ margin: '4px 0 0', color: '#a0a897', fontSize: '13px' }}>
            Внеси ја тежината што ја креваш за било која вежба. Системот веднаш ја пресметува твојата 1RM (1-Rep Max) сила и прави прецизна клиничка споредба со стандардите: <b>Beginner</b>, <b>Normal</b>, <b>Advanced</b>, <b>Expert</b> и <b>Pro</b>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div
            style={{
              background: '#1d211a',
              border: '1px solid #363d2e',
              padding: '8px 14px',
              borderRadius: '10px',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '10px', color: '#8aa37b', fontWeight: 700 }}>ТЕЛЕСНА ТЕЖИНА</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#e5e7eb' }}>{effectiveBw} kg</div>
          </div>
          <Trophy size={28} color="#fbbf24" />
        </div>
      </div>

      {successToast && (
        <div
          style={{
            background: '#143825',
            border: '1px solid #23734b',
            color: '#86efac',
            padding: '10px 16px',
            borderRadius: '10px',
            marginBottom: '18px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} /> {successToast}
        </div>
      )}

      {/* TOP INTERACTIVE EVALUATOR GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.3fr)',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        {/* INPUT BOX */}
        <div
          style={{
            background: '#181b15',
            border: '1px solid #323a2a',
            borderRadius: '14px',
            padding: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#f3f6ee', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> Избери Вежба и Внеси го Твојот Лифт
          </h3>

          {/* CATEGORY CHIPS */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategoryFilter(c)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: activeCategoryFilter === c ? '#ff792f' : '#22261e',
                  color: activeCategoryFilter === c ? '#ffffff' : '#9ca3af',
                  border: '1px solid ' + (activeCategoryFilter === c ? '#ff792f' : '#333b2c'),
                  cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* EXERCISE SELECTOR */}
          <label style={{ display: 'block', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>Вежба:</span>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              style={{
                width: '100%',
                marginTop: '5px',
                padding: '9px 12px',
                background: '#11130f',
                border: '1px solid #3a4233',
                borderRadius: '8px',
                color: '#f3f6ee',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {filteredExercises.map((ex) => (
                <option key={ex.exerciseId} value={ex.exerciseId}>
                  {ex.exerciseName} ({ex.equipment})
                </option>
              ))}
            </select>
          </label>

          <p style={{ fontSize: '11px', color: '#97a28e', margin: '-6px 0 14px', lineHeight: '1.4' }}>
            {selectedExercise.description}
          </p>

          {/* WEIGHT AND REPS INPUTS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>Тежина (kg):</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setInputWeightKg((w) => String(Math.max(1, (parseFloat(w) || 0) - 5)))}
                    style={{ background: '#22261e', border: '1px solid #363e2d', color: '#9ca3af', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputWeightKg((w) => String((parseFloat(w) || 0) + 5))}
                    style={{ background: '#22261e', border: '1px solid #363e2d', color: '#ff9a5e', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    +5
                  </button>
                </div>
              </div>
              <input
                type="number"
                step="0.5"
                min="1"
                max="600"
                value={inputWeightKg}
                onChange={(e) => setInputWeightKg(e.target.value)}
                placeholder="пр. 100"
                style={{
                  width: '100%',
                  marginTop: '5px',
                  padding: '10px 12px',
                  background: '#11130f',
                  border: '1px solid #3a4233',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>Повторувања (Reps):</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setInputReps((r) => String(Math.max(1, (parseInt(r, 10) || 1) - 1)))}
                    style={{ background: '#22261e', border: '1px solid #363e2d', color: '#9ca3af', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputReps((r) => String((parseInt(r, 10) || 1) + 1))}
                    style={{ background: '#22261e', border: '1px solid #363e2d', color: '#ff9a5e', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    +1
                  </button>
                </div>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                max="60"
                value={inputReps}
                onChange={(e) => setInputReps(e.target.value)}
                placeholder="пр. 5"
                style={{
                  width: '100%',
                  marginTop: '5px',
                  padding: '10px 12px',
                  background: '#11130f',
                  border: '1px solid #3a4233',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              />
            </div>
          </div>

          {/* QUICK REP PRESETS */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#8aa37b', letterSpacing: '0.6px' }}>
              БРЗ ИЗБОР НА ПОВТОРУВАЊА (ВКЛУЧИ И 15+ REPS):
            </span>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
              {[1, 3, 5, 8, 10, 12, 15, 18, 20, 25].map((preset) => {
                const isSelected = numReps === preset;
                const isHighRep = preset >= 15;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setInputReps(String(preset))}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: isSelected ? '#ff792f' : isHighRep ? '#242a1e' : '#181b15',
                      color: isSelected ? '#ffffff' : isHighRep ? '#fde047' : '#9ca3af',
                      border: isSelected ? '1px solid #ff792f' : isHighRep ? '1px solid #65541c' : '1px solid #313829',
                      cursor: 'pointer',
                    }}
                    title={isHighRep ? `${preset} reps — Елитна издржливост (директно тестирање за Expert / Pro)` : `${preset} reps`}
                  >
                    {preset} {preset === 1 ? 'rep' : 'reps'}
                    {isHighRep && !isSelected && ' 🔥'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="primary"
              onClick={saveCurrentPR}
              disabled={numWeight <= 0}
              style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
            >
              <Trophy size={16} /> Зачувај во Мои Рекорди
            </button>
            {onAddWorkoutExercise && (
              <button
                type="button"
                onClick={() => onAddWorkoutExercise(selectedExercise.exerciseName, numWeight, numReps)}
                style={{
                  padding: '10px 14px',
                  background: '#23271f',
                  border: '1px solid #3a4233',
                  borderRadius: '8px',
                  color: '#e5e7eb',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title="Додај во денешниот дневник за вежбање"
              >
                + Во Дневен Тренинг
              </button>
            )}
          </div>
        </div>

        {/* REAL-TIME ASSESSMENT CARD */}
        {currentAssessment ? (
          <div
            style={{
              background: '#181b15',
              border: `1.5px solid ${currentAssessment.levelColor}`,
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: currentAssessment.levelColor + '25',
                      border: `1px solid ${currentAssessment.levelColor}`,
                      color: currentAssessment.levelColor,
                    }}
                  >
                    {currentAssessment.levelLabel.toUpperCase()}
                  </span>
                  <h3 style={{ margin: '8px 0 2px', fontSize: '18px', fontWeight: 800, color: '#f3f6ee' }}>
                    {selectedExercise.exerciseName}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#97a28e' }}>
                    Внесено: <b>{numWeight} kg × {numReps} повт.</b> · Релативен сооднос: <b>{currentAssessment.ratio}x телесна тежина</b>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#8aa37b', fontWeight: 700 }}>ПРОЦЕНЕТ 1RM</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff' }}>
                    {currentAssessment.estimatedOneRepMaxKg} <small style={{ fontSize: '13px', color: '#ff9a5e' }}>kg</small>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '0 0 14px', lineHeight: '1.4' }}>
                {currentAssessment.levelDescription}
              </p>

              {/* PROGRESS BAR TO NEXT LEVEL */}
              {currentAssessment.nextLevelName && currentAssessment.kgNeededForNextLevel !== undefined && (
                <div style={{ marginBottom: '14px', background: '#11130f', padding: '10px 12px', borderRadius: '8px', border: '1px solid #2a3122' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                    <span style={{ color: '#9ca3af' }}>
                      Напредок кон <b>{currentAssessment.nextLevelName}</b>
                    </span>
                    <span style={{ color: '#ff9a5e', fontWeight: 700 }}>
                      Уште +{currentAssessment.kgNeededForNextLevel} kg на 1RM
                    </span>
                  </div>
                  <div style={{ height: '7px', background: '#272b20', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${currentAssessment.progressToNextLevelPercent}%`,
                        background: `linear-gradient(90deg, ${currentAssessment.levelColor}, #ff792f)`,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* THRESHOLD BENCHMARKS TABLE */}
              <div style={{ fontSize: '11px', color: '#97a28e', marginBottom: '4px', fontWeight: 700 }}>
                ПРЕЦИЗНИ НИВОА НА СИЛА ЗА ТВОЈАТА ТЕЖИНА ({effectiveBw} KG):
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '6px',
                  textAlign: 'center',
                }}
              >
                {(
                  [
                    ['Beginner', currentAssessment.thresholds.beginner, '#94a3b8'],
                    ['Normal', currentAssessment.thresholds.normal, '#10b981'],
                    ['Advanced', currentAssessment.thresholds.advanced, '#3b82f6'],
                    ['Expert', currentAssessment.thresholds.expert, '#a855f7'],
                    ['Pro', currentAssessment.thresholds.pro, '#f59e0b'],
                  ] as const
                ).map(([lvl, kg, col]) => {
                  const isCurrent = currentAssessment.level.toLowerCase() === lvl.toLowerCase();
                  return (
                    <div
                      key={lvl}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '6px',
                        background: isCurrent ? col + '30' : '#11130f',
                        border: isCurrent ? `1.5px solid ${col}` : '1px solid #282f22',
                      }}
                    >
                      <div style={{ fontSize: '10px', color: col, fontWeight: 700 }}>{lvl}</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {kg} kg
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

              {/* PRO CELEBRATION OR EXPERT PROGRESSION BANNER */}
              {currentAssessment.level === 'pro' ? (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #78350f, #451a03)',
                    border: '1.5px solid #f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Trophy size={24} color="#fde047" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fef08a' }}>
                      🏆 ОСТВАРЕНО PRO (ЕЛИИТНО) НИВО НА СИЛА!
                    </div>
                    <div style={{ fontSize: '11px', color: '#fef3c7' }}>
                      Твојата пресметана 1RM елита ({currentAssessment.estimatedOneRepMaxKg} kg / {currentAssessment.ratio}x телесна тежина) те сместува во најсилните 1% спортисти!
                    </div>
                  </div>
                </div>
              ) : currentAssessment.level === 'expert' ? (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#2e106525',
                    border: '1px solid #a855f755',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    color: '#e9d5ff',
                  }}
                >
                  <Sparkles size={16} color="#c084fc" />
                  <div>
                    <strong>Моментално си во Expert класа!</strong> Зголемување на повторувањата (15+ повт.) или уште +{currentAssessment.kgNeededForNextLevel} kg на 1RM веднаш те унапредува во <b>Pro (Елитно)</b> ниво!
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: '12px', fontSize: '10px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={12} /> Пресметано според Brzycki/Epley спортски формули за 1RM сила. Додавањето повеќе повторувања (вклучително и над 15) динамички ја зголемува твојата 1RM проекција и овозможува напредување од Expert кон Pro!
              </div>
          </div>
        ) : null}
      </div>

      {/* SAVED USER PRs VAULT */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#f3f6ee', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#ff792f" /> Твој Трезор на Рекорди ({savedPRs.length})
          </h3>
          <span style={{ fontSize: '12px', color: '#97a28e' }}>
            Секој запис ја чува тежината, повторувањата и пресметаната максимална сила
          </span>
        </div>

        {savedPRs.length === 0 ? (
          <div
            style={{
              padding: '30px',
              textAlign: 'center',
              background: '#161813',
              borderRadius: '12px',
              border: '1px solid #2c3324',
              color: '#9ca3af',
              fontSize: '13px',
            }}
          >
            Немаш сеуште зачувано лични рекорди. Внеси го твојот најдобар лифт погоре и кликни „Зачувај во Мои Рекорди“!
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '14px',
            }}
          >
            {savedPRs.map((record) => {
              const evalRes = evaluateStrengthLevel(
                record.exerciseId,
                record.weightKg,
                record.reps,
                record.bodyweightAtTimeKg || effectiveBw,
                userSex
              );
              const color = evalRes ? evalRes.levelColor : '#10b981';
              const label = evalRes ? evalRes.levelLabel : 'PR';

              return (
                <div
                  key={record.id}
                  style={{
                    background: '#181b15',
                    border: '1px solid #333b2a',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '8px',
                          background: color + '22',
                          color: color,
                          border: `1px solid ${color}66`,
                        }}
                      >
                        {label.split('(')[0].trim().toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => deletePR(record.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        title="Избриши рекорд"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                      {record.exerciseName}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: '#ff9a5e' }}>
                        {record.weightKg} kg
                      </span>
                      <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                        × {record.reps} {record.reps === 1 ? 'rep' : 'reps'}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#97a28e', display: 'flex', justifyContent: 'space-between' }}>
                      <span>1RM Проекција: <strong style={{ color: '#ffffff' }}>{record.oneRepMax} kg</strong></span>
                      <span>Датум: {record.date}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #272d20', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#8aa37b' }}>
                      {evalRes ? `${evalRes.ratio}x телесна тежина` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExerciseId(record.exerciseId);
                        setInputWeightKg(String(record.weightKg));
                        setInputReps(String(record.reps));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff9a5e',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Прегледај / Ажурирај ↗
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
