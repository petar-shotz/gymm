'use client';

import React, { useState, useMemo } from 'react';
import {
  Target,
  Sparkles,
  Check,
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowRight,
} from 'lucide-react';
import {
  FITNESS_PLANS,
  PlanGoal,
  calculateOptimizedPlanNutrition,
  OptimizedPlanResult,
} from '@/lib/plans-config';

interface PlansSectionProps {
  currentWeightKg: number;
  currentSex: 'male' | 'female';
  currentCalories: number;
  currentProtein?: number;
  currentCarbs?: number;
  currentFat?: number;
  currentWaterMl?: number;
  onApplyPlan: (optimized: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
    planName: string;
  }) => void;
}

export default function PlansSection({
  currentWeightKg,
  currentSex,
  currentCalories,
  onApplyPlan,
}: PlansSectionProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanGoal>('maintain');
  const [userWeightInput, setUserWeightInput] = useState<string>(
    String(currentWeightKg || 80)
  );
  const [userSex, setUserSex] = useState<'male' | 'female'>(currentSex || 'male');
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  const numWeight = parseFloat(userWeightInput) || currentWeightKg || 80;

  // Compute optimized nutrition goals dynamically
  const optimizedResult: OptimizedPlanResult = useMemo(() => {
    return calculateOptimizedPlanNutrition(
      selectedPlanId,
      numWeight,
      userSex,
      currentCalories > 1200 ? currentCalories : undefined
    );
  }, [selectedPlanId, numWeight, userSex, currentCalories]);

  const handleApply = () => {
    onApplyPlan({
      calories: optimizedResult.targetCalories,
      protein: optimizedResult.proteinGrams,
      carbs: optimizedResult.carbsGrams,
      fat: optimizedResult.fatGrams,
      water: optimizedResult.recommendedWaterMl,
      planName: optimizedResult.plan.nameMk,
    });

    setAppliedToast(
      `🎯 Успешно примен планот „${optimizedResult.plan.nameMk}“! Твоите нутритивни цели се оптимизирани: ${optimizedResult.targetCalories} kcal · ${optimizedResult.proteinGrams}g Протеин · ${optimizedResult.carbsGrams}g ЈХ (со препорака макс ${optimizedResult.sugarGramsTarget}g шеќер) · ${optimizedResult.fatGrams}g Масти · ${optimizedResult.recommendedWaterMl} ml Вода.`
    );
    setTimeout(() => setAppliedToast(null), 6000);
  };

  return (
    <section className="panel" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* SECTION HEADER */}
      <div className="section-head" style={{ marginBottom: '22px' }}>
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
              PRECISION NUTRITION PLANS
            </span>
            <span style={{ fontSize: '11px', color: '#97a28e' }}>
              Клинички научно калибрирани цели според телесна тежина
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f3f6ee' }}>
            Избери Твој План: Maintain, Cut или Bulk
          </h2>
          <p style={{ margin: '4px 0 0', color: '#a0a897', fontSize: '13px' }}>
            Избери помеѓу <b>Maintain (Одржување)</b>, <b>Cut (Умерен)</b>, <b>Aggressive Cut (Брзо топење)</b>, <b>Bulk (Чиста маса)</b> или <b>Aggressive Bulk (Максимална тежина)</b>. Внеси ја твојата телесна тежина и системот веднаш ќе ги пресмета и оптимизира твоите калории, протеини, јаглехидрати, шеќери и вода за најдобри резултати.
          </p>
        </div>
        <Target size={30} color="#ff792f" />
      </div>

      {appliedToast && (
        <div
          style={{
            background: '#143825',
            border: '1px solid #23734b',
            color: '#86efac',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={18} /> {appliedToast}
        </div>
      )}

      {/* BODYWEIGHT & SEX CALIBRATOR BAR */}
      <div
        style={{
          background: '#181b15',
          border: '1px solid #333b2a',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              ⚖️ Твоја Телесна Тежина (Bodyweight):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                step="0.1"
                min="35"
                max="250"
                value={userWeightInput}
                onChange={(e) => setUserWeightInput(e.target.value)}
                style={{
                  width: '95px',
                  padding: '8px 12px',
                  background: '#11130f',
                  border: '1px solid #3a4233',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 800,
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#97a28e' }}>kg</span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              Пол (Биолошки сооднос):
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setUserSex('male')}
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: userSex === 'male' ? '#ff792f' : '#22261e',
                  color: userSex === 'male' ? '#ffffff' : '#9ca3af',
                  border: '1px solid ' + (userSex === 'male' ? '#ff792f' : '#333b2a'),
                  cursor: 'pointer',
                }}
              >
                Маж (Male)
              </button>
              <button
                type="button"
                onClick={() => setUserSex('female')}
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: userSex === 'female' ? '#ff792f' : '#22261e',
                  color: userSex === 'female' ? '#ffffff' : '#9ca3af',
                  border: '1px solid ' + (userSex === 'female' ? '#ff792f' : '#333b2a'),
                  cursor: 'pointer',
                }}
              >
                Жена (Female)
              </button>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#97a28e', maxWidth: '380px' }}>
          💡 Промената на тежината автоматски ги рекалкулира сите протеински, јаглехидратни, шеќерни и водени цели во реално време!
        </div>
      </div>

      {/* 5 PLAN CARDS SELECTOR */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {FITNESS_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              style={{
                background: isSelected ? '#1c2219' : '#171914',
                border: isSelected ? `2px solid ${plan.color}` : '1px solid #2e3526',
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '8px',
                      background: plan.color + '22',
                      color: plan.color,
                      border: `1px solid ${plan.color}55`,
                    }}
                  >
                    {plan.badge}
                  </span>
                  {isSelected && <Check size={16} color={plan.color} />}
                </div>

                <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#f3f6ee' }}>
                  {plan.nameMk.split('(')[0].trim()}
                </h4>

                <div style={{ fontSize: '11px', color: '#a0a897', lineHeight: '1.4', marginBottom: '10px' }}>
                  {plan.expectedWeightChangeDescMk}
                </div>
              </div>

              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: plan.calorieAdjustmentPercent > 0 ? '#ff9a5e' : plan.calorieAdjustmentPercent < 0 ? '#67e8f9' : '#86efac',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  paddingTop: '8px',
                  borderTop: '1px solid #282f22',
                }}
              >
                {plan.calorieAdjustmentPercent > 0 ? (
                  <TrendingUp size={14} />
                ) : plan.calorieAdjustmentPercent < 0 ? (
                  <TrendingDown size={14} />
                ) : (
                  <Minus size={14} />
                )}
                {plan.calorieAdjustmentPercent === 0
                  ? 'Балансирани калории (0%)'
                  : `${plan.calorieAdjustmentPercent > 0 ? '+' : ''}${plan.calorieAdjustmentPercent}% калориски сооднос`}
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED OPTIMIZATION BREAKDOWN */}
      <div
        style={{
          background: '#181b15',
          border: `1.5px solid ${optimizedResult.plan.color}`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: optimizedResult.plan.color + '25',
                  color: optimizedResult.plan.color,
                  border: `1px solid ${optimizedResult.plan.color}`,
                }}
              >
                АКТИВЕН ИЗБОР: {optimizedResult.plan.badge.toUpperCase()}
              </span>
              <span style={{ fontSize: '12px', color: '#97a28e' }}>
                Тежина: <b>{optimizedResult.bodyweightKg} kg</b>
              </span>
            </div>
            <h3 style={{ margin: '8px 0 4px', fontSize: '20px', fontWeight: 800, color: '#f3f6ee' }}>
              {optimizedResult.plan.nameMk}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', maxWidth: '780px', lineHeight: '1.4' }}>
              {optimizedResult.plan.descriptionMk}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#8aa37b', fontWeight: 700 }}>ОПТИМИЗИРАНА ДНЕВНА ЦЕЛ</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff' }}>
              {optimizedResult.targetCalories} <small style={{ fontSize: '15px', color: '#ff9a5e' }}>kcal</small>
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              {optimizedResult.calorieDelta > 0
                ? `+${optimizedResult.calorieDelta} kcal вишок`
                : optimizedResult.calorieDelta < 0
                ? `${optimizedResult.calorieDelta} kcal дефицит`
                : 'Точно на TDEE ниво'}
            </div>
          </div>
        </div>

        {/* 4 MACRONUTRIENT & WATER TARGET CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          {/* PROTEIN */}
          <div
            style={{
              background: '#121410',
              border: '1px solid #2d3625',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#ff9a5e', fontWeight: 700 }}>ПРОТЕИН (PROTEIN)</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
              {optimizedResult.proteinGrams} <small style={{ fontSize: '13px', color: '#ff9a5e' }}>g</small>
            </div>
            <div style={{ fontSize: '11px', color: '#97a28e' }}>
              {optimizedResult.plan.proteinPerKg}g по kg телесна тежина ({optimizedResult.breakdown.proteinPercent}% од калориите)
            </div>
          </div>

          {/* CARBS WITH SUGAR HIGHLIGHT (USER EXPLICIT REQUIREMENT) */}
          <div
            style={{
              background: '#121410',
              border: '1px solid #2d3625',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#67e8f9', fontWeight: 700 }}>ЈАГЛЕХИДРАТИ &amp; ШЕЌЕРИ</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
              {optimizedResult.carbsGrams} <small style={{ fontSize: '13px', color: '#67e8f9' }}>g</small>
            </div>
            {/* EXPLICIT SUGAR BREAKDOWN */}
            <div
              style={{
                fontSize: '11px',
                color: '#fef08a',
                background: '#713f1230',
                border: '1px solid #854d0e55',
                padding: '4px 8px',
                borderRadius: '6px',
                marginTop: '4px',
                fontWeight: 600,
              }}
            >
              🍬 Од нив макс шеќери: <b>{optimizedResult.sugarGramsTarget}g</b> ({optimizedResult.sugarGramsPerCarbPercent}% од ЈХ)
            </div>
          </div>

          {/* FATS */}
          <div
            style={{
              background: '#121410',
              border: '1px solid #2d3625',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>ЗДРАВИ МАСТИ (FAT)</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
              {optimizedResult.fatGrams} <small style={{ fontSize: '13px', color: '#f59e0b' }}>g</small>
            </div>
            <div style={{ fontSize: '11px', color: '#97a28e' }}>
              {optimizedResult.plan.fatPerKg}g по kg за хормонски баланс ({optimizedResult.breakdown.fatPercent}%)
            </div>
          </div>

          {/* WATER */}
          <div
            style={{
              background: '#121410',
              border: '1px solid #2d3625',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#8bb9bc', fontWeight: 700 }}>ПРЕПОРАЧАНА ВОДА</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
              {optimizedResult.recommendedWaterMl} <small style={{ fontSize: '13px', color: '#8bb9bc' }}>ml</small>
            </div>
            <div style={{ fontSize: '11px', color: '#97a28e' }}>
              {optimizedResult.recommendedWaterGlasses} чаши (по 250ml) · {optimizedResult.plan.hydrationMultiplierMlPerKg} ml/kg
            </div>
          </div>
        </div>

        {/* GUIDANCE & ACTION ROW */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            paddingTop: '16px',
            borderTop: '1px solid #2c3424',
          }}
        >
          <div style={{ fontSize: '12px', color: '#97a28e', maxWidth: '650px' }}>
            🏋️ <b>Препорака за тренинг:</b> {optimizedResult.plan.resistanceFrequency} · 🏃 {optimizedResult.plan.recommendedCardioSessions}.
          </div>

          <button
            type="button"
            className="primary"
            onClick={handleApply}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={16} /> Примени го Овој План на Мојот Профил <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
