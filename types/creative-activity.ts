export const CREATIVE_CATEGORIES = ["창체", "자율", "봉사", "진로"] as const;
export const MAX_CREATIVE_GENERATION_ROWS = 50;

export type CreativeCategory = (typeof CREATIVE_CATEGORIES)[number];

export type RawCreativeActivity = {
  date: string;
  category: string;
  activity: string;
  hours: number;
  needsReview: boolean;
};

export type CreativeActivityRow = {
  id: string;
  selected: boolean;
  date: string;
  category: CreativeCategory;
  activity: string;
  hours: number;
  needsReview: boolean;
  comment: string;
};

export type CreativeActivityResult = { id: string; date: string; comment: string };
