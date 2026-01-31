import { Vector2, Projectile, BilluState } from '../types';

export const vecAdd = (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x + v2.x, y: v1.y + v2.y });
export const vecSub = (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x - v2.x, y: v1.y - v2.y });
export const vecMult = (v: Vector2, n: number): Vector2 => ({ x: v.x * n, y: v.y * n });
export const vecMag = (v: Vector2): number => Math.sqrt(v.x * v.x + v.y * v.y);
export const vecNorm = (v: Vector2): Vector2 => {
  const m = vecMag(v);
  return m === 0 ? { x: 0, y: 0 } : vecMult(v, 1 / m);
};
export const vecDist = (v1: Vector2, v2: Vector2): number => vecMag(vecSub(v1, v2));

export const checkCollision = (p: Projectile, billu: BilluState, billuRadius: number): boolean => {
  if (!p.active) return false;
  // Simple circle collision for the sake of "game feel" forgiveness
  const dist = vecDist(p.pos, { x: billu.pos.x, y: billu.pos.y - 40 }); // Offset center to body
  return dist < (p.radius + billuRadius);
};

// Procedural Animation helper: Spring logic
export const updateSpring = (current: number, target: number, vel: number, k: number, d: number) => {
  const force = (target - current) * k;
  const newVel = (vel + force) * d;
  return { val: current + newVel, vel: newVel };
};