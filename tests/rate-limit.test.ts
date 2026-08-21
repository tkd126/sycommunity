import { describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("같은 IP의 제한 초과 요청을 차단하고 시간이 지나면 허용한다", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });

    expect(limiter.check("127.0.0.1", 0)).toBe(true);
    expect(limiter.check("127.0.0.1", 1)).toBe(true);
    expect(limiter.check("127.0.0.1", 2)).toBe(false);
    expect(limiter.check("127.0.0.1", 60_001)).toBe(true);
  });

  it("요청 본문이나 학생 정보는 저장하지 않는다", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    limiter.check("10.0.0.1", 0);

    expect(limiter.size()).toBe(1);
  });
});
