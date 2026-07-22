export type Emotion = {
  label: string;
  polarity: number;
  intensity: number;
};

export const EMOTIONS: Emotion[] = [
  { label: 'Joyful', polarity: 9, intensity: 8 },
  { label: 'Joy', polarity: 9, intensity: 8 },
  { label: 'Grateful', polarity: 8, intensity: 5 },
  { label: 'Gratitude', polarity: 8, intensity: 5 },
  { label: 'Excited', polarity: 8, intensity: 9 },
  { label: 'Excitement', polarity: 8, intensity: 9 },
  { label: 'Hopeful', polarity: 7, intensity: 6 },
  { label: 'Content', polarity: 7, intensity: 4 },
  { label: 'Calm', polarity: 7, intensity: 2 },
  { label: 'Proud', polarity: 8, intensity: 6 },
  { label: 'Pride', polarity: 8, intensity: 6 },
  { label: 'Tired', polarity: 4, intensity: 2 },
  { label: 'Numb', polarity: 4, intensity: 1 },
  { label: 'Anxious', polarity: 3, intensity: 8 },
  { label: 'Anxiety', polarity: 3, intensity: 8 },
  { label: 'Overwhelmed', polarity: 3, intensity: 9 },
  { label: 'Overwhelm', polarity: 3, intensity: 9 },
  { label: 'Frustrated', polarity: 2, intensity: 7 },
  { label: 'Frustration', polarity: 2, intensity: 7 },
  { label: 'Sad', polarity: 2, intensity: 5 },
  { label: 'Sadness', polarity: 2, intensity: 5 },
  { label: 'Lonely', polarity: 2, intensity: 4 },
  { label: 'Loneliness', polarity: 2, intensity: 4 },
  { label: 'Angry', polarity: 1, intensity: 9 },
  { label: 'Anger', polarity: 1, intensity: 9 },
  { label: 'Afraid', polarity: 1, intensity: 8 },
  { label: 'Fear', polarity: 1, intensity: 8 },
  { label: 'Relieved', polarity: 7, intensity: 3 },
  { label: 'Curious', polarity: 6, intensity: 5 },
  { label: 'Peaceful', polarity: 8, intensity: 2 },
  { label: 'Discouraged', polarity: 3, intensity: 4 },
];
