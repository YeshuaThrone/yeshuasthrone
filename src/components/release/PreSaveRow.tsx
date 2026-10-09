import type { DspKey, DspLinkMap } from "@/components/types";

const DSPS: ReadonlyArray<{ key: DspKey; label: string }> = [
  { key: "spotify", label: "Spotify" },
  { key: "apple", label: "Apple Music" },
  { key: "youtube", label: "YouTube Music" },
  { key: "tidal", label: "Tidal" },
  { key: "soundcloud", label: "SoundCloud" },
];

export const PRE_SAVE_EMPTY_MESSAGE =
  "Pre-save links land here the moment they exist — join the list to hear first.";

type Mode = "pre-save" | "listen";

interface PreSaveRowProps {
  dspLinks: DspLinkMap;
  /**
   * `pre-save` before release day, `listen` after. Same component, same keys —
   * only the labels and the all-empty copy change.
   */
  mode?: Mode;
}

/** Only a non-empty, http(s) URL counts as a link. Anything else is a placeholder. */
export function isLiveLink(url: string | undefined): url is string {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim());
}

const LABEL: Record<Mode, { enabled: string; disabled: string; row: string }> = {
  "pre-save": { enabled: "Pre-save on", disabled: "Pre-save soon", row: "Pre-save links" },
  listen: { enabled: "Listen on", disabled: "Coming soon", row: "Streaming links" },
};

export function PreSaveRow({ dspLinks, mode = "pre-save" }: PreSaveRowProps) {
  const labels = LABEL[mode];
  const anyLive = DSPS.some((dsp) => isLiveLink(dspLinks[dsp.key]));

  if (!anyLive) {
    // Before release the empty row is a promise worth stating; after release
    // an empty streaming row is just noise (spec: DspLinks renders nothing).
    if (mode === "listen") return null;
    return (
      <p className="text-sm text-muted" data-testid="presave-row">
        {PRE_SAVE_EMPTY_MESSAGE}
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label={labels.row} data-testid="presave-row">
      {DSPS.map((dsp) => {
        const url = dspLinks[dsp.key];
        const chip =
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors";
        return (
          <li key={dsp.key}>
            {isLiveLink(url) ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${chip} border-text/15 bg-ink text-text hover:border-electric-2 hover:text-electric-2`}
              >
                <span className="text-muted">{labels.enabled}</span> {dsp.label}
              </a>
            ) : (
              <span
                aria-disabled="true"
                className={`${chip} cursor-not-allowed border-dashed border-text/10 text-muted/70`}
              >
                <span>{dsp.label}</span>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em]">
                  {labels.disabled}
                </span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Post-release alias: same row, "Listen on" labels. */
export function DspLinks({ dspLinks }: { dspLinks: DspLinkMap }) {
  return <PreSaveRow dspLinks={dspLinks} mode="listen" />;
}
