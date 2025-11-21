import { AnimalDef, AnimalType } from './types';

export const ANIMALS: Record<AnimalType, AnimalDef> = {
  [AnimalType.CHICKEN]: {
    id: AnimalType.CHICKEN,
    name: 'Chicken',
    eggColor: 'bg-yellow-200 border-yellow-400',
    eggEmoji: '🥚',
    stages: [
      { emoji: '🐣', title: 'Hatching', voice: 'Puck' },
      { emoji: '🐣', title: 'Newborn Chick', voice: 'Puck' },
      { emoji: '🐥', title: 'Fluffy Chick', voice: 'Puck' },
      { emoji: '🐥', title: 'Little Bird', voice: 'Puck' },
      { emoji: '🐤', title: 'Growing Bird', voice: 'Kore' },
      { emoji: '🐓', title: 'Young Rooster', voice: 'Fenrir' },
      { emoji: '🐓', title: 'Big Rooster', voice: 'Fenrir' },
      { emoji: '👑🐓', title: 'Royal Rooster', voice: 'Fenrir' },
    ],
  },
  [AnimalType.DINO]: {
    id: AnimalType.DINO,
    name: 'Dino',
    eggColor: 'bg-green-200 border-green-400',
    eggEmoji: '🥚',
    stages: [
      { emoji: '🥚', title: 'Cracking Egg', voice: 'Puck' },
      { emoji: '🦖', title: 'Tiny Dino', voice: 'Puck' },
      { emoji: '🦎', title: 'Little Hunter', voice: 'Puck' },
      { emoji: '🦎', title: 'Fast Runner', voice: 'Puck' },
      { emoji: '🐉', title: 'Young Dino', voice: 'Zephyr' },
      { emoji: '🦖', title: 'Big Dino', voice: 'Fenrir' },
      { emoji: '🦖', title: 'T-Rex', voice: 'Fenrir' },
      { emoji: '👑🦖', title: 'King Rex', voice: 'Fenrir' },
    ],
  },
  [AnimalType.DRAGON]: {
    id: AnimalType.DRAGON,
    name: 'Dragon',
    eggColor: 'bg-red-200 border-red-400',
    eggEmoji: '🥚',
    stages: [
      { emoji: '🥚', title: 'Hot Egg', voice: 'Puck' },
      { emoji: '🦎', title: 'Baby Dragon', voice: 'Puck' },
      { emoji: '🔥', title: 'Little Spark', voice: 'Puck' },
      { emoji: '🐉', title: 'Smoke Breather', voice: 'Charon' },
      { emoji: '🐉', title: 'Young Drake', voice: 'Charon' },
      { emoji: '🐲', title: 'Flying Dragon', voice: 'Fenrir' },
      { emoji: '🐲', title: 'Fire Dragon', voice: 'Fenrir' },
      { emoji: '👑🐲', title: 'Elder Dragon', voice: 'Fenrir' },
    ],
  },
  [AnimalType.TURTLE]: {
    id: AnimalType.TURTLE,
    name: 'Turtle',
    eggColor: 'bg-emerald-200 border-emerald-400',
    eggEmoji: '🥚',
    stages: [
      { emoji: '🐢', title: 'Hatchling', voice: 'Puck' },
      { emoji: '🐢', title: 'Tiny Turtle', voice: 'Puck' },
      { emoji: '💧', title: 'Pond Swimmer', voice: 'Puck' },
      { emoji: '💧', title: 'River Turtle', voice: 'Puck' },
      { emoji: '🐢', title: 'Shell Grower', voice: 'Kore' },
      { emoji: '🌊', title: 'Sea Turtle', voice: 'Fenrir' },
      { emoji: '🌊', title: 'Ocean Traveler', voice: 'Fenrir' },
      { emoji: '👑🐢', title: 'Wise Tortoise', voice: 'Fenrir' },
    ],
  },
};

export const TOTAL_STAGES = 8;