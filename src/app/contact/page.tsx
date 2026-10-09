import type { Metadata } from "next";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { getBookingContact, site, socials } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Booking, press, and where to find ${site.name}.`,
};

/** Booking line: a mailto once an address exists, Instagram DMs until then. */
function BookingLine() {
  const contact = getBookingContact();
  const linkClass = "text-electric-2 underline underline-offset-4 hover:text-text";

  if (contact.kind === "email") {
    return (
      <p className="text-lg text-muted">
        Booking &amp; press:{" "}
        <a href={contact.href} className={linkClass}>
          {contact.email}
        </a>
      </p>
    );
  }

  return (
    <p className="text-lg text-muted">
      <a href={contact.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        DM on Instagram
      </a>{" "}
      for booking &amp; press.
    </p>
  );
}

export default function ContactPage() {
  const instagram = socials.find((social) => social.platform === "instagram");

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
      <header className="flex max-w-2xl flex-col gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Contact</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Get in touch</h1>
        <BookingLine />
      </header>

      {instagram ? (
        <div className="glass-card flex max-w-2xl flex-col gap-4 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
            {instagram.label}
          </p>
          <a
            href={instagram.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl font-semibold tracking-tight text-text transition-colors hover:text-electric-2 sm:text-3xl"
          >
            {instagram.handle}
          </a>
          <p className="text-muted">
            Where the drops get announced first. Follow for studio updates.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Socials</p>
        <SocialLinks />
      </div>
    </section>
  );
}
