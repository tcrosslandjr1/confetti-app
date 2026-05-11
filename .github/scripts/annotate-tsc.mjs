#!/usr/bin/env node
// Parse `tsc --noEmit --pretty false` output and emit GitHub Actions
// `::error file=...,line=...,col=...::message` annotations so failures
// are pinned to the offending route/component file in the PR diff.
//
// Expected line shape:
//   src/routes/trips.$id.tsx(185,33): error TS2322: Type ... is not assignable ...
import { readFileSync } from "node:fs";

const [logPath] = process.argv.slice(2);
if (!logPath) {
  console.error("usage: annotate-tsc.mjs <log-file>");
  process.exit(2);
}

const TSC_RE = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.*)$/;

const log = readFileSync(logPath, "utf8");
let count = 0;
for (const raw of log.split(/\r?\n/)) {
  const m = raw.match(TSC_RE);
  if (!m) continue;
  const [, file, line, col, sev, code, msg] = m;
  const cleanMsg = `${code}: ${msg}`.replace(/[\r\n]+/g, " ");
  // Group annotations by file so the PR shows a clear list per route/component.
  const title = `Typecheck failed in ${file}`;
  process.stdout.write(
    `::${sev} file=${file},line=${line},col=${col},title=${title}::${cleanMsg}\n`,
  );
  count++;
}

if (count === 0) {
  // Surface raw tail so the user can see what blew up.
  const tail = log.trim().split(/\r?\n/).slice(-20).join("\n");
  process.stdout.write(
    `::error title=Typecheck failed::No TS diagnostics parsed. Tail of output:\n${tail}\n`,
  );
}
