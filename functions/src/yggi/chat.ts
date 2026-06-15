import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiapikey } from '../lib/gemini';

export const yggiChat = onCall(
  {
    secrets: [geminiapikey],
  },
  async (request) => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const { auth, data } = request;
  
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { message, userId } = data;
  if (!message || !userId) {
    throw new HttpsError('invalid-argument', 'Missing message or userId.');
  }
  if (userId !== auth.uid) {
    throw new HttpsError('permission-denied', 'Cannot chat for another user.');
  }

  try {
    // 1. Generate query embedding
    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_EMBEDDING || 'gemini-embedding-exp',
    });
    const embeddingResult = await embeddingModel.embedContent(message);
    const queryEmbedding = embeddingResult.embedding.values;

    // 2. Fetch similar entries from Firestore
    const db = admin.firestore();
    const vectorQuery = db
      .collectionGroup('entries')
      .where('userId', '==', userId)
      .findNearest({
        vectorField: 'embedding',
        queryVector: admin.firestore.FieldValue.vector(queryEmbedding),
        limit: 5,
        distanceMeasure: 'COSINE',
      });

    const snapshot = await vectorQuery.get();
    
    const contextEntries = snapshot.docs.map(doc => {
      const data = doc.data();
      return `Date: ${new Date(data.createdAt).toISOString()}
Title: ${data.title}
Content: ${data.content}`;
    }).join('\n\n');

    // 3. Generate response with context
    const chatModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.0-flash',
    });
    
    const prompt = `You are Yggi, an AI journaling companion.
Answer the user's message using the context from their past journal entries.

User's Journal Context:
${contextEntries}

User Message:
"${message}"`;

    const chatResult = await chatModel.generateContent(prompt);
    const reply = chatResult.response.text();

    return { success: true, reply };
  } catch (error) {
    logger.error('Failed to process Yggi chat', error);
    throw new HttpsError('internal', 'Chat processing failed.');
  }
});
