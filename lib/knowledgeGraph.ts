import type { JournalEntry, EntryAnalysis } from '@/types/journal';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  weight: number;
  entryIds: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  weak?: boolean;
}

export interface GraphCluster {
  id: string;
  nodeIds: string[];
  entryCount: number;
  timeSpanStr: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters?: GraphCluster[];
}

/**
 * Computes the dot product of two vectors.
 */
function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Computes the magnitude (L2 norm) of a vector.
 */
function magnitude(a: number[]): number {
  return Math.sqrt(dotProduct(a, a));
}

/**
 * Normalizes a vector.
 */
function normalize(a: number[]): number[] {
  const mag = magnitude(a);
  if (mag === 0) return a;
  return a.map(v => v / mag);
}

/**
 * Computes the cosine similarity between two vectors.
 * Higher is more similar. Range [-1, 1], usually [0, 1] for embeddings.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const normA = normalize(a);
  const normB = normalize(b);
  return dotProduct(normA, normB);
}

/**
 * Builds a knowledge graph from a list of user entries.
 * Extracts nodes (themes, people, concepts) and computes semantic similarity edges
 * using the average embedding of the entries they appear in.
 * 
 * @param entries The user's entries, including analysis and embedding.
 * @param tier 'basic' (free) or 'full' (pro). Basic limits node count.
 * @param backendClusters Optional pre-computed entry clusters from the server.
 */
