"use client";

import { useEffect, useRef, useState } from "react";

// Minimal types for the SoundCloud Widget API. The script is loaded at runtime
// from w.soundcloud.com/player/api.js — there are no first-party @types for it.
type SCSound = {
  title: string;
  duration: number; // ms
  user: { username: string; permalink_url?: string };
  artwork_url: string | null;
  permalink_url: string;
};

type SCWidget = {
  bind(event: string, fn: (data?: unknown) => void): void;
  unbind(event: string): void;
  play(): void;
  pause(): void;
  toggle(): void;
  skip(index: number): void;
  seekTo(ms: number): void;
  setVolume(volume: number): void;
  getCurrentSound(fn: (sound: SCSound | null) => void): void;
  getSounds(fn: (sounds: SCSound[]) => void): void;
  getCurrentSoundIndex(fn: (i: number) => void): void;
};

declare global {
  interface Window {
    SC?: {
      Widget: ((iframe: HTMLIFrameElement) => SCWidget) & {
        Events: {
          READY: string;
          PLAY: string;
          PAUSE: string;
          PLAY_PROGRESS: string;
          FINISH: string;
        };
      };
    };
  }
}

const PLAYLIST_URL =
  process.env.NEXT_PUBLIC_SOUNDCLOUD_PLAYLIST_URL ||
  "https://soundcloud.com/agmnt_store";

function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Convert a 100x100 SC artwork URL to a larger size.
function upsize(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/-large\./, "-t500x500.");
}

