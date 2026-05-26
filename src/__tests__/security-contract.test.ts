/**
 * Critical-path security contract tests.
 *
 * Mirror of the static checks in `.github/scripts/security-check.mjs` but
 * runnable locally via `bun test`. Keeps the auth/CORS/service-role posture
 * verified even if CI is bypassed or someone runs vitest in isolation.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", "_repo-backups", "contracts"].includes(entry)) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(ROOT);

describe("security contract", () => {
  it("every *.functions.ts server fn uses requireSupabaseAuth or is annotated @public-server-fn", () => {
    const offenders: string[] = [];
    for (const file of allFiles.filter((f) => /\.functions\.tsx?$/.test(f))) {
      const src = readFileSync(file, "utf8");
      if (!src.includes("createServerFn")) continue;
      if (src.includes("requireSupabaseAuth")) continue;
      if (/\/\/\s*@public-server-fn/.test(src)) continue;
      offenders.push(file.replace(ROOT + "/", ""));
    }
    expect(offenders, `unauthenticated server fns: ${offenders.join(", ")}`).toEqual([]);
  });

  it("no Supabase edge function uses wildcard CORS", () => {
    const offenders: string[] = [];
    for (const file of allFiles.filter(
      (f) => f.includes("/supabase/functions/") && f.endsWith(".ts"),
    )) {
      const src = readFileSync(file, "utf8");
      if (/["']Access-Control-Allow-Origin["']\s*:\s*["']\*["']/.test(src)) {
        offenders.push(file.replace(ROOT + "/", ""));
      }
    }
    expect(offenders, `wildcard CORS in: ${offenders.join(", ")}`).toEqual([]);
  });

  it("client.server.ts is never imported from client-side code", () => {
    const offenders: string[] = [];
    for (const file of allFiles.filter(
      (f) =>
        f.startsWith(join(ROOT, "src")) &&
        /\.(ts|tsx)$/.test(f) &&
        !/\.server\.ts$/.test(f) &&
        !/\.functions\.tsx?$/.test(f) &&
        !f.includes("/integrations/supabase/") &&
        !f.includes("/src/routes/api/"),
    )) {
      const src = readFileSync(file, "utf8");
      if (/from\s+["']@\/integrations\/supabase\/client\.server["']/.test(src)) {
        offenders.push(file.replace(ROOT + "/", ""));
      }
    }
    expect(offenders, `service-role client in client code: ${offenders.join(", ")}`).toEqual([]);
  });

  it("Stripe webhook route exists at the canonical path", () => {
    const src = readFileSync(join(ROOT, "src/routes/api/public/payments/webhook.ts"), "utf8");
    expect(src).toContain("/api/public/payments/webhook");
    expect(src).toContain("verifyWebhook");
    expect(src).toContain("stripe_webhook_events"); // idempotency
  });
});