export function buildKnowledgeGraph(
  entries: (JournalEntry & { analysis?: EntryAnalysis })[], 
  tier: 'basic' | 'full' = 'full',
  backendClusters: any[] = []
): GraphData {
  const nodeMap = new Map<string, { label: string, type: string, weight: number, embeddings: number[][], entryIds: string[] }>();
  
  // 1. Extract nodes and accumulate embeddings
  entries.forEach(entry => {
    if (!entry.analysis) return;
    
    // Ensure embedding exists and is parsed correctly (could be a Firestore VectorValue or array of numbers)
    let entryEmbedding: number[] | null = null;
    if (entry.embedding) {
      if (Array.isArray(entry.embedding)) {
        entryEmbedding = entry.embedding;
      } else if (typeof (entry.embedding as any).toArray === 'function') {
        entryEmbedding = (entry.embedding as any).toArray();
      } else if ((entry.embedding as any)._values) {
        entryEmbedding = (entry.embedding as any)._values;
      }
    }
    
    // Process themes
    if (Array.isArray(entry.analysis.themes)) {
      entry.analysis.themes.forEach(theme => {
        if (!theme || typeof theme !== 'string') return;
        const id = `theme_${theme.toLowerCase().replace(/\s+/g, '_')}`;
        if (!nodeMap.has(id)) {
          nodeMap.set(id, { label: theme, type: 'theme', weight: 0, embeddings: [], entryIds: [] });
        }
        const node = nodeMap.get(id)!;
        node.weight++;
        if (!node.entryIds.includes(entry.id)) node.entryIds.push(entry.id);
        if (entryEmbedding) node.embeddings.push(entryEmbedding);
      });
    }
    
    // Process entities
    if (Array.isArray(entry.analysis.entities)) {
      entry.analysis.entities.forEach(entity => {
        if (!entity || typeof entity !== 'object' || !entity.name || typeof entity.name !== 'string') return;
        const type = entity.type || 'concept';
        const id = `entity_${type}_${entity.name.toLowerCase().replace(/\s+/g, '_')}`;
        if (!nodeMap.has(id)) {
          nodeMap.set(id, { label: entity.name, type: type, weight: 0, embeddings: [], entryIds: [] });
        }
        const node = nodeMap.get(id)!;
        node.weight++;
        if (!node.entryIds.includes(entry.id)) node.entryIds.push(entry.id);
        if (entryEmbedding) node.embeddings.push(entryEmbedding);
      });
    }
  });
  
  // 2. Sort nodes by weight (frequency) and filter by tier
  const nodeEntries = Array.from(nodeMap.entries());
  nodeEntries.sort((a, b) => b[1].weight - a[1].weight);
  
  // Apply limits based on tier logic (temporary PRD handling)
  const maxNodes = tier === 'basic' ? 30 : 150;
  if (nodeEntries.length > maxNodes) {
    nodeEntries.splice(maxNodes);
  }
  
  // 3. Compute synthetic embedding for each node
  const nodesWithEmbeddings = nodeEntries.map(([id, data]) => {
    let avgVector: number[] | null = null;
    if (data.embeddings.length > 0) {
      const dims = data.embeddings[0].length;
      avgVector = new Array(dims).fill(0);
      for (const vec of data.embeddings) {
        for (let i = 0; i < dims; i++) {
          avgVector[i] += vec[i];
        }
      }
      for (let i = 0; i < dims; i++) {
        avgVector[i] /= data.embeddings.length;
      }
    }
    
    return {
      id,
      label: data.label,
      type: data.type,
      weight: data.weight,
      entryIds: data.entryIds,
      vector: avgVector
    };
  });
  
  // 4. Compute Edges based on cosine similarity
  // Strategy: guarantee every node gets connected to its K nearest neighbors,
  // then add bonus edges for pairs above a dynamic threshold. The threshold
  // adapts to the corpus — a small homogeneous journal might have a baseline
  // of 0.95 while a large diverse one might sit at 0.75.
  const nodes: GraphNode[] = nodesWithEmbeddings.map(n => ({ id: n.id, label: n.label, type: n.type, weight: n.weight, entryIds: n.entryIds }));
  
  const validNodes = nodesWithEmbeddings.filter(n => n.vector !== null);
  
  const MIN_NEIGHBORS = 2;  // Every node gets at least this many edges
  const MAX_EDGES_PER_NODE = 5; // Cap to keep graph readable
  
  const simMatrix = new Map<string, number>();
  const getSimKey = (id1: string, id2: string) => [id1, id2].sort().join('|');

  // Compute full pairwise similarity matrix
  const allSims: number[] = [];
  for (let i = 0; i < validNodes.length; i++) {
    for (let j = i + 1; j < validNodes.length; j++) {
      const sim = cosineSimilarity(validNodes[i].vector!, validNodes[j].vector!);
      simMatrix.set(getSimKey(validNodes[i].id, validNodes[j].id), sim);
      allSims.push(sim);
    }
  }

  // Dynamic threshold: use 75th percentile of all pairwise similarities
  // This ensures we always pick the strongest ~25% of possible connections
  allSims.sort((a, b) => a - b);
  const p75 = allSims.length > 0 ? allSims[Math.floor(allSims.length * 0.75)] : 0.85;
  const STRONG_THRESHOLD = Math.max(0.80, Math.min(0.96, p75));

  const isConnected = new Set<string>();
  const edges: GraphEdge[] = [];
  const edgeCount = new Map<string, number>();
  validNodes.forEach(n => edgeCount.set(n.id, 0));

  // Phase 1: Connect every node to its MIN_NEIGHBORS nearest neighbors
  for (const node of validNodes) {
    const neighbors = validNodes
      .filter(n => n.id !== node.id)
      .map(n => ({
        targetId: n.id,
        sim: simMatrix.get(getSimKey(node.id, n.id)) || 0
      }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, MIN_NEIGHBORS);

    for (const neighbor of neighbors) {
      const simKey = getSimKey(node.id, neighbor.targetId);
      if (!isConnected.has(simKey)) {
        edges.push({
          source: node.id,
          target: neighbor.targetId,
          weight: neighbor.sim,
          weak: neighbor.sim < STRONG_THRESHOLD
        });
        isConnected.add(simKey);
        edgeCount.set(node.id, (edgeCount.get(node.id) || 0) + 1);
        edgeCount.set(neighbor.targetId, (edgeCount.get(neighbor.targetId) || 0) + 1);
      }
    }
  }

  // Phase 2: Add strong edges above threshold (up to MAX_EDGES_PER_NODE)
  for (const node of validNodes) {
    const currentCount = edgeCount.get(node.id) || 0;
    if (currentCount >= MAX_EDGES_PER_NODE) continue;

    const neighbors = validNodes
      .filter(n => n.id !== node.id)
      .map(n => ({
        targetId: n.id,
        sim: simMatrix.get(getSimKey(node.id, n.id)) || 0
      }))
      .filter(n => n.sim >= STRONG_THRESHOLD && !isConnected.has(getSimKey(node.id, n.targetId)))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, MAX_EDGES_PER_NODE - currentCount);

    for (const neighbor of neighbors) {
      const simKey = getSimKey(node.id, neighbor.targetId);
      if (!isConnected.has(simKey)) {
        edges.push({
          source: node.id,
          target: neighbor.targetId,
          weight: neighbor.sim
        });
        isConnected.add(simKey);
        edgeCount.set(node.id, (edgeCount.get(node.id) || 0) + 1);
        edgeCount.set(neighbor.targetId, (edgeCount.get(neighbor.targetId) || 0) + 1);
      }
    }
  }

  // 6. Recurrence Detection: Map backend entry clusters to frontend node clusters
  const clusters: GraphCluster[] = [];

  backendClusters.forEach(bc => {
    // A backend cluster has an array of entryIds
    const clusterEntryIds = bc.entryIds || [];
    if (clusterEntryIds.length === 0) return;

    // Find all frontend nodes that are present in any of the cluster's entries
    const matchedNodeIds: string[] = [];
    validNodes.forEach(n => {
      if (n.entryIds.some(eid => clusterEntryIds.includes(eid))) {
        matchedNodeIds.push(n.id);
      }
    });

    if (matchedNodeIds.length > 0) {
      clusters.push({
        id: bc.id,
        nodeIds: matchedNodeIds,
        entryCount: bc.entryCount,
        timeSpanStr: bc.timeSpanStr
      });
    }
  });
  
  // 7. Clean up graph (remove orphaned nodes if strict filtering is desired, 
  // but keeping them might be fine for visualization as floating points)
  
  return { nodes, edges, clusters };
}
