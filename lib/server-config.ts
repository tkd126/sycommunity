import { z } from "zod";

const positiveNumber = (fallback: number) =>
  z.coerce.number().positive().finite().default(fallback);

const serverConfigSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.6-terra"),
  MONTHLY_BUDGET_KRW: positiveNumber(30_000),
  USD_KRW_RATE: positiveNumber(1400),
  INPUT_PRICE_PER_1M_USD: positiveNumber(2),
  OUTPUT_PRICE_PER_1M_USD: positiveNumber(12),
  TEACHER_ACCESS_PASSWORD: z.string().min(1),
  DATABASE_URL: z.string().min(1),
});

export type ServerConfig = {
  apiKey: string;
  model: string;
  monthlyBudgetKrw: number;
  usdKrwRate: number;
  inputPricePer1MUsd: number;
  outputPricePer1MUsd: number;
  teacherAccessPassword: string;
  databaseUrl: string;
};

export function readServerConfig(env: Record<string, string | undefined>): ServerConfig {
  for (const key of ["OPENAI_API_KEY", "TEACHER_ACCESS_PASSWORD", "DATABASE_URL"] as const) {
    if (!env[key]) throw new Error(`${key} 환경변수가 필요합니다.`);
  }

  const parsed = serverConfigSchema.safeParse(env);
  if (!parsed.success) {
    const key = parsed.error.issues[0]?.path[0] ?? "서버 설정";
    throw new Error(`${String(key)} 환경변수 값을 확인해 주세요.`);
  }

  return {
    apiKey: parsed.data.OPENAI_API_KEY,
    model: parsed.data.OPENAI_MODEL,
    monthlyBudgetKrw: parsed.data.MONTHLY_BUDGET_KRW,
    usdKrwRate: parsed.data.USD_KRW_RATE,
    inputPricePer1MUsd: parsed.data.INPUT_PRICE_PER_1M_USD,
    outputPricePer1MUsd: parsed.data.OUTPUT_PRICE_PER_1M_USD,
    teacherAccessPassword: parsed.data.TEACHER_ACCESS_PASSWORD,
    databaseUrl: parsed.data.DATABASE_URL,
  };
}
