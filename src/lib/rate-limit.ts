import { getRequest } from "@tanstack/react-start/server";

export async function hashIp() {
  try {
    const req = getRequest();
    const bruto =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip");
    
    if (!bruto) return "unknown-ip";
    
    const bytes = new TextEncoder().encode(`praxa:${bruto}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "unknown-ip";
  }
}

// Simple in-memory rate limiter (Token Bucket / Sliding Window logic could be added)
// Note: In a serverless environment (like Vercel), this state is kept per-function instance.
// For a fully distributed rate limit, consider using Redis (Upstash) or a Supabase table.
const rateLimitCache = new Map<string, { count: number; expiresAt: number }>();

export async function checkRateLimit(action: string, limit: number, windowMs: number): Promise<boolean> {
  const ip = await hashIp();
  const key = `${action}:${ip}`;
  const now = Date.now();

  const record = rateLimitCache.get(key);

  if (!record || record.expiresAt < now) {
    rateLimitCache.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}
