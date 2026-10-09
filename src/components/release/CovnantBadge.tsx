import { formatCbtCode } from "@/lib/format";

interface CovnantBadgeProps {
  covnantCbtCode: string | null;
  covnantUrl: string | null;
}

/**
 * "Registered on Covnant · CBT-…" — one of the few gold moments on the site.
 * Renders nothing for an unregistered release: no empty chrome.
 */
export function CovnantBadge({ covnantCbtCode, covnantUrl }: CovnantBadgeProps) {
  const code = covnantCbtCode?.trim();
  if (!code) return null;

  const label = `Registered on Covnant · ${formatCbtCode(code)}`;
  const chip =
    "inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-3 py-1 font-mono text-xs tracking-[0.15em] text-gold uppercase";

  if (covnantUrl) {
    return (
      <a
        href={covnantUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${chip} transition-colors hover:border-gold-2 hover:text-gold-2`}
      >
        {label}
      </a>
    );
  }

  return <span className={chip}>{label}</span>;
}
