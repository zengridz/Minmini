import { useEffect, useRef, useState } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

interface Point {
  x: number;
  y: number;
  timestamp: number;
  handId: number;
}

interface HandTrackerProps {
  onPointsUpdate: (points: Point[]) => void;
  onHandPresenceUpdate: (isPresent: boolean) => void;
}

export function HandTracker({ onPointsUpdate, onHandPresenceUpdate }: HandTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const pointsRef = useRef<Point[]>([]);
  const isHandPresentRef = useRef<boolean>(false);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    hands.onResults((results: Results) => {
      const canvasCtx = canvasRef.current?.getContext('2d');
      if (!canvasCtx || !canvasRef.current) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      const now = Date.now();
      let newPointsAdded = false;
      const currentlyPresent = !!(results.multiHandLandmarks && results.multiHandLandmarks.length > 0);

      if (currentlyPresent !== isHandPresentRef.current) {
        isHandPresentRef.current = currentlyPresent;
        onHandPresenceUpdate(currentlyPresent);
      }

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarksList = results.multiHandLandmarks;
        
        for (let i = 0; i < landmarksList.length; i++) {
          const landmarks = landmarksList[i];
          const palm = landmarks[9];
          const x = (1 - palm.x) * 100; // Mirror X
          const y = palm.y * 100;

          pointsRef.current.push({ x, y, timestamp: now, handId: i });
          newPointsAdded = true;
        }
      }

      // Filter out points older than 15 seconds
      pointsRef.current = pointsRef.current.filter(p => now - p.timestamp < 15000);
      
      if (newPointsAdded || pointsRef.current.length > 0) {
        onPointsUpdate([...pointsRef.current]);
      }

      // Draw the "light streaks"
      canvasCtx.save();
      
      // Group points by handId
      const pointsByHand: Record<number, Point[]> = {};
      pointsRef.current.forEach(p => {
        if (!pointsByHand[p.handId]) pointsByHand[p.handId] = [];
        pointsByHand[p.handId].push(p);
      });

      Object.values(pointsByHand).forEach(handPoints => {
        if (handPoints.length < 2) return;

        for (let i = 1; i < handPoints.length; i++) {
          const p1 = handPoints[i-1];
          const p2 = handPoints[i];
          
          // Only connect if they are close in time to avoid jumps
          if (p2.timestamp - p1.timestamp > 300) continue;

          const age = now - p2.timestamp;
          const opacity = 1 - age / 15000;
          if (opacity <= 0) continue;

          const x1 = (p1.x / 100) * canvasRef.current!.width;
          const y1 = (p1.y / 100) * canvasRef.current!.height;
          const x2 = (p2.x / 100) * canvasRef.current!.width;
          const y2 = (p2.y / 100) * canvasRef.current!.height;

          // Glow pass (Orangish/Amber)
          canvasCtx.beginPath();
          canvasCtx.moveTo(x1, y1);
          canvasCtx.lineTo(x2, y2);
          // Use a mix of deep orange and amber for the glow
          const glowColor = i % 2 === 0 ? '255, 120, 0' : '255, 180, 0';
          canvasCtx.strokeStyle = `rgba(${glowColor}, ${opacity * 0.35})`;
          canvasCtx.lineWidth = 18; // Wider glow
          canvasCtx.lineCap = 'round';
          canvasCtx.lineJoin = 'round';
          canvasCtx.stroke();

          // Secondary glow (Inner Orange)
          canvasCtx.beginPath();
          canvasCtx.moveTo(x1, y1);
          canvasCtx.lineTo(x2, y2);
          canvasCtx.strokeStyle = `rgba(255, 100, 0, ${opacity * 0.5})`;
          canvasCtx.lineWidth = 8;
          canvasCtx.stroke();

          // Core pass (White/Yellow)
          canvasCtx.beginPath();
          canvasCtx.moveTo(x1, y1);
          canvasCtx.lineTo(x2, y2);
          canvasCtx.strokeStyle = `rgba(255, 255, 200, ${opacity})`;
          canvasCtx.lineWidth = 2.5;
          canvasCtx.lineCap = 'round';
          canvasCtx.lineJoin = 'round';
          canvasCtx.stroke();
        }
      });
      
      canvasCtx.restore();
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, [onPointsUpdate, onHandPresenceUpdate]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <video ref={videoRef} className="hidden" playsInline />
      
      {/* Small Camera Preview in Corner */}
      <div className="absolute bottom-8 right-8 w-48 h-36 border-2 border-white/20 rounded-lg overflow-hidden bg-black z-50 pointer-events-auto">
        <canvas 
          ref={(el) => {
            if (el && videoRef.current) {
              const ctx = el.getContext('2d');
              const render = () => {
                if (ctx && videoRef.current) {
                  ctx.save();
                  ctx.scale(-1, 1);
                  ctx.translate(-el.width, 0);
                  ctx.drawImage(videoRef.current, 0, 0, el.width, el.height);
                  ctx.restore();
                }
                requestAnimationFrame(render);
              };
              render();
            }
          }}
          width={320}
          height={240}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Drawing Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        width={1280}
        height={720}
      />
    </div>
  );
}
