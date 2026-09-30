import type { Site, Socials } from "./types";

export const SITE: Site = {
  COMPANY_NAME: "Avery Incorporated",
  LEGAL_NAME: "One Space Away Interiors, LLC",
  TITLE: "Home, just the way you like.",
  DESCRIPTION: "Discover the joy of living in a space that feels truly yours.",
  CANONICAL_URL: import.meta.env.DEV
    ? "http://localhost:4321"
    : "https://one-space-away-html.pages.dev",
  LOCALE: "en",
  TELEPHONE: "(310) 555-2389",
  EMAIL: "info@onespaceaway.com",
  ADDRESS: "456 Camden Drive, Suite 300, Beverly Hills, CA 90210",

  OG_IMAGE: "/og-image.webp",
};
