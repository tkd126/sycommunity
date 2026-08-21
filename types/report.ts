import type { AchievementLevel } from "@/types/documents";

export type StudentRow = {
  id: string;
  selected: boolean;
  number: number;
  name: string;
  reference: string;
  evaluation: string;
  comment: string;
  subject?: string;
  selectedAreas?: string[];
};

export type Notice = {
  type: "success" | "error" | "info";
  message: string;
} | null;

export type AreaEvidence = {
  id: string;
  name: string;
  file: File | null;
};

export type GenerateStudentInput = {
  studentNumber: number;
  levels: Array<{ areaName: string; level: AchievementLevel }>;
};

export type GeneratedReportRow = {
  studentNumber: number;
  selectedLevels: string;
  comment: string;
};
