export type VisualizerTheme = 'waves' | 'particles' | 'geometric' | 'abstract';

export interface VisualizerConfig {
  theme: VisualizerTheme;
  sensitivity: number;
  colorScheme: string[];
}
