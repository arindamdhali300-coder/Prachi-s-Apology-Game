import { BilluState, Particle, Vector2 } from '../types';
import { COLORS } from '../constants';

export const drawGround = (ctx: CanvasRenderingContext2D, pos: Vector2) => {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  
  // Large ambient ground glow
  const grad = ctx.createRadialGradient(0, 20, 50, 0, 20, 250);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 20, 200, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const drawBillu = (
  ctx: CanvasRenderingContext2D,
  state: BilluState,
  time: number
) => {
  const { pos, scale, mood, rotation } = state;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(rotation);
  ctx.scale(scale.x, scale.y);

  // Shadow (sharper contact shadow)
  ctx.fillStyle = 'rgba(71, 85, 105, 0.15)'; // Slate-600 with opacity
  ctx.beginPath();
  ctx.ellipse(0, 10, 55, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (Squishy rounded rectangle/capsule)
  ctx.fillStyle = COLORS.billuBody;
  ctx.beginPath();
  // Drawing a soft capsule
  ctx.roundRect(-40, -90, 80, 100, 40);
  ctx.fill();
  
  // Subtle gradient on body for volume
  const bodyGrad = ctx.createLinearGradient(-40, -90, 40, 10);
  bodyGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
  bodyGrad.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Head (Circle)
  ctx.fillStyle = COLORS.billuSkin;
  ctx.beginPath();
  ctx.arc(0, -95, 45, 0, Math.PI * 2);
  ctx.fill();

  // Face Expression Logic
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Eyes
  const eyeOffset = mood === 'scared' ? 12 : 15;
  const eyeY = -100;
  
  if (mood === 'relief') {
    // Closed happy eyes ^ ^
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#334155'; // Slate-700
    
    ctx.beginPath();
    ctx.moveTo(-25, eyeY);
    ctx.quadraticCurveTo(-20, eyeY - 8, -15, eyeY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(15, eyeY);
    ctx.quadraticCurveTo(20, eyeY - 8, 25, eyeY);
    ctx.stroke();
  } else if (state.isHit) {
    // > < eyes
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#334155';
    
    // Left >
    ctx.beginPath();
    ctx.moveTo(-28, eyeY - 6);
    ctx.lineTo(-18, eyeY);
    ctx.lineTo(-28, eyeY + 6);
    ctx.stroke();
    
    // Right <
    ctx.beginPath();
    ctx.moveTo(28, eyeY - 6);
    ctx.lineTo(18, eyeY);
    ctx.lineTo(28, eyeY + 6);
    ctx.stroke();

  } else {
    // Standard eyes
    // Blinking logic
    const blink = Math.sin(time * 0.005) > 0.98;
    ctx.fillStyle = '#1E293B'; // Slate-800
    
    if (blink && mood !== 'scared') {
      ctx.fillRect(-25, eyeY, 10, 2);
      ctx.fillRect(15, eyeY, 10, 2);
    } else {
      // Pupils look at mouse/aim direction if scared
      let pupilX = 0;
      let pupilY = 0;
      
      if (mood === 'scared') {
        pupilX = (Math.random() - 0.5) * 2;
        pupilY = (Math.random() - 0.5) * 2;
        
        // Eyebrows for scared
        ctx.beginPath();
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2;
        ctx.moveTo(-30, eyeY - 12);
        ctx.lineTo(-20, eyeY - 15);
        ctx.moveTo(20, eyeY - 15);
        ctx.lineTo(30, eyeY - 12);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(-20 + pupilX, eyeY + pupilY, 5, 0, Math.PI * 2);
      ctx.arc(20 + pupilX, eyeY + pupilY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye shine
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(-18 + pupilX, eyeY + pupilY - 2, 2, 0, Math.PI * 2);
      ctx.arc(22 + pupilX, eyeY + pupilY - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Mouth
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#334155';
  ctx.beginPath();
  if (mood === 'scared') {
    // O mouth
    ctx.ellipse(0, -75, 4, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (mood === 'sorry' || mood === 'idle') {
    // Small wobble mouth
    const wobble = Math.sin(time * 0.1) * 1;
    ctx.moveTo(-6, -75 + wobble);
    ctx.quadraticCurveTo(0, -78, 6, -75 - wobble);
    ctx.stroke();
  } else if (mood === 'relief') {
    // Smile
    ctx.arc(0, -80, 10, 0.2, Math.PI - 0.2, false);
    ctx.stroke();
  }
  
  // Blush
  ctx.fillStyle = 'rgba(244, 63, 94, 0.15)'; // Rose-500 low opacity
  ctx.beginPath();
  ctx.arc(-32, -88, 10, 0, Math.PI * 2);
  ctx.arc(32, -88, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

export const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
};

export const drawAiming = (
  ctx: CanvasRenderingContext2D, 
  start: Vector2, 
  current: Vector2,
  velocity: Vector2,
  gravity: number
) => {
  ctx.save();
  
  // 1. Draw Elastic Band (Visual only, behind puck)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(current.x, current.y);
  ctx.stroke();

  // 2. Draw Trajectory (Dotted line)
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  
  let simPos = { ...start };
  let simVel = { ...velocity };
  
  for (let i = 0; i < 25; i++) {
    simPos.x += simVel.x;
    simPos.y += simVel.y;
    simVel.y += gravity;
    
    // Draw dot
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - i / 20)})`;
    ctx.beginPath();
    ctx.arc(simPos.x, simPos.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 3. Draw Puck at finger position
  ctx.fillStyle = COLORS.projectile;
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(current.x, current.y, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner puck detail
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(current.x, current.y, 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
};