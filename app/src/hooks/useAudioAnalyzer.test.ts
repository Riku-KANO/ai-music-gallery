import { renderHook } from '@testing-library/react';
import { useAudioAnalyzer } from './useAudioAnalyzer';

describe('useAudioAnalyzer', () => {
  let mockAudioElement: HTMLAudioElement;
  let mockAudioContext: AudioContext;
  let mockAnalyser: AnalyserNode;
  let mockSource: MediaElementAudioSourceNode;

  beforeEach(() => {
    mockAnalyser = {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      frequencyBinCount: 1024,
      getByteFrequencyData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
      connect: vi.fn(),
    } as AnalyserNode;

    mockSource = {
      connect: vi.fn(),
    } as MediaElementAudioSourceNode;

    mockAudioContext = {
      state: 'running',
      createAnalyser: vi.fn().mockReturnValue(mockAnalyser),
      createMediaElementSource: vi.fn().mockReturnValue(mockSource),
      destination: {} as AudioDestinationNode,
      resume: vi.fn(),
    } as AudioContext;

    (globalThis as typeof globalThis & { AudioContext: typeof AudioContext }).AudioContext = vi
      .fn()
      .mockImplementation(() => mockAudioContext);

    mockAudioElement = document.createElement('audio');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize audio context when audio element is provided', () => {
    renderHook(() => useAudioAnalyzer(mockAudioElement, false));

    expect(
      (globalThis as typeof globalThis & { AudioContext: typeof AudioContext }).AudioContext,
    ).toHaveBeenCalled();
    expect(mockAudioContext.createMediaElementSource).toHaveBeenCalledWith(mockAudioElement);
    expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
  });

  it('should connect audio nodes properly', () => {
    renderHook(() => useAudioAnalyzer(mockAudioElement, false));

    expect(mockSource.connect).toHaveBeenCalledWith(mockAnalyser);
    expect(mockAnalyser.connect).toHaveBeenCalledWith(mockAudioContext.destination);
  });

  it('should set analyser properties from options', () => {
    const options = { fftSize: 4096, smoothingTimeConstant: 0.9 };
    renderHook(() => useAudioAnalyzer(mockAudioElement, false, options));

    expect(mockAnalyser.fftSize).toBe(4096);
    expect(mockAnalyser.smoothingTimeConstant).toBe(0.9);
  });

  it('should return getAudioData function', () => {
    const { result } = renderHook(() => useAudioAnalyzer(mockAudioElement, false));

    expect(result.current.getAudioData).toBeDefined();
    expect(typeof result.current.getAudioData).toBe('function');
  });

  it('should return audio data with correct structure', () => {
    const { result } = renderHook(() => useAudioAnalyzer(mockAudioElement, false));

    const audioData = result.current.getAudioData();

    expect(audioData).toHaveProperty('frequency');
    expect(audioData).toHaveProperty('waveform');
    expect(audioData).toHaveProperty('volume');
    expect(audioData).toHaveProperty('bass');
    expect(audioData).toHaveProperty('mid');
    expect(audioData).toHaveProperty('treble');
  });
});
