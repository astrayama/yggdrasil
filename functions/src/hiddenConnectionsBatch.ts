import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { findNearestEntries } from './lib/vectorSearch';

// XPE-HC-03 tuning defaults. These are intentionally conservative until real
// usage data answers the open PRD questions around minimum corpus size, noisy
// pair counts, and Cirq latency/cost at scale.
const NIGHTLY_SCHEDULE = 'every day 03:00';
const NIGHTLY_TIME_ZONE = 'America/Los_Angeles';
export const MINIMUM_ENTRY_COUNT = 8;
export const MAX_USERS_PER_RUN = 50;
export const MAX_ENTRIES_PER_USER = 200;
export const KNN_NEIGHBORS_PER_ENTRY = 8;
export const MAX_CANDIDATE_PAIRS = 80;
export const MAX_STORED_CONNECTIONS = 20;
export const CIRQ_SERVICE_URL_ENV_VAR = 'CIRQ_SERVICE_URL';

const INPUT_EMBEDDING_DIMENSIONS = 768;
const CIRQ_VECTOR_DIMENSIONS = 8;
const CIRQ_REQUEST_TIMEOUT_MS = 15_000;

type HiddenConnectionPath = 'cirq' | 'fallback_knn';

interface EntryWithEmbedding {
  id: string;
  embedding: number[];
}

interface CandidatePair {
  sourceId: string;
  targetId: string;
  knnSimilarity: number;
}

interface ScoredConnection extends CandidatePair {
  score: number;
  path: HiddenConnectionPath;
  reason: string;
  cirqScore?: number;
}

interface ReducedVectorResponse {
  vectors: Array<{
    id: string;
    angle_vector: number[];
  }>;
  total_explained_variance?: number;
  refit_recommended?: boolean;
}

interface KernelResponse {
  score: number;
  qubits: number;
  path: 'cirq';
}

export const nightlyHiddenConnectionsBatch = onSchedule(
  {
    schedule: NIGHTLY_SCHEDULE,
    timeZone: NIGHTLY_TIME_ZONE,
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async () => {
    const db = admin.firestore();
    const userIds = await getEligibleUserIds(db);

    logger.info('[hiddenConnectionsBatch] Starting nightly run', {
      userCount: userIds.length,
      schedule: NIGHTLY_SCHEDULE,
      minEntryCount: MINIMUM_ENTRY_COUNT,
      maxCandidatePairs: MAX_CANDIDATE_PAIRS,
      maxStoredConnections: MAX_STORED_CONNECTIONS,
    });

    let processedUsers = 0;
    let failedUsers = 0;
    let storedConnections = 0;

    for (const userId of userIds) {
      try {
        const result = await computeForUser(db, userId);
        processedUsers += 1;
        storedConnections += result.storedCount;
      } catch (error) {
        failedUsers += 1;
        logger.error('[hiddenConnectionsBatch] User computation failed', {
          userId,
          error,
        });
      }
    }

    logger.info('[hiddenConnectionsBatch] Nightly run finished', {
      processedUsers,
      failedUsers,
      storedConnections,
    });
  }
);

async function getEligibleUserIds(
  db: admin.firestore.Firestore
): Promise<string[]> {
  // Hidden Connections is a Pro feature, so the nightly batch starts from users
  // with an active subscription. The per-user entry-count gate below is the
  // second eligibility check.
  const snapshot = await db.collection('subscriptions')
    .where('status', '==', 'active')
    .limit(MAX_USERS_PER_RUN)
    .get();

  return snapshot.docs.map((doc) => doc.id);
}

async function computeForUser(
  db: admin.firestore.Firestore,
  userId: string
): Promise<{ storedCount: number }> {
  const entries = await loadEntriesWithEmbeddings(db, userId);

  if (entries.length < MINIMUM_ENTRY_COUNT) {
    logger.info('[hiddenConnectionsBatch] Skipping user below entry threshold', {
      userId,
      entryCount: entries.length,
      minEntryCount: MINIMUM_ENTRY_COUNT,
    });
    return { storedCount: 0 };
  }

  const candidatePairs = await buildKnnCandidatePairs(userId, entries);

  if (candidatePairs.length === 0) {
    logger.info('[hiddenConnectionsBatch] No KNN candidates found', { userId });
    return { storedCount: 0 };
  }

  const cirqServiceUrl = normalizeServiceUrl(process.env[CIRQ_SERVICE_URL_ENV_VAR]);
  const scoredConnections = cirqServiceUrl
    ? await rerankWithCirq(cirqServiceUrl, entries, candidatePairs, userId)
    : scoreWithKnnOnly(candidatePairs, 'Cirq service URL is not configured');

  const connectionsToStore = scoredConnections
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_STORED_CONNECTIONS);

  await storeConnections(db, userId, connectionsToStore);

  logger.info('[hiddenConnectionsBatch] User computation finished', {
    userId,
    entryCount: entries.length,
    candidateCount: candidatePairs.length,
    storedCount: connectionsToStore.length,
    usedCirq: connectionsToStore.some((connection) => connection.path === 'cirq'),
  });

  return { storedCount: connectionsToStore.length };
}

