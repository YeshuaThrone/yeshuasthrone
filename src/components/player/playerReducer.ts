/**
 * Pure player state machine. The provider owns the single <audio> element and
 * translates this state into element calls; nothing here touches the DOM.
 */

export interface PlayerTrack {
  id: string;
  title: string;
  releaseTitle: string;
  releaseSlug: string;
  artworkUrl: string | null;
  audioUrl: string;
  durationSeconds: number | null;
}

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

export interface PlayerState {
  queue: PlayerTrack[];
  /** Index into `queue`; -1 while idle. */
  currentIndex: number;
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  error: string | null;
  /** Bumped every time the <audio> source must be (re)loaded. */
  loadNonce: number;
}

export type PlayerAction =
  // user intents
  | { type: "play"; track: PlayerTrack; queue?: PlayerTrack[] }
  | { type: "toggle" }
  | { type: "seek"; seconds: number }
  | { type: "next" }
  | { type: "prev" }
  | { type: "retry" }
  // <audio> element events
  | { type: "media/playing" }
  | { type: "media/paused" }
  | { type: "media/waiting" }
  | { type: "media/time"; currentTime: number; duration: number }
  | { type: "media/ended" }
  | { type: "media/error" };

export const LOAD_ERROR_MESSAGE = "Couldn't load this track";

export const initialPlayerState: PlayerState = {
  queue: [],
  currentIndex: -1,
  status: "idle",
  currentTime: 0,
  duration: 0,
  error: null,
  loadNonce: 0,
};

export function currentTrack(state: PlayerState): PlayerTrack | null {
  return state.queue[state.currentIndex] ?? null;
}

function hasTrack(queue: PlayerTrack[], id: string): boolean {
  return queue.some((t) => t.id === id);
}

/**
 * Queue to adopt when `track` starts: an explicit queue that contains it,
 * else the existing queue if it already contains it, else just the track.
 */
function resolveQueue(
  existing: PlayerTrack[],
  track: PlayerTrack,
  explicit: PlayerTrack[] | undefined,
): PlayerTrack[] {
  if (explicit && hasTrack(explicit, track.id)) return explicit;
  if (hasTrack(existing, track.id)) return existing;
  return [track];
}

function startTrack(state: PlayerState, queue: PlayerTrack[], index: number): PlayerState {
  const track = queue[index];
  return {
    ...state,
    queue,
    currentIndex: index,
    status: "loading",
    currentTime: 0,
    duration: track.durationSeconds ?? 0,
    error: null,
    loadNonce: state.loadNonce + 1,
  };
}

function playCurrent(state: PlayerState, action: Extract<PlayerAction, { type: "play" }>) {
  const current = currentTrack(state) as PlayerTrack;
  const queue = resolveQueue(state.queue, current, action.queue);
  const currentIndex = queue.findIndex((t) => t.id === current.id);
  switch (state.status) {
    case "playing":
    case "loading":
      return queue === state.queue ? state : { ...state, queue, currentIndex };
    case "paused":
      return { ...state, queue, currentIndex, status: "loading" as const };
    default:
      // error: reload the same source
      return startTrack(state, queue, currentIndex);
  }
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "play": {
      if (currentTrack(state)?.id === action.track.id) return playCurrent(state, action);
      const queue = resolveQueue(state.queue, action.track, action.queue);
      return startTrack(
        state,
        queue,
        queue.findIndex((t) => t.id === action.track.id),
      );
    }

    case "toggle": {
      switch (state.status) {
        case "playing":
        case "loading":
          return { ...state, status: "paused" };
        case "paused":
          return { ...state, status: "loading" };
        default:
          return state;
      }
    }

    case "seek": {
      if (state.status === "idle") return state;
      const max = state.duration > 0 ? state.duration : Number.POSITIVE_INFINITY;
      const currentTime = Math.min(Math.max(0, action.seconds), max);
      return { ...state, currentTime };
    }

    case "next": {
      const index = state.currentIndex + 1;
      // At the end of the queue, stay put.
      return index > 0 && index < state.queue.length
        ? startTrack(state, state.queue, index)
        : state;
    }

    case "prev": {
      if (state.currentIndex > 0) return startTrack(state, state.queue, state.currentIndex - 1);
      return state.status === "idle" ? state : { ...state, currentTime: 0 };
    }

    case "retry": {
      return state.status === "error"
        ? startTrack(state, state.queue, state.currentIndex)
        : state;
    }

    case "media/playing": {
      return state.status === "idle" ? state : { ...state, status: "playing", error: null };
    }

    case "media/paused": {
      // The element also pauses while swapping sources (status "loading");
      // only a pause of a genuinely playing track is a state change.
      return state.status === "playing" ? { ...state, status: "paused" } : state;
    }

    case "media/waiting": {
      return state.status === "playing" ? { ...state, status: "loading" } : state;
    }

    case "media/time": {
      if (state.status === "idle") return state;
      const duration =
        Number.isFinite(action.duration) && action.duration > 0
          ? action.duration
          : state.duration;
      return { ...state, currentTime: action.currentTime, duration };
    }

    case "media/ended": {
      const index = state.currentIndex + 1;
      if (index > 0 && index < state.queue.length) return startTrack(state, state.queue, index);
      return state.status === "idle"
        ? state
        : { ...state, status: "paused", currentTime: state.duration };
    }

    case "media/error": {
      // Queue and position are kept so retry() can reload the same track.
      return state.status === "idle"
        ? state
        : { ...state, status: "error", error: LOAD_ERROR_MESSAGE };
    }
  }
}
