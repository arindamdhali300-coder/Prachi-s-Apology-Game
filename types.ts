export interface Vector2 {
  x: number;
  y: number;
}

export interface Projectile {
  id: string;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  active: boolean;
  color: string;
}

export interface Particle {
  id: string;
  pos: Vector2;
  vel: Vector2;
  life: number; // 0 to 1
  color: string;
  size: number;
}

export enum GamePhase {
  PLAYING = 'PLAYING',
  ENDING = 'ENDING', // Slow motion transition
  FINISHED = 'FINISHED', // Text display
}

export interface BilluState {
  pos: Vector2;
  scale: Vector2; // For squash/stretch
  targetScale: Vector2;
  rotation: number;
  isHit: boolean;
  hitTimer: number;
  mood: 'idle' | 'scared' | 'sorry' | 'relief';
  text: string | null;
  textTimer: number;
}