/** Shown above a release rendered through the preview secret. */
export function PreviewBanner() {
  return (
    <div
      role="status"
      data-testid="preview-banner"
      className="border-b border-gold/40 bg-gold/10 px-6 py-3 text-center font-mono text-xs uppercase tracking-[0.3em] text-gold"
    >
      Preview — not published
    </div>
  );
}
