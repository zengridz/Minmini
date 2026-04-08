import { useState, useEffect, useRef } from 'react';

export function useAudioAnalyzer() {
  const [volume, setVolume] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isClapped, setIsClapped] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastClapTime = useRef<number>(0);

  const startAnalyzing = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      
      analyzer.fftSize = 256;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyzer);
      
      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;
      dataArrayRef.current = dataArray;
      setIsAnalyzing(true);

      let prevVolume = 0;

      const update = () => {
        if (analyzerRef.current && dataArrayRef.current) {
          analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const average = sum / dataArrayRef.current.length;
          const currentVolume = average / 255;
          setVolume(currentVolume);

          // Simple clap detection: sudden spike in volume
          const now = Date.now();
          if (currentVolume > 0.3 && currentVolume > prevVolume * 2.5 && now - lastClapTime.current > 1000) {
            setIsClapped(true);
            lastClapTime.current = now;
            setTimeout(() => setIsClapped(false), 3000); // Disappear for 3 seconds
          }
          prevVolume = currentVolume;
        }
        animationFrameRef.current = requestAnimationFrame(update);
      };

      update();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopAnalyzing = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsAnalyzing(false);
    setVolume(0);
    setIsClapped(false);
  };

  useEffect(() => {
    return () => {
      stopAnalyzing();
    };
  }, []);

  return { volume, isAnalyzing, isClapped, startAnalyzing, stopAnalyzing };
}
