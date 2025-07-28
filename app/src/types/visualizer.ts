export type VisualizerTheme = 'waves' | 'particles' | 'geometric' | 'shader';

export interface VisualizerConfig {
  theme: VisualizerTheme;
  sensitivity: number;
  colorScheme: string[];
}
