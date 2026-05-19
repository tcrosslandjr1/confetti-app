#!/usr/bin/env node
/**
 * Security regression check.
 *
 * Runs on every PR. Fails the build if any HIGH-severity finding is detected
 * that is not explicitly allow-listed in .github/security/baseline.json.
 *
 * Two sources of findings:
 *  1) Static code checks for the specific regressions we've already fixed
 *     (server fns missing requireSupabaseAuth, wildcard CORS, etc).
 *  2) Optional remote scan results via LOVABLE_SECURITY_SCAN_URL +
 *     LOVABLE_SECURITY_SCAN_TOKEN (set as GitHub secrets). If unset, the
 *     remote check is skipped and only static checks run.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const BASELINE = JSON.parse(
  readFileSync(join(ROOT, ".github/security/baseline.json"), "utf8"),
);
const allowed = new Set(BASELINE.allowed ?? []);

/** @type {{id:string,severity:'high'|'medium'|'low',message:string,file?:string}[]} */
const findings = [];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(ROOT);

// ---- Static rule 1: server functions missing requireSupabaseAuth ----
// Any *.functions.ts(x) file that calls createServerFn but neither uses
// requireSupabaseAuth middleware nor is explicitly marked public.
const SERVERFN_EXEMPT = new Set([
  // Truly public server fns can be listed here with a justification.
]);

for (const file of allFiles.filter((f) => /\.functions\.tsx?$/.test(f))) {
  const src = readFileSync(file, "utf8");
  if (!src.includes("createServerFn")) continue;
  const rel = relative(ROOT, file);
  if (SERVERFN_EXEMPT.has(rel)) continue;
  if (src.includes("requireSupabaseAuth")) continue;
  if (/\/\/\s*@public-server-fn/.test(src)) continue;
  findings.push({
    id: `serverfn_missing_auth:${rel}`,
    severity: "high",
    message: `Server function file is missing requireSupabaseAuth middleware. Add the middleware or annotate with // @public-server-fn and justify.`,
    file: rel,
  });
}

// ---- Static rule 2: wildcard CORS in supabase edge functions ----
for (const file of allFiles.filter(
  (f) => f.includes("/supabase/functions/") && f.endsWith(".ts"),
)) {
  const src = readFileSync(file, "utf8");
  if (/["']Access-Control-Allow-Origin["']\s*:\s*["']\*["']/.test(src)) {
    findings.push({
      id: `wildcard_cors:${relative(ROOT, file)}`,
      severity: "high",
      message: `Wildcard CORS ("*") detected. Restrict to ALLOWED_ORIGIN.`,
      file: relative(ROOT, file),
    });
  }
}

// ---- Static rule 3: service-role client imported from client-side code ----
for (const file of allFiles.filter(
  (f) =>
    f.startsWith(join(ROOT, "src")) &&
    /\.(ts|tsx)$/.test(f) &&
    !/\.server\.ts$/.test(f) &&
    !/\.functions\.tsx?$/.test(f) &&
    !f.includes("/integrations/supabase/") &&
    // src/routes/api/** are TanStack server route handlers (server-only).
    !f.includes("/src/routes/api/"),
)) {
  const src = readFileSync(file, "utf8");
  if (/from\s+["']@\/integrations\/supabase\/client\.server["']/.test(src)) {
    findings.push({
      id: `service_role_in_client:${relative(ROOT, file)}`,
      severity: "high",
      message: `client.server.ts (service-role) imported from client-side code. This bypasses RLS in the browser.`,
      file: relative(ROOT, file),
    });
  }
}

// ---- Static rule 4: process.env in client-side modules ----
// Skip — too noisy without AST; rely on Vite to fail at build for true client refs.

// ---- Optional remote scan ----
const remoteUrl = process.env.LOVABLE_SECURITY_SCAN_URL;
const remoteToken = process.env.LOVABLE_SECURITY_SCAN_TOKEN;
if (remoteUrl && remoteToken) {
  try {
    const res = await fetch(remoteUrl, {
      headers: { Authorization: `Bearer ${remoteToken}` },
    });
    if (!res.ok) {
      console.error(`Remote scan HTTP ${res.status}`);
    } else {
      const data = await res.json();
      for (const f of data.findings ?? []) {
        findings.push({
          id: f.id,
          severity: (f.severity || "").toLowerCase(),
          message: f.title || f.message || "(no message)",
          file: f.file,
        });
      }
    }
  } catch (e) {
    console.error(`Remote scan failed: ${e.message}`);
  }
} else {
  console.log("Remote scan skipped (LOVABLE_SECURITY_SCAN_URL/TOKEN not set).");
}

// ---- Filter & report ----
const high = findings.filter(
  (f) => f.severity === "high" && !allowed.has(f.id) && !allowed.has(f.id.split(":")[0]),
);

const summary = [
  `# Security Scan`,
  ``,
  `- Total findings: ${findings.length}`,
  `- High severity (unallowed): ${high.length}`,
  `- Allow-listed: ${allowed.size}`,
  ``,
];

if (high.length) {
  summary.push(`## ❌ High-severity findings`, ``);
  for (const f of high) {
    summary.push(`- **${f.id}** — ${f.message}`);
    if (f.file) console.log(`::error file=${f.file}::[security] ${f.id} — ${f.message}`);
    else console.log(`::error::[security] ${f.id} — ${f.message}`);
  }
} else {
  summary.push(`## ✅ No new high-severity findings`);
}

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  await import("node:fs").then((fs) =>
    fs.appendFileSync(summaryPath, summary.join("\n") + "\n"),
  );
}
console.log(summary.join("\n"));

if (high.length > 0) {
  process.exit(1);
}
