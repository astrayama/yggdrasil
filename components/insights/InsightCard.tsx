import React from 'react';
import type { EntryAnalysis } from '@/types/journal';

interface InsightCardProps {
  analysis: EntryAnalysis;
}

export function InsightCard({ analysis }: InsightCardProps) {
  const { interpretation, themes, emotions } = analysis;

  return (
    <div className="bg-surface-2 border border-border/60 rounded-xl p-6 sm:p-8 shadow-sm transition-all duration-300">
      <div className="space-y-6">
        {/* Header / Main Insight */}
        <div>
          <h3 className="text-sm uppercase tracking-widest text-gold/80 mb-3 font-semibold">
            Yggdrasil Insight
          </h3>
          <p className="font-display italic text-2xl sm:text-3xl text-foreground leading-relaxed">
            &quot;{interpretation.main_insight}&quot;
          </p>
        </div>

        {/* Themes & Emotions */}
        <div className="flex flex-col sm:flex-row gap-6 pt-4 border-t border-border/40">
          
          {/* Themes */}
          {themes && themes.length > 0 && (
            <div className="flex-1">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Themes</h4>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 bg-surface rounded-full text-xs text-foreground/90 border border-border/50"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Emotions */}
          {emotions && emotions.length > 0 && (
            <div className="flex-1">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Resonant Emotions</h4>
              <div className="flex flex-wrap gap-2">
                {emotions.map((emotion, idx) => {
                  // Subtle color hinting based on polarity (optional)
                  const isPositive = emotion.polarity > 5;
                  const isNegative = emotion.polarity < 5;
                  
                  return (
                    <span 
                      key={idx} 
                      className={`px-3 py-1 rounded-full text-xs border ${
                        isPositive ? 'bg-sage/10 text-sage border-sage/20' : 
                        isNegative ? 'bg-red-900/10 text-red-300 border-red-900/20' : 
                        'bg-surface text-foreground/80 border-border/50'
                      }`}
                      title={`Intensity: ${emotion.intensity}/10`}
                    >
                      {emotion.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Optional: Growth Connection */}
        {interpretation.growth_connection && (
          <div className="pt-2">
             <p className="text-sm text-foreground/70 leading-relaxed border-l-2 border-gold/30 pl-4">
               {interpretation.growth_connection}
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
