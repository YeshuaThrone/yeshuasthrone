import { subscribe } from "@/app/actions/subscribe";
import { DropAlertForm } from "@/components/alerts/DropAlertForm";
import { PlayButton } from "@/components/player";
import { site } from "@/content/site";
import type { Release } from "@/lib/db/types";
import { dropAlertCaption, dropAlertSource, releaseQueue, toPlayerTrack } from "@/lib/releases/player";
import { ReleaseHero } from "./ReleaseHero";
import { ShareButtons } from "./ShareButtons";
import { TrackList } from "./TrackList";

/**
 * The full release page body, shared by `/music/[slug]` and the preview
 * route. Released: tracklist with the player's controls (queue = the whole
 * release), then drop alert + share. Upcoming: the pre-save surface — the
 * hero already renders the pre-save row, so the slot is just the form.
 */
export function ReleaseView({ release }: { release: Release }) {
  const queue = releaseQueue(release);
  const released = release.status === "released";

  return (
    <ReleaseHero release={release}>
      <div className="flex flex-col gap-8">
        {released ? (
          <TrackList
            tracks={release.tracks}
            renderPlay={(track) => {
              const playable = toPlayerTrack(release, track);
              return playable ? <PlayButton track={playable} queue={queue} size={16} /> : null;
            }}
          />
        ) : null}

        <div id="alerts">
          <DropAlertForm
            caption={dropAlertCaption(release.title)}
            source={dropAlertSource(release.slug)}
            onSubmit={subscribe}
          />
        </div>

        <ShareButtons text={`${release.title} — ${site.name}`} />
      </div>
    </ReleaseHero>
  );
}
