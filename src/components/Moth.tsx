import { motion, useAnimation } from 'motion/react';
import { useEffect, useRef } from 'react';

interface MothProps {
  id: number;
  volume: number;
  drawingPoints: { x: number; y: number; timestamp: number; handId: number }[];
  isHandPresent: boolean;
  themeColor: string;
  key?: number;
}

export function Moth({ id, volume, drawingPoints, isHandPresent, themeColor }: MothProps) {
  const controls = useAnimation();
  const x = useRef(Math.random() * 100);
  const y = useRef(Math.random() * 100);
  const angle = useRef(Math.random() * 360);
  
  // 20% of moths are "quick" and highly reactive
  const isQuick = id % 5 === 0;
  const baseSpeed = useRef((isQuick ? 0.6 : 0.3) + Math.random() * 0.4);
  const currentSpeed = useRef(baseSpeed.current);
  const noiseOffset = useRef(Math.random() * 1000);
  
  // Use refs to avoid effect restarts on every frame
  const drawingPointsRef = useRef(drawingPoints);
  const isHandPresentRef = useRef(isHandPresent);

  useEffect(() => {
    drawingPointsRef.current = drawingPoints;
    isHandPresentRef.current = isHandPresent;
  }, [drawingPoints, isHandPresent]);

  useEffect(() => {
    let frame: number;
    let trailCounter = 0;
    
    const move = () => {
      controls.set({ opacity: 1 });

      let targetAngle = angle.current;

      // Attraction to drawing points - ONLY when hand is present
      const currentPoints = drawingPointsRef.current;
      if (isHandPresentRef.current && currentPoints.length > 0) {
        let nearestPoint;
        let minDist = Infinity;

        if (isQuick) {
          // Quick moths prioritize the LATEST points (the hand itself)
          // We look at the last 5 points added
          const latestPoints = currentPoints.slice(-5);
          nearestPoint = latestPoints[latestPoints.length - 1];
          const dx = nearestPoint.x - x.current;
          const dy = nearestPoint.y - y.current;
          minDist = dx * dx + dy * dy;
        } else {
          // Normal moths follow the nearest point in the whole trail
          nearestPoint = currentPoints[0];
          currentPoints.forEach(p => {
            const dx = p.x - x.current;
            const dy = p.y - y.current;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
              minDist = dist;
              nearestPoint = p;
            }
          });
        }

        if (minDist < (isQuick ? 2500 : 600)) { 
          const dx = nearestPoint.x - x.current;
          const dy = nearestPoint.y - y.current;
          
          const noise = Math.sin(Date.now() / 200 + noiseOffset.current) * (isQuick ? 10 : 30);
          targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + noise;
          
          currentSpeed.current = baseSpeed.current * (isQuick ? 1.4 : 1.8);
        } else {
          currentSpeed.current = baseSpeed.current;
        }
      } else {
        currentSpeed.current = baseSpeed.current;
      }

      // Smoothly rotate towards target angle
      const angleDiff = ((targetAngle - angle.current + 180) % 360) - 180;
      const rotationSpeed = isQuick ? 0.15 : 0.08;
      angle.current += angleDiff * rotationSpeed + (Math.random() - 0.5) * (isQuick ? 5 : 15);
      
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
        scale: isQuick ? 0.7 : 0.6, 
      });

      // Spawn trail particle for some moths
      if (id % 3 === 0) {
        trailCounter++;
        if (trailCounter >= 3) {
          // Use theme-based trail colors
          const trailColor = Math.random() > 0.5 ? themeColor : '#ffffff';
          window.dispatchEvent(new CustomEvent('butterfly-trail', {
            detail: { x: x.current, y: y.current, color: trailColor }
          }));
          trailCounter = 0;
        }
      }

      frame = requestAnimationFrame(move);
    };

    move();
    return () => cancelAnimationFrame(frame);
  }, [controls, themeColor]); // Removed drawingPoints and isHandPresent from dependencies

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
