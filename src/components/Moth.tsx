import { motion, useAnimation } from 'motion/react';
import { useEffect, useRef } from 'react';

interface MothProps {
  id: number;
  volume: number;
  drawingPoints: { x: number; y: number; timestamp: number }[];
  isHandPresent: boolean;
  themeColor: string;
  key?: number;
}

export function Moth({ id, volume, drawingPoints, isHandPresent, themeColor }: MothProps) {
  const controls = useAnimation();
  const x = useRef(Math.random() * 100);
  const y = useRef(Math.random() * 100);
  const angle = useRef(Math.random() * 360);
  // Moths are faster than butterflies
  const baseSpeed = useRef(0.3 + Math.random() * 0.4);
  const currentSpeed = useRef(baseSpeed.current);
  const noiseOffset = useRef(Math.random() * 1000);
  
  useEffect(() => {
    let frame: number;
    let trailCounter = 0;
    
    const move = () => {
      controls.set({ opacity: 1 });

      let targetAngle = angle.current;

      // Attraction to drawing points - ONLY when hand is present
      if (isHandPresent && drawingPoints.length > 0) {
        // Find nearest point
        let nearestPoint = drawingPoints[0];
        let minDist = Infinity;
        
        drawingPoints.forEach(p => {
          const dx = p.x - x.current;
          const dy = p.y - y.current;
          const dist = dx * dx + dy * dy;
          if (dist < minDist) {
            minDist = dist;
            nearestPoint = p;
          }
        });

        if (minDist < 600) { // Slightly larger attraction radius
          const dx = nearestPoint.x - x.current;
          const dy = nearestPoint.y - y.current;
          
          // Add some noise to the target angle so they don't all cluster on the exact same spot
          const noise = Math.sin(Date.now() / 200 + noiseOffset.current) * 30;
          targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + noise;
          
          currentSpeed.current = baseSpeed.current * 1.8; // Speed up when attracted
        } else {
          currentSpeed.current = baseSpeed.current;
        }
      } else {
        currentSpeed.current = baseSpeed.current;
      }

      // Smoothly rotate towards target angle or wander
      const angleDiff = ((targetAngle - angle.current + 180) % 360) - 180;
      angle.current += angleDiff * 0.08 + (Math.random() - 0.5) * 15;
      
      const rad = (angle.current * Math.PI) / 180;
      const speed = currentSpeed.current;
      
      x.current += Math.cos(rad) * speed;
      y.current += Math.sin(rad) * speed;

      // Wrap around screen
      if (x.current < -5) x.current = 105;
      if (x.current > 105) x.current = -5;
      if (y.current < -5) y.current = 105;
      if (y.current > 105) y.current = -5;

      controls.set({
        left: `${x.current}%`,
        top: `${y.current}%`,
        rotate: angle.current + 90,
        scale: 0.6, // Constant scale
      });

      // Spawn trail particle
      trailCounter++;
      if (trailCounter >= 2) {
        window.dispatchEvent(new CustomEvent('butterfly-trail', {
          detail: { x: x.current, y: y.current, color: themeColor }
        }));
        trailCounter = 0;
      }

      frame = requestAnimationFrame(move);
    };

    move();
    return () => cancelAnimationFrame(frame);
  }, [controls, volume, drawingPoints, isHandPresent, themeColor]);

  return (
    <motion.div
      animate={controls}
      style={{
        position: 'absolute',
        width: '20px', // Smaller
        height: '20px',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* Moth Wings - more triangular/fuzzy than butterflies */}
      <motion.div
        animate={{
          rotateY: [0, 70, 0],
        }}
        transition={{
          duration: 0.15, // Constant fast flapping
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: 'absolute',
          left: '0',
          width: '10px',
          height: '20px',
          background: `linear-gradient(to bottom right, ${themeColor}, transparent)`,
          borderRadius: '10px 0 0 5px',
          transformOrigin: 'right center',
          filter: `drop-shadow(0 0 5px ${themeColor})`,
          opacity: 0.9,
        }}
      />

      <motion.div
        animate={{
          rotateY: [0, -70, 0],
        }}
        transition={{
          duration: 0.15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: 'absolute',
          right: '0',
          width: '10px',
          height: '20px',
          background: `linear-gradient(to bottom left, ${themeColor}, transparent)`,
          borderRadius: '0 10px 5px 0',
          transformOrigin: 'left center',
          filter: `drop-shadow(0 0 5px ${themeColor})`,
          opacity: 0.9,
        }}
      />

      {/* Body - glowing point */}
      <div
        style={{
          position: 'absolute',
          left: '9px',
          top: '5px',
          width: '2px',
          height: '10px',
          backgroundColor: '#fff',
          boxShadow: `0 0 15px 2px ${themeColor}`,
          borderRadius: '1px',
          zIndex: 11,
        }}
      />
    </motion.div>
  );
}
