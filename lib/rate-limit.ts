export function createRateLimiter(options: { windowMs: number; maxRequests: number }) {
  const requestsByIp = new Map<string, number[]>();

  return {
    check(ip: string, now = Date.now()): boolean {
      const cutoff = now - options.windowMs;
      const recent = (requestsByIp.get(ip) ?? []).filter((timestamp) => timestamp > cutoff);

      if (recent.length >= options.maxRequests) {
        requestsByIp.set(ip, recent);
        return false;
      }

      recent.push(now);
      requestsByIp.set(ip, recent);
      return true;
    },
    size(): number {
      return requestsByIp.size;
    },
  };
}

export const reportRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });
