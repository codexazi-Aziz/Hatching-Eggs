export enum GameState {
  WELCOME = 'WELCOME',
  SELECT_EGG = 'SELECT_EGG',
  HATCHING = 'HATCHING',
  PLAYING = 'PLAYING',
  CELEBRATION = 'CELEBRATION',
}

export enum AnimalType {
  CHICKEN = 'CHICKEN',
  DINO = 'DINO',
  DRAGON = 'DRAGON',
  TURTLE = 'TURTLE',
}

export interface AnimalDef {
  id: AnimalType;
  name: string;
  eggColor: string;
  eggEmoji: string;
  stages: {
    emoji: string;
    title: string;
    voice: string; // Voice preset name for Gemini TTS
  }[];
}

export interface UserData {
  name: string;
  age: number;
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string; // Fun fact to say after answering
}
