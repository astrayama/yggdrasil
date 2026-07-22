"use client";

import React, { useState } from "react";
import { EMOTIONS, type Emotion } from "@/lib/emotions";
import { getMoodLabel } from "@/lib/moodLabel";

export interface MoodState {
  polarity: number;
  intensity: number;
  label: string;
}

interface MoodSlidersProps {
  mood: MoodState | null;
  onChange: (mood: MoodState | null) => void;
}

export function MoodSliders({ mood, onChange }: MoodSlidersProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const isSet = mood !== null;
  const polarity = mood?.polarity ?? 5;
  const intensity = mood?.intensity ?? 5;
  const label = mood?.label ?? "Neutral";
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = EMOTIONS
    .filter((emotion) => emotion.label.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      const aStarts = aLabel.startsWith(normalizedQuery);
      const bStarts = bLabel.startsWith(normalizedQuery);

      if (aStarts !== bStarts) {
        return aStarts ? -1 : 1;
      }

      return a.label.localeCompare(b.label);
    })
    .slice(0, 6);

  const handlePolarityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange({ polarity: val, intensity, label: getMoodLabel(val, intensity) });
  };

  const handleIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange({ polarity, intensity: val, label: getMoodLabel(polarity, val) });
  };

  const handleEmotionSelect = (emotion: Emotion) => {
    onChange({
      polarity: emotion.polarity,
      intensity: emotion.intensity,
      label: emotion.label,
    });
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-4 w-full p-4 sm:p-5 border border-border/40 rounded-sm bg-surface">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <span className="text-xs font-medium text-sage uppercase tracking-widest">
          How are you feeling? (Optional)
        </span>
        <div className="flex items-center gap-3">
          <span
            className={`font-display italic text-sm px-3.5 py-1 transition-all duration-300 rounded-sm ${
              isSet ? "bg-muted/40 border border-border/60 text-gold shadow-sm" : "text-foreground/40 font-mono text-xs"
            }`}
          >
            {isSet ? label : "Unset"}
          </span>
          {isSet && (
            <button
              onClick={handleClear}
              className="min-h-11 px-2 text-xs text-foreground/50 hover:text-foreground underline cursor-pointer transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          placeholder="Or name an emotion..."
          className="w-full px-3 py-1.5 bg-background border border-border/60 rounded-sm text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-sage/60"
        />
        {isOpen && filtered.length > 0 && (
          <div className="absolute z-10 w-full bg-surface border border-border/60 rounded-sm shadow-lg mt-1">
            {filtered.map((emotion) => (
              <button
                key={emotion.label}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleEmotionSelect(emotion);
                }}
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/30 focus:bg-muted/30 focus:outline-none transition-colors"
              >
                {emotion.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 mt-2">
        {/* Polarity Slider */}
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-[10px] sm:text-[11px] font-medium text-foreground/50 w-14 sm:w-20 text-right uppercase tracking-wider select-none shrink-0">Negative</span>
          <input
            type="range"
            min="0"
            max="10"
            value={polarity}
            onChange={handlePolarityChange}
            className="flex-1 min-w-0 h-1 bg-muted rounded-sm appearance-none cursor-pointer accent-sage"
          />
          <span className="text-[10px] sm:text-[11px] font-medium text-foreground/50 w-14 sm:w-20 text-left uppercase tracking-wider select-none shrink-0">Positive</span>
        </div>

        {/* Intensity Slider */}
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-[10px] sm:text-[11px] font-medium text-foreground/50 w-14 sm:w-20 text-right uppercase tracking-wider select-none shrink-0">Low Energy</span>
          <input
            type="range"
            min="0"
            max="10"
            value={intensity}
            onChange={handleIntensityChange}
            className="flex-1 min-w-0 h-1 bg-muted rounded-sm appearance-none cursor-pointer accent-sage"
          />
          <span className="text-[10px] sm:text-[11px] font-medium text-foreground/50 w-14 sm:w-20 text-left uppercase tracking-wider select-none shrink-0">High Energy</span>
        </div>
      </div>
    </div>
  );
}
