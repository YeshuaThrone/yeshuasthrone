import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "@/test/axe";
import { CovnantBadge } from "./CovnantBadge";

describe("CovnantBadge", () => {
  it("renders nothing without a code", () => {
    const { container } = render(<CovnantBadge covnantCbtCode={null} covnantUrl={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a blank code", () => {
    const { container } = render(<CovnantBadge covnantCbtCode="   " covnantUrl="https://x" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a plain chip with the code when there is no url", async () => {
    const { container } = render(<CovnantBadge covnantCbtCode="7F3A9" covnantUrl={null} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Registered on Covnant · CBT-7F3A9")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("links to covnantUrl and does not double the CBT prefix", async () => {
    const { container } = render(
      <CovnantBadge covnantCbtCode="CBT-7F3A9" covnantUrl="https://covnant-eta.vercel.app/a/1" />,
    );
    const link = screen.getByRole("link", { name: "Registered on Covnant · CBT-7F3A9" });
    expect(link).toHaveAttribute("href", "https://covnant-eta.vercel.app/a/1");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
