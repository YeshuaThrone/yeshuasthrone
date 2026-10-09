import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "@/test/axe";
import { DspLinks, PRE_SAVE_EMPTY_MESSAGE, PreSaveRow, isLiveLink } from "./PreSaveRow";

describe("PreSaveRow", () => {
  it("renders zero anchors and the collapsed sentence when every link is empty", async () => {
    const { container } = render(<PreSaveRow dspLinks={{}} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText(PRE_SAVE_EMPTY_MESSAGE)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders exactly one enabled anchor and four disabled chips with one link set", async () => {
    const { container } = render(
      <PreSaveRow dspLinks={{ spotify: "https://open.spotify.com/prerelease/x" }} />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://open.spotify.com/prerelease/x");
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(links[0]).toHaveTextContent(/pre-save on\s*spotify/i);

    const disabled = container.querySelectorAll('[aria-disabled="true"]');
    expect(disabled).toHaveLength(4);
    expect(screen.getAllByText("Pre-save soon")).toHaveLength(4);
    expect(screen.queryByText(PRE_SAVE_EMPTY_MESSAGE)).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("treats blank and non-http values as placeholders, never dead links", () => {
    render(<PreSaveRow dspLinks={{ spotify: "   ", apple: "javascript:alert(1)" }} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText(PRE_SAVE_EMPTY_MESSAGE)).toBeInTheDocument();
  });

  it("switches labels to Listen on in listen mode and renders nothing when empty", () => {
    const { container, rerender } = render(<DspLinks dspLinks={{}} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<DspLinks dspLinks={{ tidal: "https://tidal.com/album/1" }} />);
    expect(screen.getByRole("link")).toHaveTextContent(/listen on\s*tidal/i);
    expect(screen.queryByText("Pre-save soon")).not.toBeInTheDocument();
  });
});

describe("isLiveLink", () => {
  it.each([
    ["https://a.b/c", true],
    ["http://a.b", true],
    ["  https://a.b  ", true],
    ["", false],
    ["   ", false],
    ["ftp://a.b", false],
    [undefined, false],
  ])("%j → %s", (input, expected) => {
    expect(isLiveLink(input)).toBe(expected);
  });
});
