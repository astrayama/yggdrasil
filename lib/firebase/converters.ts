import { FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';

const convertTimestamps = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Timestamp) return obj.toMillis();
  if (obj instanceof Date) return obj.getTime();
  if (Array.isArray(obj)) return obj.map(convertTimestamps);
  if (typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[key] = convertTimestamps(value);
      return acc;
    }, {} as any);
  }
  return obj;
};

export const createConverter = <T>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T): DocumentData => {
    return data as DocumentData;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T => {
    const data = snapshot.data(options);
    const converted = convertTimestamps(data);
    return { id: snapshot.id, ...converted } as T;
  },
});
