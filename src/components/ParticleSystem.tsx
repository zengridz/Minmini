import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  type: 'dust' | 'glint' | 'pollen';
  opacity: number;
}

export function ParticleSystem({ volume }: { volume: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const colors = ['#FF69B4', '#00CED1', '#9370DB', '#FFA500', '#FFD700', '#7FFF00'];

    const handleTrail = (e: any) => {
      const { x, y, color } = e.detail;
      particles.current.push({
        x: (x / 100) * canvas.width,
        y: (y / 100) * canvas.height,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        life: 1.0, // Full life for 3 seconds
        color: color || '#00ff88',
        size: 1.5 + Math.random() * 1.5,
        type: 'dust', // Using dust type but with specific life
        opacity: 0.8, // Brighter start
      });
    };

    window.addEventListener('butterfly-trail', handleTrail);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ambient Spawning (Dust and Pollen)
      if (particles.current.length < 150) {
        const type = Math.random() > 0.8 ? 'pollen' : 'dust';
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3, // Very slow
          vy: (Math.random() - 0.5) * 0.3,
          life: 0.5 + Math.random() * 0.5,
          color: type === 'pollen' ? '#FFD700' : '#FFFFFF',
          size: type === 'pollen' ? 1.5 : 0.8,
          type: type,
          opacity: 0.1 + Math.random() * 0.2,
        });
      }

      // Shimmering Glints (Occasional)
      if (Math.random() > 0.98) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          life: 0.8,
          color: '#FFFFFF',
          size: 1.2,
          type: 'glint',
          opacity: 0.8,
        });
      }

      // Update and draw particles
      const MAX_PARTICLES = 1000;
      if (particles.current.length > MAX_PARTICLES) {
        particles.current = particles.current.slice(-MAX_PARTICLES);
      }

      particles.current = particles.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        
        // Slower life decay for 3s lifespan (1 / (60fps * 3s) ≈ 0.0055)
        p.life -= p.type === 'glint' ? 0.02 : 0.0055;
        
        if (p.life <= 0) return false;

        // Shimmer effect for glints, fade for others
        const currentOpacity = p.type === 'glint' 
          ? p.opacity * Math.sin(Date.now() / 100) * p.life
          : p.opacity * p.life;

        ctx.globalAlpha = Math.max(0, currentOpacity);
        ctx.fillStyle = p.color;
        
        if (p.type === 'glint') {
          // Draw a small star/glint shape
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.size * 2);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.lineTo(p.x, p.y + p.size * 2);
          ctx.lineTo(p.x - p.size, p.y);
          ctx.closePath();
          ctx.fill();
        } else {
          // REMOVED: Expensive shadowBlur calls that kill performance over time
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.5 + p.life * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
        
        return true;
      });

      requestAnimationFrame(animate);
    };

    const frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('butterfly-trail', handleTrail);
    };
  }, [volume]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}
