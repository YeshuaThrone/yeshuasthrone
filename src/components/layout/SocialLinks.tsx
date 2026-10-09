import { socials } from "@/content/site";

export function SocialLinks() {
  if (socials.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-4 text-sm" aria-label="Social links">
      {socials.map((social) => (
        <li key={social.platform}>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-electric-2"
            aria-label={`${social.label} ${social.handle}`}
          >
            {social.handle}
          </a>
        </li>
      ))}
    </ul>
  );
}
