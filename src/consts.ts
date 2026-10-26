import type { Site } from "./types";

export const SITE: Site = {
  COMPANY_NAME: "Avery Incorporated",
  TITLE: "Jeyda's Last Lap: The Grand Finale",
  DESCRIPTION:
    "One last lap. One unforgettable night. The journey made her. The finish line celebrates her.",
  CANONICAL_URL: import.meta.env.DEV
    ? "http://localhost:4321"
    : "https://jn-grad-party.netlify.app/",
  LOCALE: "en",
  ADDRESS: "Chicago, IL 60601",
};
