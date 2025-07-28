import { useRef, useEffect, useCallback } from 'react';

export interface AudioData {
  frequency: Uint8Array;
  waveform: Uint8Array;
  volume: number;
  bass: number;
  mid: number;
  treble: number;
}

interface UseAudioAnalyzerOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
}

export const useAudioAnalyzer = (
  audioElement: HTMLAudioElement | null,
  options: UseAudioAnalyzerOptions = {},
) => {
  const { fftSize = 2048, smoothingTimeConstant = 0.8 } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Setup audio context when element changes
  useEffect(() => {
    if (!audioElement) return;

    const setupAudioContext = async () => {
      try {
        if (!audioContextRef.current) {
          const AudioContextClass =
            window.AudioContext ||
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            audioContextRef.current = new AudioContextClass();
          }
        }

        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        if (!sourceRef.current && audioElement && audioContextRef.current) {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
          analyzerRef.current = audioContextRef.current.createAnalyser();

          analyzerRef.current.fftSize = fftSize;
          analyzerRef.current.smoothingTimeConstant = smoothingTimeConstant;

          sourceRef.current.connect(analyzerRef.current);
          analyzerRef.current.connect(audioContextRef.current.destination);
        }
      } catch (error) {
        console.error('Error setting up audio context:', error);
      }
    };

    setupAudioContext();

    return () => {
      // Cleanup handled by component unmount
    };
  }, [audioElement, fftSize, smoothingTimeConstant]);

  // Function to get current audio data - called directly from useFrame
  const getAudioData = useCallback((): AudioData => {
    if (!analyzerRef.current) {
      return {
        frequency: new Uint8Array(0),
        waveform: new Uint8Array(0),
        volume: 0,
        bass: 0,
        mid: 0,
        treble: 0,
      };
    }

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const waveformData = new Uint8Array(bufferLength);

    analyzer.getByteFrequencyData(frequencyData);
    analyzer.getByteTimeDomainData(waveformData);

    // Calculate overall volume
    const volume = frequencyData.reduce((sum, value) => sum + value, 0) / bufferLength / 255;

    // Calculate frequency bands
    const bassEnd = Math.floor(bufferLength * 0.1);
    const midEnd = Math.floor(bufferLength * 0.5);

    const bass =
      frequencyData.slice(0, bassEnd).reduce((sum, value) => sum + value, 0) / bassEnd / 255;
    const mid =
      frequencyData.slice(bassEnd, midEnd).reduce((sum, value) => sum + value, 0) /
      (midEnd - bassEnd) /
      255;
    const treble =
      frequencyData.slice(midEnd).reduce((sum, value) => sum + value, 0) /
      (bufferLength - midEnd) /
      255;

    return {
      frequency: frequencyData,
      waveform: waveformData,
      volume,
      bass,
      mid,
      treble,
    };
  }, []);

  return { getAudioData };
};
