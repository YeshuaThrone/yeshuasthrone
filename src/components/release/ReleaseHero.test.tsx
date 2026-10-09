import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "@/test/axe";
import { champion, releasedSingle } from "@/test/fixtures";
import { PRE_SAVE_EMPTY_MESSAGE } from "./PreSaveRow";
import { IN_STUDIO_LINE, ReleaseHero, upcomingStatusLine } from "./ReleaseHero";

describe("ReleaseHero — upcoming (CHAMPION)", () => {
  it("shows the lockup, Drops here first, In the studio now, and zero anchors with no date or links", async () => {
    const { container } = render(
      <ReleaseHero release={champion}>
        <p>drop-alert slot</p>
      </ReleaseHero>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "CHAMPION" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /champion — cover art coming soon/i })).toBeInTheDocument();
    expect(screen.getByText("Drops here first.")).toBeInTheDocument();
    expect(screen.getByText(IN_STUDIO_LINE)).toBeInTheDocument();
    expect(screen.getByText(PRE_SAVE_EMPTY_MESSAGE)).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText("drop-alert slot")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows Coming <date> for a future date and swaps the lockup for art when a url is set", () => {
    render(
      <ReleaseHero
        release={{
          ...champion,
          releaseDate: "2027-03-14",
          artworkUrl: "https://example.test/champion.jpg",
        }}
      />,
    );
    expect(screen.getByText("Coming March 14, 2027")).toBeInTheDocument();
    expect(screen.queryByText(IN_STUDIO_LINE)).not.toBeInTheDocument();
    const art = screen.getByRole("img", { name: "CHAMPION cover art" });
    expect(art).toHaveAttribute("src", "https://example.test/champion.jpg");
  });

  it("renders exactly one enabled pre-save anchor when one link is set", () => {
    render(
      <ReleaseHero
        release={{ ...champion, dspLinks: { apple: "https://music.apple.com/pre-add/x" } }}
      />,
    );
    const row = screen.getByRole("list", { name: "Pre-save links" });
    const links = within(row).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://music.apple.com/pre-add/x");
    expect(screen.queryByText(PRE_SAVE_EMPTY_MESSAGE)).not.toBeInTheDocument();
  });
});

describe("ReleaseHero — released", () => {
  it("shows the release date, listen links, Covnant badge, and the children slot", async () => {
    const { container } = render(
      <ReleaseHero release={releasedSingle}>
        <ol aria-label="Tracklist">
          <li>Throne Room</li>
        </ol>
      </ReleaseHero>,
    );
    expect(screen.getByText("Released June 12, 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /listen on\s*spotify/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /registered on covnant/i })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Tracklist" })).toBeInTheDocument();
    expect(screen.queryByText("Pre-save soon")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("upcomingStatusLine", () => {
  it("returns the studio line for null and Coming <date> otherwise", () => {
    expect(upcomingStatusLine(null)).toBe(IN_STUDIO_LINE);
    expect(upcomingStatusLine("2027-01-02")).toBe("Coming January 2, 2027");
  });
});
