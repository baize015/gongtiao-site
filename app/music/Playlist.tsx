"use client";

import { useEffect, useRef, useState } from "react";
import { IconMusic } from "@/components/ui/Icons";

type Track = {
  id: string;
  name: string;
  artist: string;
  cover: string;
  url: string;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** 音乐页播放器：HTML5 audio + 自定义播放/暂停与进度条 */
export default function Playlist({ tracks }: { tracks: readonly Track[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 切歌后是否自动接着播
  const wantPlay = useRef(false);

  const track: Track | undefined = tracks[index];
  const playable = Boolean(track?.url);

  /* 切换曲目：重置进度，若来自点击则自动播放 */
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    const audio = audioRef.current;
    if (!audio || !wantPlay.current) return;
    wantPlay.current = false;
    audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, [index]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio || !playable) return;
    if (audio.paused) {
      audio.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function next(step = 1) {
    if (tracks.length === 0) return;
    for (let offset = 1; offset <= tracks.length; offset += 1) {
      const candidate = (((index + step * offset) % tracks.length) + tracks.length) % tracks.length;
      if (tracks[candidate]?.url) {
        wantPlay.current = true;
        setIndex(candidate);
        return;
      }
    }
    setPlaying(false);
  }

  function select(i: number) {
    if (i === index) {
      toggle();
      return;
    }
    wantPlay.current = Boolean(tracks[i]?.url);
    setIndex(i);
  }

  if (tracks.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-2 px-6 py-16 text-center">
        <IconMusic size={22} className="text-[var(--ink-faint)]" />
        <p className="font-serif text-[1.05rem] text-[var(--ink-soft)]">播放列表还是空的。</p>
        <p className="text-[0.85rem] text-[var(--ink-faint)]">在管理端的「音乐」页贴个网易云歌单就行。</p>
      </div>
    );
  }

  return (
    <div className="glass p-5 sm:p-7">
      {/* 当前曲目与主控制 */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
          {track?.cover ? (
            <img src={track.cover} alt={`${track.name}的封面`} className="h-full w-full object-cover" />
          ) : (
            <IconMusic size={26} className="text-[var(--accent-strong)]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="kicker mb-1">NOW PLAYING</p>
          <p className="truncate font-serif text-[1.1rem]">{track?.name ?? "未选择曲目"}</p>
          <p className="mt-0.5 truncate text-[0.8rem] text-[var(--ink-faint)]">
            {track?.artist || "未知艺人"}
            {playable ? "" : " · 这首暂时拉不到音频"}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => next(-1)}
            aria-label="上一首"
            disabled={!playable}
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] transition-colors hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18 5l-9 7 9 7V5Z" />
              <rect x="4.5" y="5" width="2.5" height="14" rx="1" />
            </svg>
          </button>

          <button
            type="button"
            onClick={toggle}
            disabled={!playable}
            aria-label={playing ? "暂停" : "播放"}
            className="grid h-12 w-12 place-items-center rounded-full bg-[var(--accent)] text-white shadow-[var(--shadow)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => next(1)}
            aria-label="下一首"
            disabled={!playable}
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] transition-colors hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 5l9 7-9 7V5Z" />
              <rect x="17" y="5" width="2.5" height="14" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mt-6 flex items-center gap-3">
        <span className="w-10 shrink-0 text-right font-mono text-[0.68rem] text-[var(--ink-faint)]">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          disabled={!playable || duration === 0}
          onChange={(e) => {
            const audio = audioRef.current;
            if (!audio) return;
            const value = Number(e.target.value);
            audio.currentTime = value;
            setCurrentTime(value);
          }}
          aria-label="播放进度"
          className="h-1.5 w-full cursor-pointer accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
        />
        <span className="w-10 shrink-0 font-mono text-[0.68rem] text-[var(--ink-faint)]">
          {formatTime(duration)}
        </span>
      </div>

      {track?.url ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio
          key={track.id}
          ref={audioRef}
          src={track.url}
          preload="metadata"
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            setDuration(Number.isFinite(d) ? d : 0);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => next(1)}
          className="hidden"
        />
      ) : null}

      {/* 曲目列表 */}
      <div className="divider-warm my-6 opacity-60" />
      <ol className="space-y-1">
        {tracks.map((item, i) => {
          const active = i === index;
          const available = Boolean(item.url);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => select(i)}
                disabled={!available}
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  active
                    ? "bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]"
                    : "hover:bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]",
                  available ? "" : "cursor-not-allowed opacity-55",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[0.65rem]",
                    active
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--line)] text-[var(--ink-faint)]",
                  ].join(" ")}
                >
                  {active && playing ? "▶" : i + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={[
                      "block truncate text-[0.88rem]",
                      active ? "text-[var(--ink)]" : "text-[var(--ink-soft)]",
                    ].join(" ")}
                  >
                    {item.name}
                  </span>
                  <span className="block truncate text-[0.72rem] text-[var(--ink-faint)]">
                    {item.artist || "未知艺人"}
                  </span>
                </span>

                {available ? (
                  <span className="shrink-0 font-mono text-[0.68rem] text-[var(--ink-faint)]">
                    {active ? (playing ? "播放中" : "已暂停") : "可播放"}
                  </span>
                ) : (
                  <span className="chip shrink-0">暂不可播</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
