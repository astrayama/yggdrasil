'use client';

import { use, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore, useFirestoreDoc } from '@/hooks/useFirestore';
import { useRouter } from 'next/navigation';
import { limit } from 'firebase/firestore';
import type { JournalEntry, EntryAnalysis } from '@/types/journal';
import { InsightCard } from '@/components/insights/InsightCard';

interface EntryPageProps {
  params: Promise<{ entryId: string }>;
}

export default function EntryPage({ params }: EntryPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Use React.use to unwrap the Promise
  const resolvedParams = use(params);
  const entryId = resolvedParams.entryId;

  const entryPath = user ? `users/${user.uid}/entries/${entryId}` : '';
  const analysisPath = user ? `users/${user.uid}/entries/${entryId}/analysis` : '';

  const { data: entry, loading: entryLoading, error: entryError } = useFirestoreDoc<JournalEntry>(entryPath);
  
  // Query analysis subcollection (there should only be one document)
  const { data: analysisDocs, loading: analysisLoading } = useFirestore<EntryAnalysis>(
    analysisPath,
    limit(1)
  );

  const analysis = analysisDocs && analysisDocs.length > 0 ? analysisDocs[0] : null;

  useEffect(() => {
    if (entryError) {
      console.error('Error fetching entry:', entryError);
    }
  }, [entryError]);

  if (!user) return null; // Let the auth layout handle redirect
  
  if (entryLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-pulse">
        <div className="h-4 bg-surface-2 rounded w-1/4 mb-8"></div>
        <div className="h-24 bg-surface-2 rounded mb-12"></div>
        <div className="h-64 bg-surface-2 rounded"></div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl text-foreground font-display">Entry not found</h2>
        <button 
          onClick={() => router.push('/journal')}
          className="mt-4 text-gold hover:text-gold/80"
        >
          Return to Journal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-12">
      {/* Back Button */}
      <button 
        onClick={() => router.push('/journal')}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
      >
        <span>←</span> Back to Journal
      </button>

      {/* Entry Content */}
      <article className="prose prose-invert prose-p:text-foreground/90 prose-p:leading-relaxed max-w-none">
        <div className="flex items-center gap-3 mb-6 text-sm text-muted-foreground">
          <time dateTime={new Date(entry.createdAt).toISOString()}>
            {new Date(entry.createdAt).toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </time>
          {entry.entryType && (
            <>
              <span className="text-border">•</span>
              <span className="px-2 py-0.5 bg-surface-2 rounded text-xs">{entry.entryType}</span>
            </>
          )}
        </div>
        
        <div 
          className="text-lg whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />
      </article>

      {/* Analysis Section */}
      <div className="pt-8 border-t border-border/40">
        <h2 className="text-lg font-display text-foreground mb-6">Reflection & Insight</h2>
        
        {entry.analysisStatus === 'pending' && (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-2/50 rounded-xl border border-border/40">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground italic font-display">Yggdrasil is thinking...</p>
          </div>
        )}

        {entry.analysisStatus === 'error' && (
          <div className="p-6 bg-red-900/10 border border-red-900/20 rounded-xl text-center">
            <p className="text-red-400">There was an issue reflecting on this entry.</p>
            <p className="text-sm text-red-400/70 mt-2">The system will safely retry this later.</p>
          </div>
        )}

        {entry.analysisStatus === 'complete' && analysis && (
          <InsightCard analysis={analysis} />
        )}
      </div>
    </div>
  );
}
