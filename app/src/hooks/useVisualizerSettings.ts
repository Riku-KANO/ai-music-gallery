import { useState, useCallback, useMemo } from 'react';
import type { VisualizerConfig, VisualizerTheme } from '../types/visualizer';

const DEFAULT_COLOR_SCHEMES = {
  ocean: ['#00d9ff', '#0099ff', '#0066ff', '#ff00ff', '#00ffff'],
  sunset: ['#ff6b6b', '#ff8e53', '#ff6a00', '#ffd93d', '#fcf876'],
  neon: ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'],
  galaxy: ['#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#7b2cbf'],
  forest: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'],
} as const;

export const useVisualizerSettings = (initialConfig?: Partial<VisualizerConfig>) => {
  const [config, setConfig] = useState<VisualizerConfig>({
    theme: 'waves',
    sensitivity: 1,
    colorScheme: DEFAULT_COLOR_SCHEMES.ocean,
    ...initialConfig,
  });

  const colorSchemes = useMemo(() => DEFAULT_COLOR_SCHEMES, []);

  const setTheme = useCallback((theme: VisualizerTheme) => {
    setConfig((prev) => ({ ...prev, theme }));
  }, []);

  const setColorScheme = useCallback((colorScheme: string[]) => {
    setConfig((prev) => ({ ...prev, colorScheme }));
  }, []);

  const setSensitivity = useCallback((sensitivity: number) => {
    setConfig((prev) => ({ ...prev, sensitivity }));
  }, []);

  const updateConfig = useCallback((updates: Partial<VisualizerConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    config,
    colorSchemes,
    setTheme,
    setColorScheme,
    setSensitivity,
    updateConfig,
  };
};
