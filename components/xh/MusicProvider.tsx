"use client";

/**
 * MusicProvider —— 全站音乐状态（移植自 XHBlogs/components/MusicProvider.tsx）
 *
 * 与原版的差异（只动接入层，context 字段与方法签名**完全不变**，
 * 所以 FloatingPlayer / LyricBar / SidebarLyric / CloudPlayer 可以原样移植）：
 *
 * 1. 原版 `fetch('/api/music?ids=' + siteConfig.cloudMusicIds)` 拉网易云歌单——
 *    那是外部音乐 API，本站不做。这里改为读取 `siteConfig.music.playlist` 里的
 *    本地音频直链（`{ id, name, artist, cover, url }`），或由 props.playlist 覆盖。
 * 2. 歌词不再来自接口：支持条目上的内联 `lrc` 文本，或站内相对路径 `lrcUrl`（如 `/music/a.lrc`）。
 * 3. 去掉了 `isLoading` 的「拉歌单」含义，改为音频真实的缓冲状态（waiting / canplay）。
 *
 * 用法（layout.tsx 或任意页面）：
 *   <MusicProvider>
 *     {children}
 *     <FloatingPlayer />
 *   </MusicProvider>
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { siteConfig } from "@/site.config";
import {
  EMPTY_LYRIC,
  findActiveLyric,
  isSameOriginPath,
  normalizeTracks,
  parseLrc,
  type LyricLine,
  type MusicTrack,
  type RawTrack,
} from "./music-utils";

export type PlayMode = "loop" | "single" | "random";

export type MusicContextType = {
  playlist: MusicTrack[];
  currentIndex: number;
  currentSong: MusicTrack | undefined;
  isPlaying: boolean;
  /** 0 ~ 100 */
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (event: React.ChangeEvent<HTMLInputElement>) => void;
  playSong: (index: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
};

const MusicContext = createContext<MusicContextType | null>(null);

export type MusicProviderProps = {
  children: ReactNode;
  /** 覆盖 siteConfig.music.playlist（例如某个页面只想播自己的歌单） */
  playlist?: readonly RawTrack[];
};

export default function MusicProvider({ children, playlist }: MusicProviderProps) {
  const tracks = useMemo<MusicTrack[]>(
    () => normalizeTracks(playlist ?? (siteConfig.music?.playlist as RawTrack[] | undefined)),
    [playlist],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentLyric, setCurrentLyric] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  const safeIndex = tracks.length > 0 ? Math.min(currentIndex, tracks.length - 1) : 0;
  const currentSong = tracks[safeIndex];

  // 曲目切换：重置进度 & 载入歌词
  useEffect(() => {
    setCurrentTime(0);
    setProgress(0);
    setDuration(0);
    setLyrics(currentSong?.lyrics ?? []);
    setCurrentLyric(currentSong ? (currentSong.lyrics.length > 0 ? EMPTY_LYRIC : currentSong.title) : "");

    let cancelled = false;
    if (currentSong && currentSong.lyrics.length === 0 && isSameOriginPath(currentSong.lrcUrl)) {
      setIsLoading(true);
      fetch(currentSong.lrcUrl)
        .then((res) => (res.ok ? res.text() : ""))
        .then((text) => {
          if (cancelled || !text) return;
          const parsed = parseLrc(text);
          if (parsed.length > 0) setLyrics(parsed);
        })
        .catch(() => {
          /* 歌词拿不到就纯享音乐，不影响播放 */
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [currentSong]);

  // 播放 / 暂停
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  // 音量 / 静音
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : Math.min(1, Math.max(0, volume));
    audio.muted = isMuted;
  }, [volume, isMuted, currentSong]);

  // 歌词高亮
  useEffect(() => {
    if (!currentSong) return;
    if (lyrics.length === 0) {
      setCurrentLyric(currentSong.title);
      return;
    }
    const active = findActiveLyric(lyrics, currentTime);
    setCurrentLyric(active ?? (currentTime > 0 ? EMPTY_LYRIC : currentSong.title));
  }, [currentTime, lyrics, currentSong]);

  const togglePlay = useCallback(() => {
    if (!currentSong) return;
    setIsPlaying((prev) => !prev);
  }, [currentSong]);

  const nextSong = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentIndex((prev) => {
      if (playMode === "random" && tracks.length > 1) {
        let next = prev;
        while (next === prev) next = Math.floor(Math.random() * tracks.length);
        return next;
      }
      return (prev + 1) % tracks.length;
    });
  }, [tracks.length, playMode]);

  const prevSong = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  const playSong = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  }, []);

  const handleSeek = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(event.target.value);
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    if (value > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

  const togglePlayMode = useCallback(() => {
    setPlayMode((prev) => (prev === "loop" ? "single" : prev === "single" ? "random" : "loop"));
  }, []);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = audio.currentTime || 0;
    setCurrentTime(time);
    if (audio.duration && !Number.isNaN(audio.duration)) {
      setDuration(audio.duration);
      setProgress((time / audio.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && !Number.isNaN(audio.duration)) setDuration(audio.duration);
    setIsLoading(false);
  };

  const handleEnded = () => {
    const audio = audioRef.current;
    if (playMode === "single" && audio) {
      audio.currentTime = 0;
      audio.play().catch(() => setIsPlaying(false));
      return;
    }
    nextSong();
  };

  const value = useMemo<MusicContextType>(
    () => ({
      playlist: tracks,
      currentIndex: safeIndex,
      currentSong,
      isPlaying,
      progress,
      currentTime,
      duration,
      currentLyric,
      isLoading,
      volume,
      isMuted,
      playMode,
      togglePlay,
      nextSong,
      prevSong,
      handleSeek,
      playSong,
      setVolume,
      toggleMute,
      togglePlayMode,
    }),
    [
      tracks,
      safeIndex,
      currentSong,
      isPlaying,
      progress,
      currentTime,
      duration,
      currentLyric,
      isLoading,
      volume,
      isMuted,
      playMode,
      togglePlay,
      nextSong,
      prevSong,
      handleSeek,
      playSong,
      setVolume,
      toggleMute,
      togglePlayMode,
    ],
  );

  return (
    <MusicContext.Provider value={value}>
      {children}
      {currentSong ? (
        <audio
          ref={audioRef}
          src={currentSong.src}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onWaiting={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onError={() => setIsPlaying(false)}
        />
      ) : null}
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextType {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within MusicProvider");
  }
  return context;
}
