import type { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function clientIp(req: Request): string {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Limitador in-process (por instância da Function/Express).
 * Não substitui Cloud Armor, mas bloqueia brute-force básico.
 */
export function rateLimit(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${clientIp(req)}:${req.method}:${req.path}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Limit", String(limit));
      res.setHeader("X-RateLimit-Remaining", String(limit - 1));
      next();
      return;
    }

    if (current.count >= limit) {
      const retry = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retry));
      res.status(429).json({ error: "Muitas requisições. Tente novamente em instantes." });
      return;
    }

    current.count += 1;
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - current.count)));
    next();
  };
}
