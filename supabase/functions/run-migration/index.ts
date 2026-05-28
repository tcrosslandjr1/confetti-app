import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// ONE-TIME migration runner — delete after use
Deno.serve(async (req: Request) => {
  const secret = req.headers.get("x-migration-secret");
  if (secret !== "confetti-migrate-2026") {
    return new Response("Unauthorized", { status: 401 });
  }

  const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
  const pool = new Pool(dbUrl, 1, true);
  const client = await pool.connect();
  const results: string[] = [];

  try {
    // Add social columns to taste_profiles (the real table name)
    await client.queryArray(`
      ALTER TABLE taste_profiles
        ADD COLUMN IF NOT EXISTS social_signals        jsonb DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS last_synced_at        timestamptz,
        ADD COLUMN IF NOT EXISTS platforms_connected   text[] DEFAULT '{}'
    `);
    results.push("taste_profiles social columns added ✓");

    // Verify social_posts_raw exists
    const { rows } = await client.queryArray(`
      SELECT COUNT(*) FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'social_posts_raw'
    `);
    results.push(`social_posts_raw exists: ${rows[0][0] === '1' || Number(rows[0][0]) === 1 ? 'YES ✓' : 'NO ✗'}`);

  } catch (err) {
    results.push(`ERROR: ${err}`);
  } finally {
    client.release();
    await pool.end();
  }

  return Response.json({ ok: true, results });
});
