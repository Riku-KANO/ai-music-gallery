import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export const PerformanceMonitor: React.FC = () => {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fps = useRef(0);

  useFrame(() => {
    frameCount.current++;
    const currentTime = performance.now();

    if (currentTime - lastTime.current >= 1000) {
      fps.current = frameCount.current;
      frameCount.current = 0;
      lastTime.current = currentTime;

      if (fps.current < 30) {
        console.warn(`Low FPS detected: ${fps.current}`);
      }
    }
  });

  return null;
};
