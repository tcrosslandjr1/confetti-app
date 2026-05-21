#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const shouldFindConfetti = process.argv.includes("--find-confetti");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return [key, rest.join("=").replace(/^["']|["']$/g, "")];
      })
  );
}

function loadEnv() {
  return {
    ...parseEnvFile(path.join(root, ".env.example")),
    ...parseEnvFile(path.join(root, ".env")),
    ...parseEnvFile(path.join(root, ".env.local")),
    ...process.env
  };
}

function mask(value) {
  if (!value) return "missing";
  if (value.length <= 10) return `${value.slice(0, 2)}...`;
  return `${value.slice(0, 6)}...${value.slice(-4)} (${value.length} chars)`;
}

async function findConfettiProjects(accessToken) {
  const response = await fetch("https://api.supabase.com/v1/projects", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase Management API returned ${response.status}: ${text}`);
  }

  const projects = await response.json();
  const matches = projects.filter((project) => {
    const haystack = `${project.name ?? ""} ${project.id ?? ""} ${project.region ?? ""}`.toLowerCase();
    return haystack.includes("confetti");
  });

  if (!matches.length) {
    console.log("No Supabase project containing 'confetti' was found for this access token.");
    return;
  }

  console.log("Confetti Supabase project match(es):");
  for (const project of matches) {
    console.log(`- ${project.name} (${project.id}) · ${project.region ?? "unknown region"}`);
  }
}

async function verifyFrontendConfig(env) {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
  const projectName = env.VITE_SUPABASE_PROJECT_NAME ?? "Confetti";

  console.log(`Project name hint: ${projectName}`);
  console.log(`VITE_SUPABASE_URL: ${supabaseUrl ?? "missing"}`);
  console.log(`VITE_SUPABASE_ANON_KEY: ${mask(supabaseAnonKey)}`);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Run npm run supabase:setup first.");
  }

  if (supabaseUrl.includes("your-project-ref") || supabaseAnonKey.includes("your-supabase")) {
    throw new Error("Supabase env values are still placeholders.");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  console.log(`Auth client reachable: ${data.session ? "session found" : "no session, client ok"}`);

  const callbackUrl = "http://127.0.0.1:5174/auth/callback";
  console.log(`Required local redirect URL: ${callbackUrl}`);
  console.log("Also add your production domain with /auth/callback in Supabase Auth Redirect URLs.");
}

const env = loadEnv();

try {
  if (shouldFindConfetti) {
    const accessToken = env.SUPABASE_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("SUPABASE_ACCESS_TOKEN is required for --find-confetti.");
    }
    await findConfettiProjects(accessToken);
  }

  await verifyFrontendConfig(env);
  console.log("Confetti Supabase verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
