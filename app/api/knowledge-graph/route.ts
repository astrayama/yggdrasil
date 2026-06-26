import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { buildKnowledgeGraph } from '@/lib/knowledgeGraph';
import type { JournalEntry, EntryAnalysis } from '@/types/journal';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const url = new URL(request.url);
    const tier = (url.searchParams.get('tier') as 'basic' | 'full') || 'basic';

    const entriesSnapshot = await adminDb.collection('users').doc(userId).collection('entries').get();
    
    const entries = entriesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        analysis: data.analysis
      } as (JournalEntry & { analysis?: EntryAnalysis });
    });

    // Fetch pre-computed backend clusters
    const clustersSnap = await adminDb.collection('users').doc(userId).collection('graphMetadata').doc('clusters').get();
    const backendClusters = clustersSnap.exists ? clustersSnap.data()?.clusters || [] : [];

    const graphData = buildKnowledgeGraph(entries, tier, backendClusters);

    // Deep clean the object to remove any non-serializable properties (like Timestamps or nested class instances) that might have snuck in
    const cleanData = JSON.parse(JSON.stringify(graphData, (key, value) => {
      if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Timestamp') {
        return value.toMillis ? value.toMillis() : value;
      }
      return value;
    }));

    return NextResponse.json(cleanData);
  } catch (error: any) {
    console.error('Knowledge Graph API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