async function loadEntriesWithEmbeddings(
  db: admin.firestore.Firestore,
  userId: string
): Promise<EntryWithEmbedding[]> {
  const snapshot = await db.collection(`users/${userId}/entries`)
    .where('analysisStatus', '==', 'complete')
    .limit(MAX_ENTRIES_PER_USER)
    .get();

  const entries: EntryWithEmbedding[] = [];

  snapshot.docs.forEach((doc) => {
    const embedding = readEmbeddingVector(doc.data().embedding);
    if (embedding) {
      entries.push({ id: doc.id, embedding });
    }
  });

  return entries;
}

async function buildKnnCandidatePairs(
  userId: string,
  entries: EntryWithEmbedding[]
): Promise<CandidatePair[]> {
  const candidateMap = new Map<string, CandidatePair>();

  for (const entry of entries) {
    const neighbors = await findNearestEntries(
      userId,
      entry.embedding,
      KNN_NEIGHBORS_PER_ENTRY + 1
    );

    for (const neighbor of neighbors) {
      if (neighbor.id === entry.id) {
        continue;
      }

      const [sourceId, targetId] = sortPair(entry.id, neighbor.id);
      const pairId = buildPairId(sourceId, targetId);
      const similarity = clampScore(1 - neighbor.distance);
      const existing = candidateMap.get(pairId);

      if (!existing || similarity > existing.knnSimilarity) {
        candidateMap.set(pairId, {
          sourceId,
          targetId,
          knnSimilarity: similarity,
        });
      }
    }
  }

  return Array.from(candidateMap.values())
    .sort((a, b) => b.knnSimilarity - a.knnSimilarity)
    .slice(0, MAX_CANDIDATE_PAIRS);
}

async function rerankWithCirq(
  cirqServiceUrl: string,
  entries: EntryWithEmbedding[],
  candidatePairs: CandidatePair[],
  userId: string
): Promise<ScoredConnection[]> {
  const angleVectors = await getCirqAngleVectors(cirqServiceUrl, entries, userId);
  const scoredConnections: ScoredConnection[] = [];

  for (const pair of candidatePairs) {
    const vectorA = angleVectors.get(pair.sourceId);
    const vectorB = angleVectors.get(pair.targetId);

    if (!vectorA || !vectorB) {
      logger.warn('[hiddenConnectionsBatch] Missing PCA angle vector for candidate', {
        userId,
        sourceId: pair.sourceId,
        targetId: pair.targetId,
      });
      continue;
    }

    try {
      const cirqScore = await callCirqKernel(cirqServiceUrl, vectorA, vectorB);
      scoredConnections.push({
        ...pair,
        score: cirqScore,
        path: 'cirq',
        cirqScore,
        reason: 'Cirq kernel re-ranked semantic candidate',
      });
    } catch (error) {
      // XPE-HC-05 will make fallback parity explicit. For this scheduled
      // orchestration ticket, a failed pair is skipped while the rest of the
      // user's candidates continue.
      logger.warn('[hiddenConnectionsBatch] Cirq kernel call failed for pair', {
        userId,
        sourceId: pair.sourceId,
        targetId: pair.targetId,
        error,
      });
    }
  }

  return scoredConnections;
}

