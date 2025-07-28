import { render } from '@testing-library/react';
import { Visualizer } from './Visualizer';
import type { AudioData } from '../hooks/useAudioAnalyzer';
import type { VisualizerConfig } from '../types/visualizer';

// Mock Three.js and React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  PerspectiveCamera: () => <div data-testid="perspective-camera" />,
}));

const mockAudioData: AudioData = {
  frequency: new Uint8Array(1024),
  waveform: new Uint8Array(1024),
  volume: 0.5,
  bass: 0.3,
  mid: 0.5,
  treble: 0.7,
};

const mockConfig: VisualizerConfig = {
  theme: 'waves',
  sensitivity: 1,
  colorScheme: ['#61dafb', '#ff6b6b'],
};

describe('Visualizer', () => {
  it('should render canvas element', () => {
    const { getByTestId } = render(<Visualizer audioData={mockAudioData} config={mockConfig} />);

    expect(getByTestId('canvas')).toBeInTheDocument();
  });

  it('should render camera and controls', () => {
    const { getByTestId } = render(<Visualizer audioData={mockAudioData} config={mockConfig} />);

    expect(getByTestId('perspective-camera')).toBeInTheDocument();
    expect(getByTestId('orbit-controls')).toBeInTheDocument();
  });

  it('should render with different themes', () => {
    const themes: VisualizerConfig['theme'][] = ['waves', 'particles', 'geometric'];

    themes.forEach((theme) => {
      const config = { ...mockConfig, theme };
      const { container } = render(<Visualizer audioData={mockAudioData} config={config} />);

      const canvas = container.querySelector('[data-testid="canvas"]');
      expect(canvas).toBeInTheDocument();
    });
  });
});
