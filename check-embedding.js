const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load environment variables
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

async function run() {
  const db = admin.firestore();
  const userId = 'V9j9OvJgMcUV8GBThAzrNs0IuZe2'; 
  const entriesSnap = await db.collection('users').doc(userId).collection('entries').limit(1).get();
  const entry = entriesSnap.docs[0].data();
  console.log("Embedding type:", typeof entry.embedding);
  console.log("Is array?", Array.isArray(entry.embedding));
  console.log("Has toArray?", typeof entry.embedding?.toArray === 'function');
  console.log("Keys:", Object.keys(entry.embedding || {}));
  console.log("Constructor name:", entry.embedding?.constructor?.name);
}

run().catch(console.error);
