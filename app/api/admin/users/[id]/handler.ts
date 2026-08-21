import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/db";

type AdminAccess = typeof requireAdmin;

type AdminUserRecord = {
  id: string;
  email: string | null;
  name: string | null;
  subscriptionStatus: "pending" | "active" | "suspended" | "expired";
  createdAt: Date;
};

type UpdateAdminUserDependencies = {
  requireAdmin: AdminAccess;
  updateUser: (id: string, data: AdminUserPatch) => Promise<AdminUserRecord>;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateUserSchema = z.object({
  subscriptionStatus: z.enum(["pending", "active", "suspended", "expired"]),
}).strict();

type AdminUserPatch = z.infer<typeof updateUserSchema>;

function serializeUser(user: AdminUserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    subscriptionStatus: user.subscriptionStatus,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function handleUpdateAdminUser(
  request: Request,
  context: RouteContext,
  dependencies: UpdateAdminUserDependencies,
) {
  const access = await dependencies.requireAdmin();

  if (!access.ok) {
    return NextResponse.json(
      { code: access.code, message: access.message },
      { status: access.status },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", message: "요청 내용을 확인해 주세요." },
      { status: 400 },
    );
  }

  const params = await context.params;

  if (params.id === access.userId) {
    return NextResponse.json(
      { code: "OWNER_ACCOUNT_PROTECTED", message: "관리자 본인의 상태는 변경할 수 없습니다." },
      { status: 403 },
    );
  }

  const user = await dependencies.updateUser(params.id, parsed.data);

  return NextResponse.json({ user: serializeUser(user) });
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleUpdateAdminUser(request, context, {
    requireAdmin,
    updateUser: (id, data) => prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    }),
  });
}
