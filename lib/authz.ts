import { getServerSession } from "next-auth";

import { normalizeEmail, readAdminEmail } from "@/lib/admin-identity";
import { authOptions } from "@/lib/auth-options";

export type AccessCheckResult =
  | { ok: true; userId: string; email: string | null; role: "teacher" | "admin" }
  | { ok: false; status: 401 | 403 | 500; code: string; message: string };

export async function requireActiveSubscription(): Promise<AccessCheckResult> {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return {
      ok: false,
      status: 401,
      code: "AUTH_REQUIRED",
      message: "로그인 후 이용할 수 있습니다.",
    };
  }

  if (user.subscriptionStatus !== "active") {
    return {
      ok: false,
      status: 403,
      code: "SUBSCRIPTION_REQUIRED",
      message: "관리자 승인 후 이용할 수 있습니다.",
    };
  }

  return {
    ok: true,
    userId: user.id,
    email: user.email ?? null,
    role: user.role,
  };
}

export function evaluateAdminAccess(
  active: AccessCheckResult,
  env: Record<string, string | undefined>,
): AccessCheckResult {
  if (!active.ok) return active;

  let adminEmail: string;
  try {
    adminEmail = readAdminEmail(env);
  } catch {
    return {
      ok: false,
      status: 500,
      code: "SERVER_CONFIG_ERROR",
      message: "관리자 환경설정을 확인해 주세요.",
    };
  }

  if (!active.email || normalizeEmail(active.email) !== adminEmail) {
    return {
      ok: false,
      status: 403,
      code: "ADMIN_REQUIRED",
      message: "관리자만 이용할 수 있습니다.",
    };
  }

  return { ...active, role: "admin" };
}

export async function requireAdmin(): Promise<AccessCheckResult> {
  return evaluateAdminAccess(await requireActiveSubscription(), process.env);
}
