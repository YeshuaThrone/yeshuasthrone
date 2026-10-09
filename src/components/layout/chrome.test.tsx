import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { nav, socials } from "@/content/site";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

// The root layout is exercised end-to-end by Playwright; next/font cannot run
// under jsdom, so the unit smoke covers the chrome components it mounts.

describe("SiteHeader", () => {
  it("renders the wordmark linking home", () => {
    render(<SiteHeader />);
    const home = screen.getByRole("link", { name: /yeshua throne — home/i });
    expect(home).toHaveAttribute("href", "/");
    expect(home).toHaveTextContent("YESHUA THRONE");
  });

  it("renders every primary nav link", () => {
    render(<SiteHeader />);
    const primary = screen.getByRole("navigation", { name: "Primary" });
    for (const item of nav) {
      expect(within(primary).getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }
    expect(within(primary).getAllByRole("link")).toHaveLength(nav.length);
  });
});

describe("SiteFooter", () => {
  it("renders the Instagram link from site content", () => {
    render(<SiteFooter />);
    const instagram = screen.getByRole("link", { name: /instagram @yeshuasthrone/i });
    expect(instagram).toHaveAttribute("href", "https://instagram.com/yeshuasthrone");
    expect(instagram).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("renders one link per configured social", () => {
    render(<SiteFooter />);
    const list = screen.getByRole("list", { name: "Social links" });
    expect(within(list).getAllByRole("link")).toHaveLength(socials.length);
  });
});
