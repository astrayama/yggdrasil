import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {
  AUTO_LINK_THRESHOLD,
  MAX_AUTO_LINKS_PER_ENTRY,
  scoreRootCandidates,
  type RootCandidate,
} from './scoring';

function htmlToExcerpt(html: string, maxLength = 160): string {
  const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength - 3)}...` : plain;
}

async function hasEntryLinkEvent(
  db: FirebaseFirestore.Firestore,
  userId: string,
  rootId: string,
  entryId: string
): Promise<boolean> {
  const eventsSnap = await db.collection(`users/${userId}/roots/${rootId}/events`)
    .where('entryId', '==', entryId)
    .limit(5)
    .get();

  return eventsSnap.docs.some((doc) => doc.data().type === 'entry_linked');
}

/**
 * Called from analyzeEntry after analysis completes: matches the new entry
 * against the user's active roots. High-confidence matches are linked directly
 * into the root's journey; medium-confidence matches stay as pending
 * suggestions the user confirms or dismisses in the Roots UI.
 *
 * Tuning defaults are intentionally conservative: auto-linking requires a
 * boosted similarity of at least AUTO_LINK_THRESHOLD, while suggestions keep
 * the lower SUGGEST_THRESHOLD used by scoreRootCandidates. Suggestion doc IDs
 * are `${rootId}_${entryId}` so a dismissed pair can never resurface.
 */
export async function suggestRootLinksForEntry(
  userId: string,
  entryId: string,
  entryData: FirebaseFirestore.DocumentData,
  entryEmbedding: number[],
  themes: string[]
): Promise<void> {
  const db = admin.firestore();

  const rootsSnap = await db.collection(`users/${userId}/roots`)
    .where('status', '==', 'active')
    .limit(50)
    .get();

  const candidates: RootCandidate[] = rootsSnap.docs
    .filter((doc) => {
      const data = doc.data();
      return data.embedding && !data.gated;
    })
    .map((doc) => ({
      id: doc.id,
      title: doc.data().title ?? '',
      why: doc.data().why ?? '',
      embedding: doc.data().embedding.toVector(),
    }));

  if (candidates.length === 0) {
    return;
  }

  const alreadyLinked: string[] = entryData.linkedRootIds ?? [];
  const scored = scoreRootCandidates(entryEmbedding, themes, candidates)
    .filter((candidate) => !alreadyLinked.includes(candidate.rootId));

  if (scored.length === 0) {
    return;
  }

  const batch = db.batch();
  const entryRef = db.doc(`users/${userId}/entries/${entryId}`);
  const autoLinkedRootIds: string[] = [];
  const entryExcerpt = htmlToExcerpt(entryData.content ?? '');
  const entryDate = entryData.entryDate ?? entryData.createdAt?.toMillis?.() ?? Date.now();
  const entryTitle = typeof entryData.title === 'string' && entryData.title.trim()
    ? entryData.title
    : undefined;
  let autoLinked = 0;
  let suggested = 0;

  for (const candidate of scored) {
    const suggestionRef = db.doc(`users/${userId}/rootSuggestions/${candidate.rootId}_${entryId}`);
    const existingSuggestion = await suggestionRef.get();
    if (existingSuggestion.exists) {
      continue; // any prior status (including dismissed) is final for this pair
    }

    if (await hasEntryLinkEvent(db, userId, candidate.rootId, entryId)) {
      continue;
    }

    const root = candidates.find((c) => c.id === candidate.rootId);
    const safeScoreMetadata = {
      score: candidate.score,
      similarity: candidate.score,
      matchedThemes: candidate.matchedThemes,
    };

    if (candidate.score >= AUTO_LINK_THRESHOLD && autoLinked < MAX_AUTO_LINKS_PER_ENTRY) {
      batch.set(db.collection(`users/${userId}/roots/${candidate.rootId}/events`).doc(), {
        type: 'entry_linked',
        entryId,
        ...(entryTitle ? { entryTitle } : {}),
        ...(entryExcerpt ? { entryExcerpt } : {}),
        entryDate,
        linkSource: 'auto',
        createdAt: Date.now(),
        ...safeScoreMetadata,
      });
      autoLinkedRootIds.push(candidate.rootId);
      autoLinked++;
      continue;
    }

    batch.set(suggestionRef, {
      userId,
      rootId: candidate.rootId,
      rootTitle: root?.title ?? '',
      entryId,
      ...(entryTitle ? { entryTitle } : {}),
      entryExcerpt,
      entryDate,
      similarity: candidate.score,
      matchedThemes: candidate.matchedThemes,
      status: 'pending',
      createdAt: Date.now(),
    });
    suggested++;
  }

  if (autoLinkedRootIds.length > 0) {
    batch.update(entryRef, {
      linkedRootIds: admin.firestore.FieldValue.arrayUnion(...autoLinkedRootIds),
    });
  }

  if (autoLinked > 0 || suggested > 0) {
    await batch.commit();
    logger.info('[suggestRootLinks] Processed root links', {
      userId,
      entryId,
      autoLinked,
      suggested,
    });
  }
}
