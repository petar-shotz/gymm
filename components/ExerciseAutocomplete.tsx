'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  searchExercises,
  type ExerciseItem,
} from '@/lib/exercise-catalog';
import { Dumbbell, Search, Check, ChevronRight, Sparkles } from 'lucide-react';

interface ExerciseAutocompleteProps {
  value: string;
  onChange: (name: string, defaultSets?: number, defaultReps?: number) => void;
  userHistoryExercises?: string[];
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
}

export function ExerciseAutocomplete({
  value,
  onChange,
  userHistoryExercises = [],
  placeholder = 'Type letters to search, e.g. Bench, Squat, Curl, Deadlift, RDL…',
  autoFocus = false,
  required = false,
}: ExerciseAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Cardio'];

  // Search results based on typed letters
  const matches = useMemo(() => {
    const rawMatches = searchExercises(value, userHistoryExercises, 16);
    if (selectedCategory === 'All') {
      return rawMatches;
    }
    return rawMatches.filter((e) => e.category === selectedCategory);
  }, [value, userHistoryExercises, selectedCategory]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: ExerciseItem) => {
    onChange(item.name, item.defaultSets, item.defaultReps);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < matches.length) {
        e.preventDefault();
        handleSelect(matches[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Helper to highlight matching letters in the exercise name
  const renderHighlightedName = (name: string, query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return <span>{name}</span>;

    const regex = new RegExp(`(${cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = name.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              style={{
                background: '#ff792f',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: '2px',
                padding: '0 2px',
              }}
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const isExactMatch = matches.some(
    (m) => m.name.toLowerCase() === value.trim().toLowerCase()
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            paddingLeft: '34px',
            paddingRight: value ? '32px' : '10px',
            fontWeight: 500,
          }}
        />
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '11px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#8b9385',
            pointerEvents: 'none',
          }}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear exercise search"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#8b9385',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '12px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#181b16',
            border: '1px solid #3d4634',
            borderRadius: '10px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
            zIndex: 9999,
            maxHeight: '320px',
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {/* Category Filter Pills inside dropdown */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '6px',
              borderBottom: '1px solid #282f23',
            }}
          >
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(cat);
                }}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: selectedCategory === cat ? '#ff792f' : '#232720',
                  color: selectedCategory === cat ? '#ffffff' : '#a0a897',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? '#ff792f' : '#343b2d',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: selectedCategory === cat ? 700 : 500,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results Summary Header */}
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.6px',
              color: '#8a9282',
              fontWeight: 600,
              padding: '2px 6px 6px',
              textTransform: 'uppercase',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>
              {value.trim()
                ? `Exercises matching "${value.trim()}" (${matches.length})`
                : `Suggested movements (${matches.length})`}
            </span>
            <span style={{ fontSize: '9px', color: '#687060', textTransform: 'none' }}>
              ↑↓ arrows to navigate · Enter to pick
            </span>
          </div>

          {/* Exercise Suggestions Items */}
          {matches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {matches.map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                const isCurrentValue = item.name.toLowerCase() === value.trim().toLowerCase();

                return (
                  <button
                    type="button"
                    key={item.id}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: isHighlighted
                        ? '#2b3325'
                        : isCurrentValue
                          ? '#21291d'
                          : 'transparent',
                      border: '1px solid',
                      borderColor: isHighlighted
                        ? '#4a573e'
                        : isCurrentValue
                          ? '#3b4632'
                          : 'transparent',
                      color: '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: isHighlighted ? '#ff792f' : '#23291f',
                          color: isHighlighted ? '#ffffff' : '#ff985d',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Dumbbell size={14} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#f0f4ea',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {renderHighlightedName(item.name, value)}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#8e9686',
                            marginTop: '1px',
                            display: 'flex',
                            gap: '6px',
                            alignItems: 'center',
                          }}
                        >
                          <span>{item.category}</span>
                          <span>·</span>
                          <span>{item.primaryMuscle}</span>
                          {item.equipment && (
                            <>
                              <span>·</span>
                              <span style={{ color: '#97b189' }}>{item.equipment}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                      {isCurrentValue && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#86efac',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontWeight: 600,
                          }}
                        >
                          <Check size={12} /> Selected
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '11px',
                          color: isHighlighted ? '#ffa566' : '#6b7264',
                        }}
                      >
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: '14px 10px',
                textAlign: 'center',
                color: '#a0a897',
                fontSize: '12px',
              }}
            >
              <p style={{ margin: '0 0 6px 0' }}>
                No standard exercise starting with &quot;{value}&quot;
              </p>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  onChange(value.trim());
                  setIsOpen(false);
                }}
                style={{
                  fontSize: '11px',
                  padding: '5px 12px',
                  margin: '4px auto 0',
                }}
              >
                Log &quot;{value.trim()}&quot; as custom exercise
              </button>
            </div>
          )}

          {/* Quick Custom Reminder if user typed letters not fully identical */}
          {value.trim() && !isExactMatch && matches.length > 0 && (
            <div
              style={{
                marginTop: '8px',
                padding: '6px 10px',
                borderRadius: '6px',
                background: '#20241b',
                border: '1px solid #333a2a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#b0b8a6',
              }}
            >
              <span>
                Want to keep exact text <b>&quot;{value.trim()}&quot;</b>?
              </span>
              <button
                type="button"
                onClick={() => {
                  onChange(value.trim());
                  setIsOpen(false);
                }}
                style={{
                  fontSize: '10px',
                  padding: '3px 7px',
                  background: '#2c3426',
                  color: '#e4ece0',
                  border: '1px solid #434e3a',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Use Custom
              </button>
            </div>
          )}
        </div>
      )}

      {/* Helper quick hint below input when suggestions closed */}
      {!isOpen && value && (
        <div style={{ marginTop: '4px', fontSize: '11px', color: '#889180', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={11} color="#ff985d" />
          <span>Click input to see matching movements or change selection</span>
        </div>
      )}
    </div>
  );
}
