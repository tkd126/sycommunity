import { NextResponse } from "next/server";
import { z } from "zod";

import { requireActiveSubscription } from "@/lib/authz";
import { prisma } from "@/lib/db";

type Access = typeof requireActiveSubscription;

const areaLevelSchema = z.object({
  areaName: z.string().min(1).max(80),
  level: z.string().min(1).max(30),
});

const savedReportRowSchema = z.object({
  studentNumber: z.number().int().min(1).max(999),
  anonymousName: z.string().min(1).max(30),
  subject: z.string().min(1).max(30),
  areaLevels: z.array(areaLevelSchema).max(20),
  selectedAreas: z.array(z.string().min(1).max(80)).max(20),
  comment: z.string().max(2000),
}).strip();

const createSavedReportSchema = z.object({
  title: z.string().min(1).max(120),
  subject: z.string().min(1).max(30),
  schoolYear: z.string().max(20).optional(),
  semester: z.string().max(20).optional(),
  grade: z.string().max(20).optional(),
  className: z.string().max(20).optional(),
  rows: z.array(savedReportRowSchema).min(1).max(80),
}).strip();

type SavedReportInput = z.infer<typeof createSavedReportSchema>;

type SavedReportRecord = {
  id: string;
  userId: string;
  title: string;
  subject: string;
  schoolYear: string | null;
  semester: string | null;
  grade: string | null;
  className: string | null;
  createdAt: Date;
  updatedAt: Date;
  rows?: SavedReportRowRecord[];
};

type SavedReportRowRecord = {
  id: string;
  savedReportId: string;
  studentNumber: number;
  anonymousName: string;
  subject: string;
  areaLevels: unknown;
  selectedAreas: unknown;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
};

type ListDependencies = {
  requireActiveSubscription: Access;
  listReports: (userId: string) => Promise<SavedReportRecord[]>;
};

type CreateDependencies = {
  requireActiveSubscription: Access;
  createReport: (userId: string, data: SavedReportInput) => Promise<SavedReportRecord>;
};

export function serializeSavedReportSummary(report: SavedReportRecord) {
  return {
    id: report.id,
    title: report.title,
    subject: report.subject,
    schoolYear: report.schoolYear,
    semester: report.semester,
    grade: report.grade,
    className: report.className,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export function serializeSavedReport(report: SavedReportRecord) {
  return {
    ...serializeSavedReportSummary(report),
    rows: (report.rows ?? []).map((row) => ({
      id: row.id,
      studentNumber: row.studentNumber,
      anonymousName: row.anonymousName,
      subject: row.subject,
      areaLevels: row.areaLevels,
      selectedAreas: row.selectedAreas,
      comment: row.comment,
    })),
  };
}

export async function handleListSavedReports(dependencies: ListDependencies) {
  const access = await dependencies.requireActiveSubscription();

  if (!access.ok) {
    return NextResponse.json({ code: access.code, message: access.message }, { status: access.status });
  }

  const reports = await dependencies.listReports(access.userId);
  return NextResponse.json({ reports: reports.map(serializeSavedReportSummary) });
}

export async function handleCreateSavedReport(request: Request, dependencies: CreateDependencies) {
  const access = await dependencies.requireActiveSubscription();

  if (!access.ok) {
    return NextResponse.json({ code: access.code, message: access.message }, { status: access.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSavedReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_REQUEST", message: "저장할 평어 내용을 확인해 주세요." }, { status: 400 });
  }

  const report = await dependencies.createReport(access.userId, parsed.data);
  return NextResponse.json({ report: serializeSavedReport(report) }, { status: 201 });
}

export async function GET() {
  return handleListSavedReports({
    requireActiveSubscription,
    listReports: (userId) => prisma.savedReport.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        userId: true,
        title: true,
        subject: true,
        schoolYear: true,
        semester: true,
        grade: true,
        className: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  });
}

export async function POST(request: Request) {
  return handleCreateSavedReport(request, {
    requireActiveSubscription,
    createReport: (userId, data) => prisma.savedReport.create({
      data: {
        userId,
        title: data.title,
        subject: data.subject,
        schoolYear: data.schoolYear,
        semester: data.semester,
        grade: data.grade,
        className: data.className,
        rows: {
          create: data.rows.map((row) => ({
            studentNumber: row.studentNumber,
            anonymousName: row.anonymousName,
            subject: row.subject,
            areaLevels: row.areaLevels,
            selectedAreas: row.selectedAreas,
            comment: row.comment,
          })),
        },
      },
      include: { rows: { orderBy: { studentNumber: "asc" } } },
    }),
  });
}
