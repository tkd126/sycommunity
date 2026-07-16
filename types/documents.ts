export const ACHIEVEMENT_LEVELS = ["매우 잘함", "잘함", "보통", "노력 요함"] as const;

export type AchievementLevel = (typeof ACHIEVEMENT_LEVELS)[number];

export type ParsedStudentLevel = {
  studentNumber: number;
  level: AchievementLevel | "";
  rawLevel: string;
  confirmed: boolean;
};

export type ParsedArea = {
  areaId: string;
  areaName: string;
  students: ParsedStudentLevel[];
  warnings: string[];
};

export type ParsedRosterStudent = {
  studentNumber: number;
};

export type DocumentAnalysisResponse = {
  roster: ParsedRosterStudent[];
  areas: ParsedArea[];
  evaluationPlanText: string;
  worksheetText: string;
  warnings: string[];
};

export type SharedEvaluationPlan = {
  fileName: string;
  extractedText: string;
  analyzedAt: string;
};
