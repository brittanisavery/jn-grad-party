import type { Site } from "./types";

export const SITE: Site = {
  COMPANY_NAME: "Avery Incorporated",
  LEGAL_NAME: "Avery Incorporated",
  TITLE: "Jeyda's Last Lap: The Grand Finale",
  DESCRIPTION:
    "One last lap. One unforgettable night. The journey made her. The finish line celebrates her. Come and celebrate Jeyda's graduation on May 30, 2027 in Chicago!",
  CANONICAL_URL: import.meta.env.DEV
    ? "http://localhost:4321"
    : "https://jn-grad-party.netlify.app/",
  LOCALE: "en",
  ADDRESS: "9220 S Harlem Ave, Bridgeview, IL 60455",
  OG_IMAGE: "/meta-image.jpg",
  TWITTER: {
    CARD: "summary_large_image",
  },
};
