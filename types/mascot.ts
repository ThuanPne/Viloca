export type MascotEmotion =
  | 'idle'
  | 'happy'
  | 'excited'
  | 'exploring';

export interface MascotState {
  emotion: MascotEmotion;
  greeting: string;
}

export type MascotBubbleVariant = 'tip' | 'ai' | 'success' | 'error' | 'encouragement';
