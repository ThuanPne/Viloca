export type MascotEmotion =
  | 'idle'
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'surprised'
  | 'love'
  | 'winking'
  | 'walking'
  | 'exploring'
  | 'celebrating'
  | 'talking'
  | 'sleeping';

export interface MascotState {
  emotion: MascotEmotion;
  greeting: string;
}

export type MascotBubbleVariant = 'tip' | 'ai' | 'success' | 'error' | 'encouragement';
