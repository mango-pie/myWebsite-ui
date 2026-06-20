/**
 * 播放器类型定义
 */

/** 播放模式 */
export type PlayMode = 'order' | 'single-loop' | 'list-loop' | 'shuffle';
export type PlayerDisplayMode = 'float' | 'dock';

/** 歌曲信息 */
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  lyrics?: Lyric[];
  trackNumber?: number;
  year?: string;
}

/** 歌词项 */
export interface Lyric {
  time: number;
  text: string;
}

/** 播放器状态 */
export interface PlayerState {
  currentSong: Song | null;
  playlist: Song[];
  isPlaying: boolean;
  isBuffering: boolean;
  playError: string;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isSeeking: boolean;
  seekingProgress: number | null;
  playMode: PlayMode;
  currentIndex: number;
  progress: number;
}
