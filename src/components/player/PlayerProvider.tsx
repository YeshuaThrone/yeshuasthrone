"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import {
  currentTrack as selectCurrentTrack,
  initialPlayerState,
  playerReducer,
  type PlayerState,
  type PlayerStatus,
  type PlayerTrack,
} from "./playerReducer";

export interface PlayerActions {
  /** Start `track`. `queue` (which must contain the track) becomes the active queue. */
  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  next: () => void;
  prev: () => void;
  /** Reload the current track after a load error. */
  retry: () => void;
}

export interface PlayerContextValue extends PlayerActions {
  state: PlayerState;
  currentTrack: PlayerTrack | null;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

/**
 * Owns the one <audio> element for the whole site. Mount once in the root
 * layout so playback survives App Router navigation; pages only ever call
 * `usePlayer()`.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  const audioRef = useRef<HTMLAudioElement>(null);
  const loadedNonceRef = useRef(0);
  const currentTrack = selectCurrentTrack(state);

  // Element events -> state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () =>
      dispatch({ type: "media/time", currentTime: audio.currentTime, duration: audio.duration });
    const handlers: Record<string, () => void> = {
      playing: () => dispatch({ type: "media/playing" }),
      pause: () => dispatch({ type: "media/paused" }),
      waiting: () => dispatch({ type: "media/waiting" }),
      timeupdate: onTime,
      durationchange: onTime,
      loadedmetadata: onTime,
      ended: () => dispatch({ type: "media/ended" }),
      error: () => dispatch({ type: "media/error" }),
    };
    for (const [event, handler] of Object.entries(handlers)) {
      audio.addEventListener(event, handler);
    }
    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        audio.removeEventListener(event, handler);
      }
    };
  }, []);

  // State -> element. Only one source is ever loaded: a new load replaces it.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const attemptPlay = () => {
      audio.play().catch((err: unknown) => {
        // A newer load() interrupted this play(); the new load owns the state.
        if (err instanceof DOMException && err.name === "AbortError") return;
        dispatch({ type: "media/error" });
      });
    };

    if (loadedNonceRef.current !== state.loadNonce) {
      loadedNonceRef.current = state.loadNonce;
      audio.src = currentTrack.audioUrl;
      audio.load();
      attemptPlay();
      return;
    }
    if (state.status === "paused" && !audio.paused) {
      audio.pause();
    } else if (state.status === "loading" && audio.paused) {
      attemptPlay();
    }
  }, [state.status, state.loadNonce, currentTrack]);

  const play = useCallback<PlayerActions["play"]>((track, queue) => {
    dispatch({ type: "play", track, queue });
  }, []);
  const toggle = useCallback(() => dispatch({ type: "toggle" }), []);
  const next = useCallback(() => dispatch({ type: "next" }), []);
  const prev = useCallback(() => {
    // Within the first track, prev rewinds; the reducer resets currentTime.
    const audio = audioRef.current;
    if (audio && state.currentIndex === 0) audio.currentTime = 0;
    dispatch({ type: "prev" });
  }, [state.currentIndex]);
  const retry = useCallback(() => dispatch({ type: "retry" }), []);
  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(seconds)) audio.currentTime = seconds;
    dispatch({ type: "seek", seconds });
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({ state, currentTrack, play, toggle, seek, next, prev, retry }),
    [state, currentTrack, play, toggle, seek, next, prev, retry],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="none" data-testid="site-audio" />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

/** Status of one track: the player status if it is current, else null. */
export function useTrackStatus(trackId: string): PlayerStatus | null {
  const { state, currentTrack } = usePlayer();
  return currentTrack?.id === trackId ? state.status : null;
}
