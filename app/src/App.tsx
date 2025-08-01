import { useState, useRef, useMemo, useCallback } from 'react';
import { MusicPlayer } from './components/MusicPlayer';
import { Visualizer } from './components/Visualizer';
import { TrackGallery } from './components/TrackGallery';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { mockTracks } from './utils/mockData';
import type { VisualizerConfig } from './types/visualizer';
import './App.css';

function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [visualizerConfig, setVisualizerConfig] = useState<VisualizerConfig>({
    theme: 'waves',
    sensitivity: 1,
    colorScheme: ['#61dafb', '#ff6b6b', '#764ba2'],
  });

  // プリセットカラースキーム（メモ化）
  const colorSchemes = useMemo(
    () => ({
      ocean: ['#00d9ff', '#0099ff', '#0066ff', '#ff00ff', '#00ffff'],
      sunset: ['#ff6b6b', '#ff8e53', '#ff6a00', '#ffd93d', '#fcf876'],
      neon: ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'],
      galaxy: ['#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#7b2cbf'],
      forest: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'],
    }),
    [],
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { getAudioData } = useAudioAnalyzer(audioRef.current);

  const currentTrack = mockTracks[currentTrackIndex];

  const handleTrackChange = useCallback(
    (index: number, shouldAutoPlay: boolean = autoPlay) => {
      // 楽曲が変わった場合のみ処理
      if (index !== currentTrackIndex) {
        // 再生状態の決定:
        // 1. 現在再生中なら次も再生
        // 2. 自動再生が有効なら再生
        // 3. それ以外は停止
        const shouldPlayNext = isPlaying || shouldAutoPlay;

        // 楽曲インデックスを更新
        setCurrentTrackIndex(index);

        // 再生状態を更新
        setIsPlaying(shouldPlayNext);
      }
    },
    [currentTrackIndex, isPlaying, autoPlay],
  );

  const handleTrackEnd = useCallback(() => {
    if (currentTrackIndex < mockTracks.length - 1) {
      // 次の楽曲に自動切り替え
      // 楽曲終了時は常に再生状態を維持
      handleTrackChange(currentTrackIndex + 1, true);
    } else {
      // 最後の楽曲の場合は停止
      setIsPlaying(false);
    }
  }, [currentTrackIndex, handleTrackChange]);

  const handleRandomPlay = useCallback(() => {
    let randomIndex = Math.floor(Math.random() * mockTracks.length);
    // 同じ楽曲にならないように
    while (randomIndex === currentTrackIndex && mockTracks.length > 1) {
      randomIndex = Math.floor(Math.random() * mockTracks.length);
    }
    // ランダム再生は常に自動再生
    handleTrackChange(randomIndex, true);
  }, [currentTrackIndex, handleTrackChange]);

  const setAudioElement = useCallback((element: HTMLAudioElement | null) => {
    audioRef.current = element;
  }, []);

  return (
    <div className="app">
      <Visualizer getAudioData={getAudioData} config={visualizerConfig} />

      <div className="track-gallery-wrapper">
        <TrackGallery
          tracks={mockTracks}
          currentTrackIndex={currentTrackIndex}
          onTrackChange={handleTrackChange}
        />
      </div>

      <div className="music-player-wrapper">
        <MusicPlayer
          track={currentTrack}
          onTrackEnd={handleTrackEnd}
          isPlaying={isPlaying}
          onPlayingChange={setIsPlaying}
          onAudioElement={setAudioElement}
        />
      </div>

      <div className="settings-panel">
        <h2>Visualizer Settings</h2>
        <div className="theme-selector">
          <button
            className={visualizerConfig.theme === 'waves' ? 'active' : ''}
            onClick={() => setVisualizerConfig({ ...visualizerConfig, theme: 'waves' })}
          >
            Waves
          </button>
          <button
            className={visualizerConfig.theme === 'particles' ? 'active' : ''}
            onClick={() => setVisualizerConfig({ ...visualizerConfig, theme: 'particles' })}
          >
            Particles
          </button>
          <button
            className={visualizerConfig.theme === 'geometric' ? 'active' : ''}
            onClick={() => setVisualizerConfig({ ...visualizerConfig, theme: 'geometric' })}
          >
            Geometric
          </button>
          <button
            className={visualizerConfig.theme === 'shader' ? 'active' : ''}
            onClick={() => setVisualizerConfig({ ...visualizerConfig, theme: 'shader' })}
          >
            Shader
          </button>
        </div>
        <button onClick={handleRandomPlay} className="random-button">
          Random Track
        </button>

        {/* Color scheme selector */}
        <div style={{ marginTop: '0.5rem' }}>
          <h3 style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>Color Scheme</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
            {Object.entries(colorSchemes).map(([name, colors]) => (
              <button
                key={name}
                onClick={() => setVisualizerConfig({ ...visualizerConfig, colorScheme: colors })}
                style={{
                  padding: '0.25rem 0.4rem',
                  fontSize: '0.7rem',
                  background: `linear-gradient(90deg, ${colors.join(', ')})`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  minWidth: 'calc(50% - 0.1rem)',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-play setting */}
        <div style={{ marginTop: '0.5rem' }}>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
          >
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={(e) => setAutoPlay(e.target.checked)}
            />
            Auto-play next track
          </label>
        </div>

        {/* Debug info */}
        <div
          style={{
            marginTop: '0.5rem',
            fontSize: '0.7rem',
            opacity: 0.6,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.2rem',
          }}
        >
          <div>Vol: {getAudioData().volume.toFixed(2)}</div>
          <div>Bass: {getAudioData().bass.toFixed(2)}</div>
          <div>Mid: {getAudioData().mid.toFixed(2)}</div>
          <div>
            Track: {currentTrackIndex + 1}/{mockTracks.length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
