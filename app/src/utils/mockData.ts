import type { Track } from '../types/music';

export const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Digital Dreams',
    aiTool: 'Suno AI',
    genre: 'Electronic',
    url: '/music/track1.mp3',
    duration: 180,
  },
  {
    id: '2',
    title: 'Neural Waves',
    aiTool: 'Udio',
    genre: 'Ambient',
    url: '/music/track2.mp3',
    duration: 240,
  },
  {
    id: '3',
    title: 'Synthetic Symphony',
    aiTool: 'MusicGen',
    genre: 'Classical',
    url: '/music/track3.mp3',
    duration: 300,
  },
];
