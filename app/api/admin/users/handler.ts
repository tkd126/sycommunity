import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";

type AdminAccess = typeof requireAdmin;

type AdminUserRecord = {
  id: string;
  email: string | null;
  name: string | null;
  subscriptionStatus: "pending" | "active" | "suspended" | "expired";
  createdAt: Date;
};

type ListAdminUsersDependencies = {
  requireAdmin: AdminAccess;
  listUsers: () => Promise<AdminUserRecord[]>;
};

function serializeUser(user: AdminUserRecord, ownerId: string) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    subscriptionStatus: user.subscriptionStatus,
    protected: user.id === ownerId,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function handleListAdminUsers(dependencies: ListAdminUsersDependencies) {
  const access = await dependencies.requireAdmin();

  if (!access.ok) {
    return NextResponse.json(
      { code: access.code, message: access.message },
      { status: access.status },
    );
  }

  const users = await dependencies.listUsers();

  return NextResponse.json({
    users: users.map((user) => serializeUser(user, access.userId)),
  });
}

export async function GET() {
  return handleListAdminUsers({
    requireAdmin,
    listUsers: () => prisma.user.findMany({
      orderBy: { createdAt: "desc" },
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
