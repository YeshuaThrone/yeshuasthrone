import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { nav } from "@/content/site";
import RootLayout from "./layout";

// next/font cannot evaluate outside the Next.js build; stub the Geist exports.
vi.mock("geist/font/sans", () => ({ GeistSans: { variable: "font-geist-sans" } }));
vi.mock("geist/font/mono", () => ({ GeistMono: { variable: "font-geist-mono" } }));

describe("RootLayout", () => {
  it("mounts header nav, children, hidden shows slot and footer Instagram link", () => {
    render(
      <RootLayout>
        <p>child content</p>
      </RootLayout>,
    );

    const primary = screen.getByRole("navigation", { name: "Primary" });
    for (const item of nav) {
      expect(within(primary).getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }

    expect(screen.getByRole("main")).toHaveTextContent("child content");

    const shows = document.getElementById("shows");
    expect(shows).not.toBeNull();
    expect(shows).not.toBeVisible();
    expect(shows).toBeEmptyDOMElement();

    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer).getByRole("link", { name: /instagram @yeshuasthrone/i }),
    ).toHaveAttribute("href", "https://instagram.com/yeshuasthrone");
  });
});
