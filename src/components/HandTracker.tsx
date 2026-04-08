import { useEffect, useRef, useState } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

interface Point {
  x: number;
  y: number;
  timestamp: number;
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
        
        for (const landmarks of landmarksList) {
          const palm = landmarks[9];
          const x = (1 - palm.x) * 100; // Mirror X
          const y = palm.y * 100;

          pointsRef.current.push({ x, y, timestamp: now });
          newPointsAdded = true;
        }
      }

      // Filter out points older than 7 seconds
      pointsRef.current = pointsRef.current.filter(p => now - p.timestamp < 7000);
      
      if (newPointsAdded || pointsRef.current.length > 0) {
        onPointsUpdate([...pointsRef.current]);
      }

      // Draw the "ink" - make it much brighter and more visible
      canvasCtx.save();
      pointsRef.current.forEach(p => {
        const age = now - p.timestamp;
        const opacity = 1 - age / 7000;
        
        // REMOVED: Expensive shadowBlur calls that kill performance over time
        canvasCtx.fillStyle = `rgba(0, 255, 136, ${opacity})`;
        
        canvasCtx.beginPath();
        canvasCtx.arc((p.x / 100) * canvasRef.current!.width, (p.y / 100) * canvasRef.current!.height, 8, 0, Math.PI * 2);
        canvasCtx.fill();
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
