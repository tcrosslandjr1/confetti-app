// real-auth.jsx — Real Supabase auth wiring for the prototype
// Drop this in, add the Supabase CDN script + 2 env constants, and the
// SignIn/SignUp screens write to your live Supabase + Anthropic backend.
//
// Add to your index.html, before the other JSX scripts:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script type="text/babel" src="real-auth.jsx"></script>
//
// Then set these once at the top of index.html, in a regular <script>:
//   window.SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
//   window.SUPABASE_ANON_KEY = 'eyJ...';   // anon key ONLY, never service role

const supa = window.supabase?.createClient(
  window.SUPABASE_URL, window.SUPABASE_ANON_KEY
);

// ── Sign-in via magic link OR password ──
async function realSignIn({ email, password }) {
  if (!supa) throw new Error('Supabase not loaded');
  // Password sign-in (matches your seeded demo accounts)
  if (password) {
    const { data, error } = await supa.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }
  // Magic link
  const { error } = await supa.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  return null; // user clicks the email
}

// ── Sign-up + auto-create user row ──
async function realSignUp({ email, password, name, city, phone }) {
  if (!supa) throw new Error('Supabase not loaded');
  const { data, error } = await supa.auth.signUp({
    email, password,
    options: {
      data: { name, city, phone },     // goes into auth.users metadata
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;

  // Mirror into your public.users table so RLS-protected reads work
  if (data.user) {
    await supa.from('users').upsert({
      id: data.user.id, email, name, city, phone,
      tier: 'free',
    });
  }
  return data.user;
}

// ── SSO ──
async function realSignInWithProvider(provider /* 'google' | 'apple' */) {
  const { error } = await supa.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

// ── Current session helper ──
async function getCurrentUser() {
  if (!supa) return null;
  const { data } = await supa.auth.getUser();
  return data?.user || null;
}

// ── Sign out ──
async function realSignOut() {
  await supa?.auth.signOut();
}

// ── Plan generator → hits your /api/plan ──
async function realGeneratePlan(userPrompt) {
  const { data: { session } } = await supa.auth.getSession();
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ userPrompt }),
  });
  if (!res.ok) throw new Error('plan failed: ' + res.status);
  return res.json();
}

// ── Sparkle chat → hits your /api/chat with streaming ──
async function realChat(history, onChunk) {
  const { data: { session } } = await supa.auth.getSession();
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ history }),
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value);
    onChunk(full);
  }
  return full;
}

// ── Check-in writer ──
async function realCheckIn({ stop_id, photo_url, caption, posted_to }) {
  const { data: { session } } = await supa.auth.getSession();
  const res = await fetch('/api/checkin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ stop_id, photo_url, caption, posted_to }),
  });
  return res.json();
}

Object.assign(window, {
  supa, realSignIn, realSignUp, realSignInWithProvider,
  getCurrentUser, realSignOut, realGeneratePlan, realChat, realCheckIn,
});
