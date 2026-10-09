import { site } from "@/content/site";
import { SocialLinks } from "./SocialLinks";

export function SiteFooter() {
  return (
    <footer className="border-t border-text/8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="text-text">{site.name}</span> · {site.location} ·{" "}
          <span className="text-gold">{site.tagline}</span>
        </p>
        <SocialLinks />
      </div>
    </footer>
  );
}
