#!/usr/bin/env node
// Parse `vite build` output and emit GitHub Actions `::error` annotations
// pinned to the failing route/component file. Vite/Rollup/esbuild errors
// come in several shapes — we cover the common ones:
//
//   1. Rollup transform errors:
//      [vite:react] /full/path/src/routes/foo.tsx: Unexpected token (12:4)
//   2. Esbuild errors with location:
//      ✘ [ERROR] Could not resolve "@/lib/missing"
//          src/routes/foo.tsx:5:23
//   3. "Failed to resolve import" runtime/SSR errors:
//      Failed to resolve import "@/lib/missing" from "src/routes/foo.tsx".
import { readFileSync } from "node:fs";
import path from "node:path";

const [logPath] = process.argv.slice(2);
if (!logPath) {
  console.error("usage: annotate-vite.mjs <log-file>");
  process.exit(2);
}

const cwd = process.cwd();
const toRel = (p) => {
  if (!p) return p;
  const abs = path.isAbsolute(p) ? p : path.resolve(cwd, p);
  return path.relative(cwd, abs) || p;
};

const log = readFileSync(logPath, "utf8");
const lines = log.split(/\r?\n/);

const annotations = [];
const push = (file, line, col, msg) => {
  if (!file) return;
  const rel = toRel(file);
  annotations.push({ file: rel, line: line || 1, col: col || 1, msg });
};

// Pattern 1: Rollup-style "[plugin] /path/to/file.tsx: message (line:col)"
const ROLLUP_RE = /\[([^\]]+)\]\s+(\/[^\s:]+\.\w+):\s*(.+?)(?:\s*\((\d+):(\d+)\))?$/;
// Pattern 2: esbuild ERROR header — capture next non-empty location line.
const ESBUILD_HEADER_RE = /✘\s*\[ERROR\]\s+(.+)$/;
const ESBUILD_LOC_RE = /^\s*([^\s:][^:]*\.\w+):(\d+):(\d+)/;
// Pattern 3: "Failed to resolve import \"X\" from \"Y\""
const RESOLVE_RE = /Failed to resolve import\s+"([^"]+)"\s+from\s+"([^"]+)"/;
// Pattern 4: Generic "src/.../file.tsx:line:col" anywhere in the line.
const GENERIC_LOC_RE = /(src\/[^\s:()]+\.\w+):(\d+):(\d+)/;

for (let i = 0; i < lines.length; i++) {
  const ln = lines[i];

  let m = ln.match(ROLLUP_RE);
  if (m) {
    push(m[2], m[4], m[5], `${m[1]}: ${m[3]}`);
    continue;
  }

  m = ln.match(ESBUILD_HEADER_RE);
  if (m) {
    const msg = m[1];
    // Look ahead a few lines for the location.
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const loc = lines[j].match(ESBUILD_LOC_RE);
      if (loc) {
        push(loc[1], loc[2], loc[3], msg);
        break;
      }
    }
    continue;
  }

  m = ln.match(RESOLVE_RE);
  if (m) {
    push(m[2], 1, 1, `Failed to resolve import "${m[1]}"`);
    continue;
  }

  m = ln.match(GENERIC_LOC_RE);
  if (m) {
    push(m[1], m[2], m[3], ln.trim());
  }
}

// De-dupe identical (file,line,col,msg) tuples.
const seen = new Set();
let count = 0;
for (const a of annotations) {
  const key = `${a.file}:${a.line}:${a.col}:${a.msg}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const cleanMsg = a.msg.replace(/[\r\n]+/g, " ");
  const isRoute = a.file.startsWith("src/routes/");
  const title = isRoute
    ? `Vite build failed in route ${a.file}`
    : `Vite build failed in ${a.file}`;
  process.stdout.write(
    `::error file=${a.file},line=${a.line},col=${a.col},title=${title}::${cleanMsg}\n`,
  );
  count++;
}

if (count === 0) {
  const tail = log.trim().split(/\r?\n/).slice(-30).join("\n");
  process.stdout.write(
    `::error title=Vite build failed::No file location parsed. Tail of output:\n${tail}\n`,
  );
}
