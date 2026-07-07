"use client";

import React from "react";

export type EntryType = "Reflection" | "Gratitude" | "Dream" | "Event" | "Other" | null;

interface EntryTypeSelectorProps {
  selectedType: EntryType;
  onChange: (type: EntryType) => void;
}

const ENTRY_TYPES: NonNullable<EntryType>[] = [
  "Reflection",
  "Gratitude",
  "Dream",
  "Event",
  "Other",
];

const TYPE_STYLES: Record<string, { active: string }> = {
  Reflection: {
    active: "bg-primary/50 text-sage border-sage/60",
  },
  Gratitude: {
    active: "bg-primary/50 text-gold border-gold/60",
  },
  Dream: {
    active: "bg-primary/50 text-[#8B7BAE] border-[#8B7BAE]/60",
  },
  Event: {
    active: "bg-primary/50 text-earth border-earth/60",
  },
  Other: {
    active: "bg-primary/50 text-foreground border-border",
  },
};

export function EntryTypeSelector({ selectedType, onChange }: EntryTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-2 w-full mt-4">
      <span className="text-xs font-medium text-sage uppercase tracking-widest">
        Tag this entry (Optional)
      </span>
      <div className="flex flex-wrap gap-2.5">
        {ENTRY_TYPES.map((type) => {
          const isSelected = selectedType === type;
          const styles = TYPE_STYLES[type] || TYPE_STYLES.Other;
          return (
            <button
              key={type}
              onClick={() => onChange(isSelected ? null : type)}
              className={`min-h-11 px-4 py-2 rounded-sm text-sm font-medium transition-all duration-300 border cursor-pointer ${
                isSelected
                  ? styles.active
                  : "bg-muted/20 text-foreground/70 border-border/60 hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}
