import { NextResponse } from "next/server";

import { requireActiveSubscription } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { serializeSavedReport } from "@/app/api/saved-reports/handler";

type Access = typeof requireActiveSubscription;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type SavedReportRecord = Parameters<typeof serializeSavedReport>[0];

type GetDependencies = {
  requireActiveSubscription: Access;
  getReport: (userId: string, id: string) => Promise<SavedReportRecord | null>;
};

type DeleteDependencies = {
  requireActiveSubscription: Access;
  deleteReport: (userId: string, id: string) => Promise<void>;
};

export async function handleGetSavedReport(
  _request: Request,
  context: RouteContext,
  dependencies: GetDependencies,
) {
  const access = await dependencies.requireActiveSubscription();

  if (!access.ok) {
    return NextResponse.json({ code: access.code, message: access.message }, { status: access.status });
  }

  const { id } = await context.params;
  const report = await dependencies.getReport(access.userId, id);

  if (!report) {
    return NextResponse.json({ code: "NOT_FOUND", message: "저장본을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ report: serializeSavedReport(report) });
}

export async function handleDeleteSavedReport(
  _request: Request,
  context: RouteContext,
  dependencies: DeleteDependencies,
) {
  const access = await dependencies.requireActiveSubscription();

  if (!access.ok) {
    return NextResponse.json({ code: access.code, message: access.message }, { status: access.status });
  }

  const { id } = await context.params;
  await dependencies.deleteReport(access.userId, id);

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request, context: RouteContext) {
  return handleGetSavedReport(request, context, {
    requireActiveSubscription,
    getReport: (userId, id) => prisma.savedReport.findFirst({
      where: { id, userId },
      include: { rows: { orderBy: { studentNumber: "asc" } } },
    }),
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return handleDeleteSavedReport(request, context, {
    requireActiveSubscription,
    deleteReport: async (userId, id) => {
      const report = await prisma.savedReport.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!report) return;
      await prisma.savedReport.delete({ where: { id: report.id } });
    },
  });
}
