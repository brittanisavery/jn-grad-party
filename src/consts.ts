import type { Site } from "./types";

export const SITE: Site = {
  COMPANY_NAME: "Avery Incorporated",
  TITLE: "Jeyda's Graduation Celebration",
  DESCRIPTION:
    "Celebrating Jeyda's Graduation with a special event on May 30, 2027.",
  CANONICAL_URL: import.meta.env.DEV
    ? "http://localhost:4321"
    : "https://jn-grad-party.netlify.app/",
  LOCALE: "en",
  ADDRESS: "Chicago, IL 60601",
};
