import { z } from "zod";

const adminEmailSchema = z.string().trim().toLowerCase().email();

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function readAdminEmail(env: Record<string, string | undefined>): string {
  const parsed = adminEmailSchema.safeParse(env.ADMIN_EMAIL);
  if (!parsed.success) throw new Error("ADMIN_EMAIL 환경변수를 확인해 주세요.");
  return parsed.data;
}

export function isAdminEmail(
  email: string | null | undefined,
  env: Record<string, string | undefined>,
): boolean {
  if (!email) return false;
  try {
    return normalizeEmail(email) === readAdminEmail(env);
  } catch {
    return false;
  }
}
