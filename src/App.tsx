/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
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
}

export default function App() {
  const [drawingPoints, setDrawingPoints] = useState<DrawingPoint[]>([]);
  const [isHandPresent, setIsHandPresent] = useState(false);

  const handlePointsUpdate = useCallback((points: DrawingPoint[]) => {
    setDrawingPoints(points);
  }, []);

  const handleHandPresenceUpdate = useCallback((isPresent: boolean) => {
    setIsHandPresent(isPresent);
  }, []);

  // Double the numbers: 50 moths
  const moths = Array.from({ length: 50 }, (_, i) => i);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white">
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
        <header className="text-center">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-6xl font-light tracking-tighter text-white/90"
          >
            LIGHTNING <span className="italic font-serif" style={{ color: EMERALD_THEME.color }}>MOTHS</span>
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            className="flex flex-col items-center gap-2 mt-4"
          >
            <p className="text-sm md:text-base font-light tracking-wide text-[#00ff88]">
              Draw with your palms to attract the moths
            </p>
          </motion.div>
        </header>

        <div /> {/* Spacer for middle */}

        <footer className="w-full flex justify-between items-end pointer-events-auto">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-white/60">
              <Hand size={14} />
              <span>Palm Tracking Active</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/40">
              No Audio Input
            </div>
          </div>
        </footer>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
    </div>
  );
}


