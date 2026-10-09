import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "@/test/axe";
import { champion, releasedSingle, tracks } from "@/test/fixtures";
import { ReleaseCard } from "./ReleaseCard";
import { TrackList } from "./TrackList";

const play = <button type="button">Play</button>;

describe("ReleaseCard", () => {
  it("links to the release page and shows type and formatted date", async () => {
    const { container } = render(<ReleaseCard release={releasedSingle} playButton={play} />);
    expect(screen.getByRole("link", { name: "Throne Room" })).toHaveAttribute(
      "href",
      "/music/throne-room",
    );
    expect(screen.getByText("Single")).toBeInTheDocument();
    expect(screen.getByText("June 12, 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Throne Room cover art" })).toHaveAttribute(
      "loading",
      "lazy",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("never renders the play slot for an upcoming release, even when one is passed", async () => {
    const { container } = render(<ReleaseCard release={champion} playButton={play} />);
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByText("Album")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /cover art coming soon/i })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders no play slot for a released release when none is passed", () => {
    render(<ReleaseCard release={releasedSingle} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("TrackList", () => {
  it("renders nothing for an empty tracklist", () => {
    const { container } = render(<TrackList tracks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("orders rows by position and formats duration, with a renderPlay slot per row", async () => {
    const reversed = [tracks[1], tracks[0]];
    const { container } = render(
      <TrackList
        tracks={reversed}
        renderPlay={(track) => <button type="button">Play {track.title}</button>}
      />,
    );
    const rows = within(screen.getByRole("list", { name: "Tracklist" })).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Throne Room");
    expect(rows[0]).toHaveTextContent("4:05");
    expect(rows[0]).toHaveTextContent("Prod. Yeshua Throne");
    expect(rows[1]).toHaveTextContent("Austin Nights");
    expect(rows[1]).toHaveTextContent("–:––");
    expect(screen.getByRole("button", { name: "Play Austin Nights" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
