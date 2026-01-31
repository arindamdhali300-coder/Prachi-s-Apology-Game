import React, { useRef, useEffect } from 'react';
import { Vector2, Projectile, Particle, BilluState, GamePhase } from '../types';
import { GRAVITY, DRAG_POWER, MAX_DRAG_DIST, FRICTION, SPRING_STIFFNESS, SPRING_DAMPING, BILLU_PHRASES, COLORS, IDLE_PHRASES } from '../constants';
import { vecSub, vecMag, vecMult, checkCollision, updateSpring } from '../utils/physics';
import { drawBillu, drawParticles, drawAiming, drawGround } from '../utils/renderer';

interface GameCanvasProps {
  angerLevel: number;
  onHit: () => void;
  gamePhase: GamePhase;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ angerLevel, onHit, gamePhase }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs
  const projectiles = useRef<Projectile[]>([]);
  const particles = useRef<Particle[]>([]);
  const dragStart = useRef<Vector2 | null>(null);
  const dragCurrent = useRef<Vector2 | null>(null);
  const screenShake = useRef<number>(0);
  
  const billuState = useRef<BilluState>({
    pos: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    targetScale: { x: 1, y: 1 },
    rotation: 0,
    isHit: false,
    hitTimer: 0,
    mood: 'idle',
    text: null,
    textTimer: 0
  });

  const scaleVel = useRef<Vector2>({ x: 0, y: 0 });

  const handleStart = (x: number, y: number) => {
    if (gamePhase !== GamePhase.PLAYING) return;
    dragStart.current = { x, y };
    dragCurrent.current = { x, y };
    billuState.current.mood = 'scared';
  };

  const handleMove = (x: number, y: number) => {
    if (!dragStart.current || gamePhase !== GamePhase.PLAYING) return;
    
    const rawVector = vecSub({ x, y }, dragStart.current);
    const mag = vecMag(rawVector);
    
    if (mag > MAX_DRAG_DIST) {
      const normalized = vecMult(rawVector, MAX_DRAG_DIST / mag);
      dragCurrent.current = {
        x: dragStart.current.x + normalized.x,
        y: dragStart.current.y + normalized.y
      };
    } else {
      dragCurrent.current = { x, y };
    }
  };

  const handleEnd = () => {
    if (!dragStart.current || !dragCurrent.current || gamePhase !== GamePhase.PLAYING) return;
    
    const pullVector = vecSub(dragStart.current, dragCurrent.current);
    const mag = vecMag(pullVector);
    
    if (mag > 15) {
      const velocity = vecMult(pullVector, DRAG_POWER);
      
      const newProjectile: Projectile = {
        id: Math.random().toString(36),
        pos: { ...dragStart.current },
        vel: velocity,
        radius: 12,
        active: true,
        color: COLORS.projectile
      };
      projectiles.current.push(newProjectile);
    }
    
    dragStart.current = null;
    dragCurrent.current = null;
    
    setTimeout(() => {
      if (!billuState.current.isHit) billuState.current.mood = 'idle';
    }, 500);
  };

  const spawnParticles = (pos: Vector2, color: string) => {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.current.push({
        id: Math.random().toString(),
        pos: { ...pos },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 1.0,
        color: color,
        size: Math.random() * 5 + 3
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    
    // FPS Capping variables for 120Hz screens
    let lastTime = 0;
    const targetFPS = 60;
    const interval = 1000 / targetFPS;

    // Responsive High DPI Resize
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      
      // Normalize coordinate system to use CSS pixels
      ctx.scale(dpr, dpr);
      
      // CSS sizing
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      
      // Responsive positioning for Moto G73 (tall aspect ratio)
      // We position Billu 20% from the bottom, but ensure a minimum of 160px
      const bottomPadding = Math.max(160, window.innerHeight * 0.20);
      
      billuState.current.pos = {
        x: window.innerWidth / 2,
        y: window.innerHeight - bottomPadding
      };
    };
    
    window.addEventListener('resize', resize);
    resize();

    const loop = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(loop);
      
      const deltaTime = timestamp - lastTime;
      if (deltaTime < interval) return;
      
      // Adjust for refresh rate variance
      lastTime = timestamp - (deltaTime % interval);
      time += 1;
      
      // --- UPDATE LOGIC ---

      // Projectiles
      for (let i = projectiles.current.length - 1; i >= 0; i--) {
        const p = projectiles.current[i];
        if (!p.active) continue;

        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;
        p.vel.y += GRAVITY;
        p.vel.x *= 0.999; 

        // Screen bounds floor (virtual floor at bottom of screen)
        const floorY = window.innerHeight - 20;
        
        if (p.pos.y > floorY) {
          p.pos.y = floorY;
          p.vel.y *= -0.5;
          p.vel.x *= FRICTION;
          
          if (Math.abs(p.vel.y) < 1 && Math.abs(p.vel.x) < 1) {
            p.active = false;
            projectiles.current.splice(i, 1);
            continue;
          }
        }
        
        // Check Collision
        if (gamePhase === GamePhase.PLAYING && checkCollision(p, billuState.current, 55)) {
           p.active = false;
           spawnParticles(p.pos, COLORS.projectile);
           spawnParticles(p.pos, '#FFFFFF');
           
           // Trigger hit state
           billuState.current.isHit = true;
           billuState.current.hitTimer = 30;
           billuState.current.mood = 'sorry';
           billuState.current.scale = { x: 1.25, y: 0.8 }; // Squash
           scaleVel.current = { x: 0, y: 0 };
           
           // Add Screen Shake
           screenShake.current = 15;
           
           onHit();

           // Random Text
           billuState.current.text = BILLU_PHRASES[Math.floor(Math.random() * BILLU_PHRASES.length)];
           billuState.current.textTimer = 120;
           projectiles.current.splice(i, 1);
        }
      }

      // Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const pt = particles.current[i];
        pt.pos.x += pt.vel.x;
        pt.pos.y += pt.vel.y;
        pt.vel.y += GRAVITY * 0.4;
        pt.life -= 0.025;
        if (pt.life <= 0) particles.current.splice(i, 1);
      }

      // Billu Animation (Spring)
      const b = billuState.current;
      const breath = Math.sin(time * 0.05) * 0.02;
      const targetX = 1 + breath;
      const targetY = 1 - breath;

      const springX = updateSpring(b.scale.x, targetX, scaleVel.current.x, SPRING_STIFFNESS, SPRING_DAMPING);
      b.scale.x = springX.val;
      scaleVel.current.x = springX.vel;

      const springY = updateSpring(b.scale.y, targetY, scaleVel.current.y, SPRING_STIFFNESS, SPRING_DAMPING);
      b.scale.y = springY.val;
      scaleVel.current.y = springY.vel;

      if (b.hitTimer > 0) {
        b.hitTimer--;
        b.rotation = (Math.random() - 0.5) * 0.15; // Jiggle
        if (b.hitTimer === 0) {
          b.isHit = false;
          b.rotation = 0;
          b.mood = 'idle';
        }
      } else {
        b.rotation *= 0.8;
      }

      // Idle Text
      if (gamePhase === GamePhase.PLAYING && b.textTimer <= 0 && Math.random() < 0.003) {
        b.text = IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)];
        b.textTimer = 150;
      }
      if (b.textTimer > 0) b.textTimer--;
      else if (b.textTimer <= 0) b.text = null;

      if (gamePhase === GamePhase.ENDING) {
        b.mood = 'relief';
        b.text = null;
      }

      // --- RENDER ---
      
      // Clear with transparency
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); // Use logical size
      
      ctx.save();
      
      // Screen Shake Application
      if (screenShake.current > 0) {
        const dx = (Math.random() - 0.5) * screenShake.current;
        const dy = (Math.random() - 0.5) * screenShake.current;
        ctx.translate(dx, dy);
        screenShake.current *= 0.9; // Decay
        if (screenShake.current < 0.5) screenShake.current = 0;
      }

      // Draw Ground
      drawGround(ctx, b.pos);

      // Draw Projectiles
      projectiles.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(p.pos.x - 3, p.pos.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Aiming Guide
      if (dragStart.current && dragCurrent.current) {
         const pullVector = vecSub(dragStart.current, dragCurrent.current);
         const vel = vecMult(pullVector, DRAG_POWER);
         drawAiming(ctx, dragStart.current, dragCurrent.current, vel, GRAVITY);
      }

      // Draw Billu
      drawBillu(ctx, b, time);
      
      // Draw Particles
      drawParticles(ctx, particles.current);

      // Draw Speech Bubble (Screen space, unaffected by Billu rotation)
      if (b.text) {
        ctx.save();
        ctx.translate(b.pos.x + 60, b.pos.y - 150);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0,0,0,0.05)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;
        
        const pad = 20;
        ctx.font = '700 16px Nunito';
        const metrics = ctx.measureText(b.text);
        const w = Math.max(120, metrics.width + pad * 2);
        const h = 46;
        
        // Bubble body
        ctx.beginPath();
        ctx.roundRect(-20, -h/2, w, h, 23);
        ctx.fill();
        
        // Tail
        ctx.beginPath();
        ctx.moveTo(-10, h/2 - 5);
        ctx.lineTo(-20, h/2 + 10);
        ctx.lineTo(0, h/2 - 5);
        ctx.fill();

        // Text
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.text, w/2 - 20, 1); // Center relative to rect
        
        ctx.restore();
      }
      
      ctx.restore(); // Pop Shake transform
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [gamePhase, onHit]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 cursor-crosshair touch-none select-none active:cursor-grabbing"
      style={{ touchAction: 'none' }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
    />
  );
};

export default GameCanvas;