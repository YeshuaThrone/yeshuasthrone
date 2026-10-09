"use client";

import { useState } from "react";

interface YouTubeFacadeProps {
  videoId: string;
  title: string;
  /** Defaults to YouTube's own hq thumbnail; pass your own for a custom still. */
  thumbnail?: string;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
}

/**
 * Thumbnail + play glyph; the YouTube iframe (and its third-party requests)
 * only exist after the fan asks for them.
 */
export function YouTubeFacade({ videoId, title, thumbnail }: YouTubeFacadeProps) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-text/8 bg-ink">
        <iframe
          src={youtubeEmbedUrl(videoId)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play ${title}`}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-text/8 bg-ink"
    >
      {/* Remote YouTube thumbnail; host is fixed, no next/image config needed. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnail ?? youtubeThumbnailUrl(videoId)}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-electric text-onyx shadow-lg transition-colors group-hover:bg-electric-2">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-1 h-7 w-7 fill-current">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-onyx/90 to-transparent px-4 pt-10 pb-3 text-left text-sm font-medium text-text">
        {title}
      </span>
    </button>
  );
}
