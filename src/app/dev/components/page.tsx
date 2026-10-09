import type { Metadata } from "next";
import { CovnantBadge } from "@/components/release/CovnantBadge";
import { DspLinks, PreSaveRow } from "@/components/release/PreSaveRow";
import { ReleaseCard } from "@/components/release/ReleaseCard";
import { ReleaseHero } from "@/components/release/ReleaseHero";
import { TrackList } from "@/components/release/TrackList";
import { YouTubeFacade } from "@/components/media/YouTubeFacade";
import { champion, releasedSingle, tracks } from "@/test/fixtures";
import { DevDropAlertForms } from "./DevDropAlertForms";

/**
 * Dev-only gallery: every component in every state, for visual review and
 * screenshots. Not linked from navigation and excluded from indexing.
 */
export const metadata: Metadata = {
  title: "Components — dev",
  robots: { index: false, follow: false },
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-6 py-12">
      <h2 id={`${id}-title`} className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

const fakePlay = (
  <button
    type="button"
    className="rounded-full bg-electric px-4 py-2 text-sm font-semibold text-text hover:bg-electric-2 hover:text-onyx"
  >
    Play
  </button>
);

const comingChampion = {
  ...champion,
  releaseDate: "2027-03-14",
  dspLinks: { spotify: "https://open.spotify.com/prerelease/example" },
};

export default function DevComponentsPage() {
  return (
    <div className="mx-auto max-w-6xl divide-y divide-text/8 px-6">
      <Section id="hero-upcoming-empty" title="ReleaseHero · upcoming · no date · no links">
        <ReleaseHero release={champion}>
          <p className="text-sm text-muted">[drop-alert form slot]</p>
        </ReleaseHero>
      </Section>

      <Section id="hero-upcoming-one-link" title="ReleaseHero · upcoming · future date · one link">
        <ReleaseHero release={comingChampion} />
      </Section>

      <Section id="hero-released" title="ReleaseHero · released · tracklist in slot">
        <ReleaseHero release={releasedSingle}>
          <TrackList tracks={tracks} renderPlay={() => fakePlay} />
        </ReleaseHero>
      </Section>

      <Section id="presave-empty" title="PreSaveRow · all empty">
        <PreSaveRow dspLinks={{}} />
      </Section>

      <Section id="presave-one" title="PreSaveRow · one link set">
        <PreSaveRow dspLinks={{ apple: "https://music.apple.com/pre-add/example" }} />
      </Section>

      <Section id="presave-all" title="PreSaveRow · all five set">
        <PreSaveRow
          dspLinks={{
            spotify: "https://open.spotify.com/x",
            apple: "https://music.apple.com/x",
            youtube: "https://music.youtube.com/x",
            tidal: "https://tidal.com/x",
            soundcloud: "https://soundcloud.com/x",
          }}
        />
      </Section>

      <Section id="dsplinks" title="DspLinks · listen mode · two links (empty renders nothing)">
        <DspLinks dspLinks={{ spotify: "https://open.spotify.com/x", tidal: "https://tidal.com/x" }} />
        <DspLinks dspLinks={{}} />
      </Section>

      <Section id="badge" title="CovnantBadge · linked · plain · none">
        <div className="flex flex-wrap gap-4">
          <CovnantBadge covnantCbtCode="7F3A9" covnantUrl="https://covnant-eta.vercel.app/assets/7f3a9" />
          <CovnantBadge covnantCbtCode="CBT-2B4C1" covnantUrl={null} />
          <CovnantBadge covnantCbtCode={null} covnantUrl={null} />
        </div>
      </Section>

      <Section id="cards" title="ReleaseCard · released with play · released without · upcoming">
        <div className="grid gap-6 sm:grid-cols-3">
          <ReleaseCard release={releasedSingle} playButton={fakePlay} />
          <ReleaseCard release={{ ...releasedSingle, artworkUrl: null, type: "ep" }} />
          <ReleaseCard release={champion} playButton={fakePlay} />
        </div>
      </Section>

      <Section id="tracklist" title="TrackList · with and without renderPlay">
        <TrackList tracks={tracks} renderPlay={() => fakePlay} />
        <TrackList tracks={tracks} />
      </Section>

      <Section id="drop-alert" title="DropAlertForm · one form per outcome">
        <DevDropAlertForms />
      </Section>

      <Section id="youtube" title="YouTubeFacade · click to load">
        <div className="max-w-2xl">
          <YouTubeFacade videoId="0vNAxj-xvZs" title="Dreams (Official Video)" />
        </div>
      </Section>
    </div>
  );
}
