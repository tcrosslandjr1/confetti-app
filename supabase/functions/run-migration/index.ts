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
    // Create facebook_oauth_states table (mirrors tiktok/instagram oauth states)
    await client.queryArray(`
      CREATE TABLE IF NOT EXISTS facebook_oauth_states (
        id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        state        text NOT NULL UNIQUE,
        user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        redirect_to  text,
        expires_at   timestamptz NOT NULL,
        consumed_at  timestamptz,
        created_at   timestamptz DEFAULT now()
      )
    `);
    results.push("facebook_oauth_states table created ✓");

    await client.queryArray(`
      CREATE INDEX IF NOT EXISTS idx_facebook_oauth_states_state
        ON facebook_oauth_states (state)
        WHERE consumed_at IS NULL
    `);
    results.push("facebook_oauth_states index created ✓");

    await client.queryArray(`
      ALTER TABLE facebook_oauth_states ENABLE ROW LEVEL SECURITY
    `);
    results.push("facebook_oauth_states RLS enabled ✓");

    // Verify the table exists
    const { rows } = await client.queryArray(`
      SELECT COUNT(*) FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'facebook_oauth_states'
    `);
    results.push(`facebook_oauth_states exists: ${Number(rows[0][0]) === 1 ? 'YES ✓' : 'NO ✗'}`);

  } catch (err) {
    results.push(`ERROR: ${err}`);
  } finally {
    client.release();
    await pool.end();
  }

  return Response.json({ ok: true, results });
});
