export type Site = {
  COMPANY_NAME: string;
  LEGAL_NAME: string;
  TITLE: string;
  DESCRIPTION: string;
  CANONICAL_URL: string;
  LOCALE?: string; // default en
  OG_IMAGE: string;

  TWITTER?: {
    CREATOR?: string; // twitter handle
    CARD?: "summary" | "summary_large_image" | "app" | "player";
  };
};
