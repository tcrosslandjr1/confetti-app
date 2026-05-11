#!/usr/bin/env node
// Write a human-friendly failure summary to $GITHUB_STEP_SUMMARY listing
// the failing routes/components from typecheck and vite logs.
import { readFileSync, existsSync, appendFileSync } from "node:fs";

const [tscLog, viteLog] = process.argv.slice(2);
const out = process.env.GITHUB_STEP_SUMMARY;
if (!out) {
  console.error("GITHUB_STEP_SUMMARY not set; nothing to write.");
  process.exit(0);
}

const TSC_RE = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/;
const VITE_LOC_RE = /(src\/[^\s:()]+\.\w+):(\d+):(\d+)/;

function readSafe(p) {
  return p && existsSync(p) ? readFileSync(p, "utf8") : "";
}

function groupTsc(log) {
  const byFile = new Map();
  for (const raw of log.split(/\r?\n/)) {
    const m = raw.match(TSC_RE);
    if (!m) continue;
    const [, file, line, , code, msg] = m;
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push({ line, code, msg });
  }
  return byFile;
}

function groupVite(log) {
  const byFile = new Map();
  for (const raw of log.split(/\r?\n/)) {
    const m = raw.match(VITE_LOC_RE);
    if (!m) continue;
    const [, file, line] = m;
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push({ line, msg: raw.trim() });
  }
  return byFile;
}

function renderSection(title, byFile) {
  if (byFile.size === 0) return "";
  let md = `\n## ${title}\n\n`;
  const routes = [];
  const components = [];
  const other = [];
  for (const [file, items] of byFile) {
    if (file.startsWith("src/routes/")) routes.push([file, items]);
    else if (file.startsWith("src/components/")) components.push([file, items]);
    else other.push([file, items]);
  }
  const render = (label, group) => {
    if (group.length === 0) return "";
    let s = `### ${label}\n\n`;
    for (const [file, items] of group) {
      s += `- **\`${file}\`** (${items.length} issue${items.length === 1 ? "" : "s"})\n`;
      for (const it of items.slice(0, 5)) {
        const code = it.code ? `\`${it.code}\` ` : "";
        s += `  - L${it.line}: ${code}${it.msg}\n`;
      }
      if (items.length > 5) s += `  - …and ${items.length - 5} more\n`;
    }
    return s + "\n";
  };
  md += render("Routes", routes);
  md += render("Components", components);
  md += render("Other", other);
  return md;
}

const tsc = groupTsc(readSafe(tscLog));
const vite = groupVite(readSafe(viteLog));

let md = `# Build failed\n`;
if (tsc.size === 0 && vite.size === 0) {
  md += `\nNo file-level diagnostics were parsed. Check the raw logs in the workflow run.\n`;
} else {
  md += `\n${tsc.size} typecheck file(s), ${vite.size} build file(s) reported issues.\n`;
}
md += renderSection("Typecheck failures", tsc);
md += renderSection("Vite build failures", vite);

appendFileSync(out, md);
