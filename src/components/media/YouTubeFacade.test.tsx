import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "@/test/axe";
import { YouTubeFacade, youtubeEmbedUrl } from "./YouTubeFacade";

describe("YouTubeFacade", () => {
  it("renders a button with the thumbnail and no iframe before click", async () => {
    const { container } = render(
      <YouTubeFacade videoId="0vNAxj-xvZs" title="Dreams (Official Video)" />,
    );
    expect(container.querySelector("iframe")).toBeNull();
    const button = screen.getByRole("button", { name: "Play Dreams (Official Video)" });
    expect(button.querySelector("img")).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/0vNAxj-xvZs/hqdefault.jpg",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("uses a custom thumbnail when one is passed", () => {
    render(
      <YouTubeFacade videoId="abc" title="Clip" thumbnail="https://example.test/still.jpg" />,
    );
    expect(screen.getByRole("button").querySelector("img")).toHaveAttribute(
      "src",
      "https://example.test/still.jpg",
    );
  });

  it("injects exactly one nocookie iframe with autoplay after click", async () => {
    const user = userEvent.setup();
    const { container } = render(<YouTubeFacade videoId="0vNAxj-xvZs" title="Dreams" />);
    await user.click(screen.getByRole("button", { name: "Play Dreams" }));
    const iframes = container.querySelectorAll("iframe");
    expect(iframes).toHaveLength(1);
    expect(iframes[0]).toHaveAttribute("src", youtubeEmbedUrl("0vNAxj-xvZs"));
    expect(iframes[0].getAttribute("src")).toContain("youtube-nocookie.com");
    expect(iframes[0].getAttribute("src")).toContain("autoplay=1");
    expect(iframes[0]).toHaveAttribute("title", "Dreams");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
