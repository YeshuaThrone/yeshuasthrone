import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "@/test/axe";
import type { SubscribeResult } from "@/components/types";
import { DropAlertForm, stateFromResult } from "./DropAlertForm";

const caption = "Get the alert when CHAMPION drops";

function renderForm(result: SubscribeResult | Error) {
  const onSubmit = vi.fn<(formData: FormData) => Promise<SubscribeResult>>(async () => {
    if (result instanceof Error) throw result;
    return result;
  });
  render(<DropAlertForm caption={caption} source="release:champion" onSubmit={onSubmit} />);
  return onSubmit;
}

async function submit(email: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(caption), email);
  await user.click(screen.getByRole("button", { name: "Join the list" }));
  return user;
}

describe("DropAlertForm", () => {
  it("has an accessible email label, a hidden honeypot, and no axe violations", async () => {
    const { container } = render(
      <DropAlertForm caption={caption} source="home" onSubmit={vi.fn()} />,
    );
    expect(screen.getByLabelText(caption)).toHaveAttribute("type", "email");
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).toHaveAttribute("autocomplete", "off");
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("calls onSubmit with email, source and the empty honeypot, then shows created", async () => {
    const onSubmit = renderForm({ ok: true, state: "created" });
    await submit("fan@example.com");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [formData] = onSubmit.mock.calls[0];
    expect(formData.get("email")).toBe("fan@example.com");
    expect(formData.get("source")).toBe("release:champion");
    expect(formData.get("website")).toBe("");
    expect(screen.getByRole("status")).toHaveTextContent(/you're on the list/i);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("treats already_subscribed as success", async () => {
    renderForm({ ok: true, state: "already_subscribed" });
    await submit("fan@example.com");
    expect(screen.getByRole("status")).toHaveTextContent(/already on the list/i);
  });

  it("keeps the typed email and shows the rate-limited message", async () => {
    const onSubmit = renderForm({ ok: false, code: "rate_limited" });
    await submit("fan@example.com");
    expect(screen.getByRole("alert")).toHaveTextContent(/too many tries/i);
    expect(screen.getByLabelText(caption)).toHaveValue("fan@example.com");
    expect(screen.getByLabelText(caption)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Join the list" })).toBeEnabled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("keeps the typed email on a server error and allows retry", async () => {
    const onSubmit = renderForm({ ok: false, code: "server_error" });
    const user = await submit("fan@example.com");
    expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i);
    expect(screen.getByLabelText(caption)).toHaveValue("fan@example.com");
    await user.click(screen.getByRole("button", { name: "Join the list" }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it("keeps the typed email when onSubmit throws", async () => {
    renderForm(new Error("network"));
    await submit("fan@example.com");
    expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i);
    expect(screen.getByLabelText(caption)).toHaveValue("fan@example.com");
  });
});

describe("stateFromResult", () => {
  it.each<[SubscribeResult, string]>([
    [{ ok: true, state: "created" }, "created"],
    [{ ok: true, state: "already_subscribed" }, "already_subscribed"],
    [{ ok: false, code: "rate_limited" }, "rate_limited"],
    [{ ok: false, code: "server_error" }, "error"],
    [{ ok: false, code: "invalid_email" }, "error"],
  ])("%j → %s", (result, phase) => {
    expect(stateFromResult(result).phase).toBe(phase);
  });
});
