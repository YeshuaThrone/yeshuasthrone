import { describe, expect, it } from "vitest";
import { getBookingContact, site, socials, type SiteConfig } from "./site";

const withBooking = (bookingEmail: string | null): SiteConfig => ({ ...site, bookingEmail });

describe("site config", () => {
  it("ships Instagram as the only confirmed social, matching site.instagram", () => {
    expect(socials).toHaveLength(1);
    expect(socials[0]).toMatchObject({
      platform: "instagram",
      handle: "@yeshuasthrone",
      href: "https://instagram.com/yeshuasthrone",
    });
    expect(socials[0].href).toBe(site.instagram);
  });

  it("has no booking email or story hero image until supplied", () => {
    expect(site.bookingEmail).toBeNull();
    expect(site.storyHeroImage).toBeNull();
  });
});

describe("getBookingContact", () => {
  it("falls back to Instagram DMs when no address is set", () => {
    expect(getBookingContact(withBooking(null))).toEqual({
      kind: "instagram",
      href: site.instagram,
    });
  });

  it("treats a blank address as missing so no dead mailto renders", () => {
    expect(getBookingContact(withBooking("   ")).kind).toBe("instagram");
  });

  it("builds a mailto once an address exists", () => {
    expect(getBookingContact(withBooking(" booking@example.test "))).toEqual({
      kind: "email",
      email: "booking@example.test",
      href: "mailto:booking@example.test",
    });
  });

  it("defaults to the live site config", () => {
    expect(getBookingContact()).toEqual(getBookingContact(site));
  });
});
