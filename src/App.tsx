/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hand } from 'lucide-react';
import { Moth } from './components/Moth';
import { ParticleSystem } from './components/ParticleSystem';
import { HandTracker } from './components/HandTracker';

const EMERALD_THEME = {
  color: '#00ff88',
  bg: 'radial-gradient(circle at 50% 30%, #103a25 0%, transparent 60%), radial-gradient(circle at 10% 80%, #00ff88 0%, transparent 50%)'
};

interface DrawingPoint {
  x: number;
  y: number;
  timestamp: number;
  handId: number;
}

export default function App() {
  const [drawingPoints, setDrawingPoints] = useState<DrawingPoint[]>([]);
  const [isHandPresent, setIsHandPresent] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    if (isHandPresent) {
      setIsIdle(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsIdle(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isHandPresent]);

  const handlePointsUpdate = useCallback((points: DrawingPoint[]) => {
    setDrawingPoints(points);
  }, []);

  const handleHandPresenceUpdate = useCallback((isPresent: boolean) => {
    setIsHandPresent(isPresent);
  }, []);

  // Double the numbers: 50 moths
  const moths = Array.from({ length: 50 }, (_, i) => i);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-lcd text-white">
      {/* Camera & Hand Tracking Background */}
      <HandTracker onPointsUpdate={handlePointsUpdate} onHandPresenceUpdate={handleHandPresenceUpdate} />

      {/* Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
          style={{
            background: EMERALD_THEME.bg,
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* Particle System */}
      <ParticleSystem volume={0} />

      {/* Moths */}
      {moths.map((id) => (
        <Moth 
          key={id} 
          id={id} 
          volume={0} 
          drawingPoints={drawingPoints}
          isHandPresent={isHandPresent}
          themeColor={EMERALD_THEME.color} 
        />
      ))}

      {/* UI Overlay */}
      <div className="relative z-20 flex flex-col items-center justify-between h-full p-8 pointer-events-none">
        <header className="text-center mt-12">
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 0.7 }}
            className="text-lg md:text-xl font-special tracking-widest text-white/80 mb-2"
          >
            Welcome to the garden of
          </motion.p>
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-8xl text-white/90 font-special uppercase tracking-tighter"
          >
            Lightning <span style={{ color: EMERALD_THEME.color }}>Moths</span>
          </motion.h1>
        </header>

        <div className="flex items-center justify-center">
          <AnimatePresence>
            {isIdle && !isHandPresent && (
              <TypewriterText 
                text="Gently wave… they’ll gather" 
                className="text-2xl md:text-4xl font-special tracking-widest text-white/60 text-center"
              />
            )}
          </AnimatePresence>
        </div>

        <footer className="w-full flex justify-between items-end pointer-events-auto">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-white/60">
              <Hand size={14} />
              <span>Palm Tracking Active</span>
            </div>
          </div>

          <div className="flex gap-4">
          </div>
        </footer>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
    </div>
  );
}

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const characters = text.split("");
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.04 * i },
    }),
    exit: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 10,
    },
  };

  return (
    <motion.div
      style={{ display: "flex", overflow: "hidden" }}
      variants={container}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {characters.map((char, index) => (
        <motion.span variants={child} key={index}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.div>
  );
}