async function getCirqAngleVectors(
  cirqServiceUrl: string,
  entries: EntryWithEmbedding[],
  userId: string
): Promise<Map<string, number[]>> {
  const response = await postJson<ReducedVectorResponse>(
    `${cirqServiceUrl}/reduce`,
    {
      entries: entries.map((entry) => ({
        id: entry.id,
        embedding: entry.embedding,
      })),
    }
  );

  logger.info('[hiddenConnectionsBatch] PCA reduction completed', {
    userId,
    corpusSize: entries.length,
    totalExplainedVariance: response.total_explained_variance ?? null,
    refitRecommended: response.refit_recommended ?? null,
  });

  const vectors = new Map<string, number[]>();

  for (const item of response.vectors) {
    if (isFiniteVector(item.angle_vector, CIRQ_VECTOR_DIMENSIONS)) {
      vectors.set(item.id, item.angle_vector);
    }
  }

  return vectors;
}

async function callCirqKernel(
  cirqServiceUrl: string,
  vectorA: number[],
  vectorB: number[]
): Promise<number> {
  const response = await postJson<KernelResponse>(
    `${cirqServiceUrl}/kernel`,
    {
      vector_a: vectorA,
      vector_b: vectorB,
    }
  );

  if (response.path !== 'cirq' || response.qubits !== CIRQ_VECTOR_DIMENSIONS) {
    throw new Error('Unexpected Cirq kernel response metadata');
  }

  return clampScore(response.score);
}

function scoreWithKnnOnly(
  candidatePairs: CandidatePair[],
  reason: string
): ScoredConnection[] {
  return candidatePairs.map((pair) => ({
    ...pair,
    score: pair.knnSimilarity,
    path: 'fallback_knn',
    reason,
  }));
}

async function storeConnections(
  db: admin.firestore.Firestore,
  userId: string,
  connections: ScoredConnection[]
): Promise<void> {
  if (connections.length === 0) {
    return;
  }

  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const canonicalUserRef = db.doc(`connections/${userId}`);

  batch.set(
    canonicalUserRef,
    {
      userId,
      updatedAt: now,
      source: 'nightlyHiddenConnectionsBatch',
      maxStoredConnections: MAX_STORED_CONNECTIONS,
    },
    { merge: true }
  );

  for (const connection of connections) {
    const pairId = buildPairId(connection.sourceId, connection.targetId);
    const data = {
      userId,
      sourceId: connection.sourceId,
      targetId: connection.targetId,
      entryIdA: connection.sourceId,
      entryIdB: connection.targetId,
      score: connection.score,
      similarity: connection.score,
      knnSimilarity: connection.knnSimilarity,
      ...(connection.cirqScore === undefined ? {} : { cirqScore: connection.cirqScore }),
      weak: false,
      reason: connection.reason,
      computedVia: connection.path,
      path: connection.path,
      computedAt: now,
      updatedAt: now,
      source: 'nightlyHiddenConnectionsBatch',
    };

    // Ticket target path: connections/{userId}/pairs/{pairId}.
    batch.set(canonicalUserRef.collection('pairs').doc(pairId), data, { merge: true });

    // Existing app compatibility path. Current UI and clustering code read this
    // subcollection, so XPE-HC-03 mirrors writes here instead of breaking reads.
    batch.set(db.doc(`users/${userId}/connections/${pairId}`), data, { merge: true });
  }

  await batch.commit();
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CIRQ_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const responseBody = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseBody}`);
    }

    return JSON.parse(responseBody) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function readEmbeddingVector(value: unknown): number[] | null {
  const vectorLike = value as {
    toVector?: () => unknown;
    toArray?: () => unknown;
    _values?: unknown;
  } | null;

  const rawVector = Array.isArray(value)
    ? value
    : vectorLike?.toVector?.()
      ?? vectorLike?.toArray?.()
      ?? vectorLike?._values;

  return isFiniteVector(rawVector, INPUT_EMBEDDING_DIMENSIONS) ? rawVector : null;
}

function isFiniteVector(
  value: unknown,
  expectedLength: number
): value is number[] {
  return Array.isArray(value)
    && value.length === expectedLength
    && value.every((item) => typeof item === 'number' && Number.isFinite(item));
}

function normalizeServiceUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : null;
}

function sortPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function buildPairId(sourceId: string, targetId: string): string {
  return `${sourceId}_${targetId}`;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}
