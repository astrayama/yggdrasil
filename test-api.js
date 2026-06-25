const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

// Dynamically compile the ts file or use ts-node if we want, but since we just want to test logic, 
// let's copy the logic of buildKnowledgeGraph here to debug it quickly.

function dotProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function magnitude(a) {
  return Math.sqrt(dotProduct(a, a));
}

function normalize(a) {
  const mag = magnitude(a);
  if (mag === 0) return a;
  return a.map(v => v / mag);
}

function cosineSimilarity(a, b) {
  return dotProduct(normalize(a), normalize(b));
}

async function run() {
  const userId = 'V9j9OvJgMcUV8GBThAzrNs0IuZe2'; // Found this user had 10 entries previously
  
  const entriesSnap = await db.collection('users').doc(userId).collection('entries').get();
  
  const entries = await Promise.all(entriesSnap.docs.map(async doc => {
    const data = doc.data();
    const analysisSnap = await db.collection('users').doc(userId)
      .collection('entries').doc(doc.id)
      .collection('analysis').limit(1).get();
      
    const analysis = analysisSnap.empty ? undefined : analysisSnap.docs[0].data();
    return { ...data, id: doc.id, analysis };
  }));

  const nodeMap = new Map();
  
  entries.forEach(entry => {
    if (!entry.analysis) return;
    
    let entryEmbedding = null;
    if (entry.embedding) {
      if (Array.isArray(entry.embedding)) {
        entryEmbedding = entry.embedding;
      } else if (typeof entry.embedding.toArray === 'function') {
        entryEmbedding = entry.embedding.toArray();
      } else if (entry.embedding._values) {
        entryEmbedding = entry.embedding._values;
      }
    }
    
    if (Array.isArray(entry.analysis.themes)) {
      entry.analysis.themes.forEach(theme => {
        if (!theme || typeof theme !== 'string') return;
        const id = `theme_${theme.toLowerCase().replace(/\s+/g, '_')}`;
        if (!nodeMap.has(id)) {
          nodeMap.set(id, { label: theme, type: 'theme', weight: 0, embeddings: [], entryIds: [] });
        }
        const node = nodeMap.get(id);
        node.weight++;
        if (!node.entryIds.includes(entry.id)) node.entryIds.push(entry.id);
        if (entryEmbedding) node.embeddings.push(entryEmbedding);
      });
    }
    
    if (Array.isArray(entry.analysis.entities)) {
      entry.analysis.entities.forEach(entity => {
        if (!entity || typeof entity !== 'object' || !entity.name || typeof entity.name !== 'string') return;
        const type = entity.type || 'concept';
        const id = `entity_${type}_${entity.name.toLowerCase().replace(/\\s+/g, '_')}`;
        if (!nodeMap.has(id)) {
          nodeMap.set(id, { label: entity.name, type: type, weight: 0, embeddings: [], entryIds: [] });
        }
        const node = nodeMap.get(id);
        node.weight++;
        if (!node.entryIds.includes(entry.id)) node.entryIds.push(entry.id);
        if (entryEmbedding) node.embeddings.push(entryEmbedding);
      });
    }
  });

  const nodeEntries = Array.from(nodeMap.entries());
  nodeEntries.sort((a, b) => b[1].weight - a[1].weight);
  if (nodeEntries.length > 150) nodeEntries.splice(150);

  const nodesWithEmbeddings = nodeEntries.map(([id, data]) => {
    let avgVector = null;
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
    return { id, label: data.label, type: data.type, weight: data.weight, entryIds: data.entryIds, vector: avgVector };
  });

  const validNodes = nodesWithEmbeddings.filter(n => n.vector !== null);
  
  const edges = [];
  const SIMILARITY_THRESHOLD = 0.70;
  const simMatrix = new Map();
  const getSimKey = (id1, id2) => [id1, id2].sort().join('|');
  const isConnected = new Set();

  for (let i = 0; i < validNodes.length; i++) {
    for (let j = i + 1; j < validNodes.length; j++) {
      const sim = cosineSimilarity(validNodes[i].vector, validNodes[j].vector);
      const simKey = getSimKey(validNodes[i].id, validNodes[j].id);
      simMatrix.set(simKey, sim);
      if (sim >= SIMILARITY_THRESHOLD) {
        edges.push({ source: validNodes[i].id, target: validNodes[j].id, weight: sim });
        isConnected.add(simKey);
      }
    }
  }

  const MIN_EDGES = 2;
  const edgeCount = new Map();
  validNodes.forEach(n => edgeCount.set(n.id, 0));
  edges.forEach(e => {
    edgeCount.set(e.source, (edgeCount.get(e.source) || 0) + 1);
    edgeCount.set(e.target, (edgeCount.get(e.target) || 0) + 1);
  });

  const weakEdges = [];
  for (const node of validNodes) {
    const needed = MIN_EDGES - (edgeCount.get(node.id) || 0);
    if (needed > 0) {
      const similarities = validNodes
        .filter(n => n.id !== node.id)
        .map(n => ({ targetId: n.id, sim: simMatrix.get(getSimKey(node.id, n.id)) || 0 }))
        .filter(target => !isConnected.has(getSimKey(node.id, target.targetId)))
        .sort((a, b) => b.sim - a.sim);
      
      let added = 0;
      for (const neighbor of similarities) {
        if (added >= needed) break;
        const simKey = getSimKey(node.id, neighbor.targetId);
        if (!isConnected.has(simKey)) {
          weakEdges.push({ source: node.id, target: neighbor.targetId, weight: neighbor.sim, weak: true });
          isConnected.add(simKey);
          edgeCount.set(node.id, (edgeCount.get(node.id) || 0) + 1);
          edgeCount.set(neighbor.targetId, (edgeCount.get(neighbor.targetId) || 0) + 1);
          added++;
        }
      }
    }
  }

  console.log(`Total initial entries: ${entries.length}`);
  console.log(`Total extracted nodes (before limit): ${nodeMap.size}`);
  console.log(`Total extracted nodes (after limit): ${nodeEntries.length}`);
  console.log(`Nodes with valid vectors: ${validNodes.length}`);
  console.log(`Strong edges (>=0.70): ${edges.length}`);
  console.log(`Weak edges: ${weakEdges.length}`);
  console.log(`Total edges intended for frontend: ${edges.length + weakEdges.length}`);
}

run().catch(console.error);