export function RadioPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SCWidget | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sounds, setSounds] = useState<SCSound[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [scrubbing, setScrubbing] = useState(false);
  const scrubberRef = useRef<HTMLDivElement>(null);
  // Mirror `scrubbing` into a ref so the SC PLAY_PROGRESS handler (closed over
  // mount-time state) can suppress position updates while the user is dragging.
  const scrubbingRef = useRef(false);
  useEffect(() => {
    scrubbingRef.current = scrubbing;
  }, [scrubbing]);

  useEffect(() => {
    let mounted = true;

    const init = () => {
      if (!mounted || !iframeRef.current || !window.SC) return;
      const widget = window.SC.Widget(iframeRef.current);
      widgetRef.current = widget;
      const Events = window.SC.Widget.Events;

      // Some SC playlists return stub objects (no user/title) for tracks that
      // haven't been fully fetched yet. getCurrentSound returns a fully
      // populated object once SC has loaded the playing track — patch that
      // back into our sounds[] so the queue and now-playing display fill in.
      // Retry briefly because SC sometimes fires PLAY before metadata is ready.
      const refreshCurrentSound = (attempts = 0) => {
        if (!mounted || attempts > 8) return;
        widget.getCurrentSound((sound) => {
          if (!mounted || !sound) return;
          setDuration(sound.duration);
          if (sound.user?.username) {
            widget.getCurrentSoundIndex((i) => {
              if (!mounted) return;
              setSounds((prev) => {
                if (prev[i] && prev[i]!.user?.username) return prev;
                const updated = [...prev];
                updated[i] = sound;
                return updated;
              });
            });
          } else {
            setTimeout(() => refreshCurrentSound(attempts + 1), 350);
          }
        });
      };

      widget.bind(Events.READY, () => {
        if (!mounted) return;
        widget.getSounds((s) => mounted && setSounds(s.filter(Boolean)));
        widget.getCurrentSoundIndex((i) => mounted && setCurrentIndex(i));
        refreshCurrentSound();
        widget.setVolume(80);
        setReady(true);
      });

      widget.bind(Events.PLAY, () => {
        if (!mounted) return;
        setPlaying(true);
        widget.getSounds((s) => mounted && setSounds(s.filter(Boolean)));
        widget.getCurrentSoundIndex((i) => mounted && setCurrentIndex(i));
        refreshCurrentSound();
      });

      widget.bind(Events.PAUSE, () => mounted && setPlaying(false));

      widget.bind(Events.PLAY_PROGRESS, (data) => {
        if (!mounted || scrubbingRef.current) return;
        const d = data as { currentPosition: number };
        setPosition(d.currentPosition);
      });

      widget.bind(Events.FINISH, () => {
        if (!mounted) return;
        setPosition(0);
      });
    };

    if (window.SC) {
      init();
      return () => {
        mounted = false;
      };
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://w.soundcloud.com/player/api.js"]'
    );
    if (existing) {
      existing.addEventListener("load", init);
      // If it had already loaded, init now.
      if (window.SC) init();
      return () => {
        mounted = false;
        existing.removeEventListener("load", init);
      };
    }

    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);

    return () => {
      mounted = false;
    };
  }, []);

  const togglePlay = () => widgetRef.current?.toggle();

  const skipTo = (i: number) => {
    if (!widgetRef.current || sounds.length === 0) return;
    const target = ((i % sounds.length) + sounds.length) % sounds.length;
    widgetRef.current.skip(target);
    widgetRef.current.play();
    setCurrentIndex(target);
    setPosition(0);
  };

  const skipPrev = () => {
    if (sounds.length === 0) return;
    const next = currentIndex > 0 ? currentIndex - 1 : sounds.length - 1;
    skipTo(next);
  };

  const skipNext = () => {
    if (sounds.length === 0) return;
    const next = currentIndex < sounds.length - 1 ? currentIndex + 1 : 0;
    skipTo(next);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    widgetRef.current?.setVolume(v);
  };

  const positionFromPointer = (clientX: number): number | null => {
    const el = scrubberRef.current;
    if (!el || duration === 0) return null;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    return (x / rect.width) * duration;
  };

  const handleScrubDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const newPos = positionFromPointer(e.clientX);
    if (newPos === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrubbing(true);
    setPosition(newPos);
  };

  const handleScrubMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return;
    const newPos = positionFromPointer(e.clientX);
    if (newPos === null) return;
    setPosition(newPos);
  };

  const handleScrubUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return;
    const newPos = positionFromPointer(e.clientX);
    setScrubbing(false);
    if (newPos !== null) {
      setPosition(newPos);
      widgetRef.current?.seekTo(newPos);
    }
  };

  const currentSound = sounds[currentIndex];
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  // Bars for the equalizer animation.
  const bars = [40, 80, 60, 100, 70];

  return (
    <aside className="flex flex-col border border-black/15 p-5 font-vremena tracking-[-0.02em] bg-white">
      {/* Hidden iframe drives the SC Widget API */}
      <iframe
        ref={iframeRef}
        title="AGMNT Radio Player"
        className="hidden"
        allow="autoplay"
        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(PLAYLIST_URL)}&auto_play=false&visual=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-base tracking-[-0.04em]">
          AGMNT <em className="not-italic font-normal text-black/50">Radio</em>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[-0.02em]">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          On Air
        </div>
      </div>

      {/* Artwork */}
      <div className="relative aspect-square w-40 mx-auto bg-neutral-100 mb-4 overflow-hidden">
        {currentSound && upsize(currentSound.artwork_url) ? (
          // Using <img> rather than next/image because SC artwork URLs aren't
          // pre-configured remote patterns and can change frequently.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={upsize(currentSound.artwork_url) as string}
            alt={currentSound.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-[-0.02em] text-black/30">
            {ready ? "No artwork" : "Loading…"}
          </div>
        )}
      </div>

      {/* Now playing strip */}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[-0.02em] text-black/50 mb-2">
        <span>Now Playing</span>
        <div className="flex items-end gap-[2px] h-3">
          {bars.map((h, i) => (
            <span
              key={i}
              style={{
                height: `${h}%`,
                animationDelay: `${i * 0.12}s`,
              }}
              className={`w-[2px] bg-black animate-equalize ${playing ? "" : "paused"}`}
            />
          ))}
        </div>
      </div>

      {/* Track info */}
      <div className="text-base tracking-[-0.04em]">
        {currentSound?.user?.username || "—"}
      </div>
      <div className="text-sm text-black/60 mb-4 line-clamp-2">
        {currentSound?.title || (ready ? "—" : "Loading playlist…")}
      </div>

      {/* Scrub bar */}
      <div className="mb-4">
        <div
          ref={scrubberRef}
          onPointerDown={handleScrubDown}
          onPointerMove={handleScrubMove}
          onPointerUp={handleScrubUp}
          onPointerCancel={handleScrubUp}
          className="relative h-1.5 bg-black/15 cursor-pointer touch-none"
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, Math.floor(duration / 1000))}
          aria-valuenow={Math.floor(position / 1000)}
        >
          <div
            className="absolute inset-y-0 left-0 bg-black"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] tracking-[-0.02em] text-black/60 mt-1.5">
          <span>{fmt(position)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls: transport + volume */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={skipPrev}
            aria-label="Previous track"
            className="w-7 h-7 flex items-center justify-center hover:opacity-60 transition-opacity flex-shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M0 0 H2 V12 H0 Z M12 0 L2 6 L12 12 Z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="w-10 h-10  flex items-center justify-center hover:bg-black hover:text-white transition-colors flex-shrink-0"
          >
            {playing ? (
              <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                <rect x="0" y="0" width="4" height="14" />
                <rect x="8" y="0" width="4" height="14" />
              </svg>
            ) : (
              <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                <path d="M0 0 L12 7 L0 14 Z" />
              </svg>
            )}
          </button>

          <button
            onClick={skipNext}
            aria-label="Next track"
            className="w-7 h-7 flex items-center justify-center hover:opacity-60 transition-opacity flex-shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M10 0 H12 V12 H10 Z M0 0 L10 6 L0 12 Z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-shrink min-w-0 max-w-[140px]">
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="currentColor"
            className="text-black/60 flex-shrink-0"
            aria-hidden
          >
            <path d="M2 5 L4 5 L7 2 L7 12 L4 9 L2 9 Z" />
          </svg>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            aria-label="Volume"
            className="flex-1 min-w-0 h-1 accent-black cursor-pointer"
          />
        </div>
      </div>

      {/* Queue — current track always pinned to the top, then the next two
          fully-loaded tracks (skip stubs, wrap around the playlist). */}
      <div className="flex flex-col">
        {(() => {
          const items: { track: SCSound; idx: number; isCurrent: boolean }[] =
            [];

          // Position 0: currently playing track (shown even if still a stub —
          // dashes will fill in once SC loads its metadata).
          const currentTrack = sounds[currentIndex];
          if (currentTrack) {
            items.push({
              track: currentTrack,
              idx: currentIndex,
              isCurrent: true,
            });
          }

          // Positions 1+: next loaded tracks, wrapping past the end.
          for (
            let offset = 1;
            offset < sounds.length && items.length < 3;
            offset++
          ) {
            const idx = (currentIndex + offset) % sounds.length;
            if (idx === currentIndex) continue;
            const track = sounds[idx];
            if (track && track.user?.username) {
              items.push({ track, idx, isCurrent: false });
            }
          }

          return items.map(({ track, idx, isCurrent }) => (
            <button
              key={`${track.permalink_url ?? "track"}-${idx}`}
              onClick={() => skipTo(idx)}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2 border-t border-black/10 text-left transition-opacity ${
                isCurrent ? "opacity-100" : "opacity-60 hover:opacity-100"
              }`}
            >
              <span className="text-[10px] tracking-[-0.02em] text-black/50">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="text-sm tracking-[-0.04em] truncate">
                  {track.user?.username ?? "—"}
                </div>
                <div className="text-[10px] tracking-[-0.02em] text-black/50 truncate">
                  {track.title ?? ""}
                </div>
              </div>
              <span className="text-[10px] tracking-[-0.02em] text-black/50">
                {track.duration ? fmt(track.duration) : "—"}
              </span>
            </button>
          ));
        })()}
        {!ready && (
          <div className="py-2 text-[10px] tracking-[-0.02em] text-black/40 border-t border-black/10">
            Loading…
          </div>
        )}
      </div>
    </aside>
  );
}
