import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

interface AnalyticsEventParams {
  [key: string]: string | number | boolean;
}

interface AnalyticsConfig {
  measurementId: string;
  apiSecret: string;
}

interface SendAnalyticsEventOptions {
  userId?: string;
  clientId?: string;
  eventParams?: AnalyticsEventParams;
}

type HiddenConnectionsComputationPath = 'cirq' | 'fallback_knn';

export interface HiddenConnectionsComputationLog {
  userId: string;
  path: HiddenConnectionsComputationPath;
  candidateCount: number;
  storedCount: number;
  entryCount: number;
  computedAt: string;
  source: string;
  runId?: string;
  maxCandidatePairs?: number;
  maxStoredConnections?: number;
}

const isAnalyticsDebug = process.env.ANALYTICS_DEBUG === 'true';
const SYSTEM_CLIENT_ID = '51b94feb-583d-425d-9adf-a209a1f5ec42';

function getAnalyticsConfig(): AnalyticsConfig | null {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    logger.warn('Analytics not configured: GA4_MEASUREMENT_ID and GA4_API_SECRET must be set');
    return null;
  }

  return { measurementId, apiSecret };
}

async function getOrCreateClientId(userId: string): Promise<string> {
  const db = admin.firestore();
  const userRef = db.doc(`users/${userId}`);
  
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  
  if (userData?.analyticsClientId) {
    return userData.analyticsClientId;
  }
  
  const clientId = crypto.randomUUID();
  
  await userRef.set({ analyticsClientId: clientId }, { merge: true });
  
  logger.info('Created new analytics client ID', { userId, clientId });
  
  return clientId;
}

export async function sendAnalyticsEvent(
  eventName: string,
  options: SendAnalyticsEventOptions,
): Promise<void> {
  const config = getAnalyticsConfig();

  if (!config) {
    logger.warn('Skipping analytics event - not configured', { eventName, clientId: options.clientId, userId: options.userId });
    return;
  }

  try {
    const clientId = options.clientId
      ?? (options.userId ? await getOrCreateClientId(options.userId) : SYSTEM_CLIENT_ID);

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${config.measurementId}&api_secret=${config.apiSecret}`;

    const payload = {
      client_id: clientId,
      ...(options.userId ? { user_id: options.userId } : {}),
      events: [
        {
          name: eventName,
          params: {
            ...options.eventParams,
            ...(isAnalyticsDebug ? { debug_mode: 1 } : {}),
            engagement_time_msec: 100,
          },
        },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const responseBody = await response.text();

    if (!response.ok) {
      logger.error('Analytics event failed', {
        eventName,
        clientId,
        userId: options.userId,
        status: response.status,
        response: responseBody,
      });
      return;
    }
  } catch (error) {
    logger.error('Failed to send analytics event', {
      eventName,
      clientId: options.clientId,
      userId: options.userId,
      error,
    });
  }
}

export async function logInsightGenerated(
  userId: string,
  entryId: string,
  depthScore: number
): Promise<void> {
  await sendAnalyticsEvent('insight_generated', {
    userId,
    eventParams: {
      event_id: `analysis_${entryId}`,
      entry_id: entryId,
      depth_score: depthScore,
    },
  });
}

export async function logBranchActionsGenerated(
  userId: string,
  rootId: string,
  branchCount: number
): Promise<void> {
  await sendAnalyticsEvent('branch_actions_generated', {
    userId,
    eventParams: {
      event_id: `branch_actions_${rootId}_${Date.now()}`,
      root_id: rootId,
      branch_count: branchCount,
    },
  });
}

export async function logHiddenConnectionsComputed(
  userId: string,
  path: HiddenConnectionsComputationPath,
  count: number
): Promise<void> {
  await logHiddenConnectionsComputation({
    userId,
    path,
    candidateCount: count,
    storedCount: count,
    entryCount: 0,
    computedAt: new Date().toISOString(),
    source: 'computeHiddenConnections',
  });
}

export async function logHiddenConnectionsComputation(
  params: HiddenConnectionsComputationLog
): Promise<void> {
  const eventId = params.runId
    ? `hidden_connections_${params.runId}_${params.userId}`
    : `hidden_connections_${params.userId}_${params.computedAt}`;

  await sendAnalyticsEvent('hidden_connections_computation', {
    userId: params.userId,
    eventParams: {
      event_id: eventId,
      userId: params.userId,
      path: params.path,
      candidateCount: params.candidateCount,
      storedCount: params.storedCount,
      entryCount: params.entryCount,
      computedAt: params.computedAt,
      source: params.source,
      count: params.storedCount,
      ...(params.maxCandidatePairs === undefined ? {} : { maxCandidatePairs: params.maxCandidatePairs }),
      ...(params.maxStoredConnections === undefined ? {} : { maxStoredConnections: params.maxStoredConnections }),
    },
  });

  const computedAtDate = new Date(params.computedAt);
  const computedAt = Number.isNaN(computedAtDate.getTime())
    ? admin.firestore.FieldValue.serverTimestamp()
    : admin.firestore.Timestamp.fromDate(computedAtDate);

  await admin.firestore().collection('opsLogs').add({
    feature: 'hidden_connections',
    eventName: 'hidden_connections_computation',
    status: 'success',
    userId: params.userId,
    path: params.path,
    candidateCount: params.candidateCount,
    storedCount: params.storedCount,
    entryCount: params.entryCount,
    computedAt,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    source: params.source,
    runId: params.runId ?? null,
    maxCandidatePairs: params.maxCandidatePairs ?? null,
    maxStoredConnections: params.maxStoredConnections ?? null,
  });
}

export async function logWeeklyWisdomGenerated(
  weekId: string
): Promise<void> {
  await sendAnalyticsEvent('weekly_wisdom_generated', {
    eventParams: {
      event_id: `weekly_wisdom_${weekId}`,
      week_id: weekId,
    },
  });
}

export async function logSubscriptionStarted(
  userId: string,
  plan: string,
): Promise<void> {
  await sendAnalyticsEvent('subscription_started', {
    userId,
    eventParams: { plan },
  });
}

export async function logSubscriptionCancelled(userId: string): Promise<void> {
  await sendAnalyticsEvent('subscription_cancelled', {
    userId,
  });
}

export async function logSubscriptionRenewed(
  userId: string,
  plan: string,
): Promise<void> {
  await sendAnalyticsEvent('subscription_renewed', {
    userId,
    eventParams: { plan },
  });
}
