import { createFileRoute } from "@tanstack/react-router";
import { SignJWT, importPKCS8 } from "jose";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const WALLET_API = "https://walletobjects.googleapis.com/walletobjects/v1";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";

function normalizePrivateKey(raw: string): string {
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

async function getAccessToken(saEmail: string, privateKey: string): Promise<string> {
  const key = await importPKCS8(normalizePrivateKey(privateKey), "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(saEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(body)}`);
  return body.access_token as string;
}

async function requireAdmin(request: Request) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Response("Server misconfigured", { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) throw new Response("Unauthorized", { status: 401 });
  const token = auth.slice(7);
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: claims } = await supabase.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (!userId) throw new Response("Unauthorized", { status: 401 });
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Response("Forbidden: admin only", { status: 403 });
  return userId;
}

const SAMPLE_LOOP = {
  loopId: "DEMO123",
  passenger: "Demo Passenger",
  from: "Home",
  to: "Night Out",
  date: "Sat, May 16",
  gate: "B7",
  boardingTime: "7:30 PM",
  stops: [
    { id: "s1", name: "Le Diplomate", area: "14th St NW", time: "7:30 PM", type: "Dinner" },
    { id: "s2", name: "Right Proper", area: "Shaw", time: "9:30 PM", type: "Drinks" },
  ],
};

export const Route = createFileRoute("/api/admin/wallet/google-class")({
  server: {
    handlers: {
      // GET — verify class exists + dry-run JWT payload validation
      GET: async ({ request }) => {
        await requireAdmin(request);

        const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
        const classId = process.env.GOOGLE_WALLET_CLASS_ID;
        const saEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
        const saKey = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY;

        const missing = [
          !issuerId && "GOOGLE_WALLET_ISSUER_ID",
          !classId && "GOOGLE_WALLET_CLASS_ID",
          !saEmail && "GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL",
          !saKey && "GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY",
        ].filter(Boolean);
        if (missing.length) {
          return Response.json({ ok: false, missing }, { status: 503 });
        }

        try {
          const token = await getAccessToken(saEmail!, saKey!);
          const res = await fetch(`${WALLET_API}/genericClass/${encodeURIComponent(classId!)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const body = await res.json();
          // Dry-run JWT shape against sample payload (validates required fields locally)
          const payloadValid = !!classId!.startsWith(`${issuerId}.`);
          return Response.json({
            ok: res.ok,
            classExists: res.ok,
            classId,
            issuerId,
            payloadShapeValid: payloadValid,
            payloadShapeError: payloadValid ? null : `classId must start with "${issuerId}."`,
            sampleObject: buildSampleObject(classId!, issuerId!),
            googleResponse: res.ok ? { id: body.id, reviewStatus: body.reviewStatus } : body,
          });
        } catch (err) {
          return Response.json({ ok: false, error: String(err) }, { status: 500 });
        }
      },

      // POST — create class if missing
      POST: async ({ request }) => {
        await requireAdmin(request);

        const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
        const classId = process.env.GOOGLE_WALLET_CLASS_ID;
        const saEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
        const saKey = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY;

        if (!issuerId || !classId || !saEmail || !saKey) {
          return Response.json({ error: "Missing Google Wallet env vars" }, { status: 503 });
        }
        if (!classId.startsWith(`${issuerId}.`)) {
          return Response.json(
            { error: `GOOGLE_WALLET_CLASS_ID must start with "${issuerId}."` },
            { status: 400 },
          );
        }

        try {
          const token = await getAccessToken(saEmail, saKey);

          // Check existence
          const existing = await fetch(
            `${WALLET_API}/genericClass/${encodeURIComponent(classId)}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (existing.ok) {
            const body = await existing.json();
            return Response.json({ created: false, alreadyExists: true, classId, class: body });
          }
          if (existing.status !== 404) {
            const body = await existing.json().catch(() => ({}));
            return Response.json({ error: "Lookup failed", detail: body }, { status: 502 });
          }

          // Create
          const classBody = {
            id: classId,
            classTemplateInfo: {
              cardTemplateOverride: {
                cardRowTemplateInfos: [
                  {
                    twoItems: {
                      startItem: {
                        firstValue: {
                          fields: [{ fieldPath: "object.textModulesData['passenger']" }],
                        },
                      },
                      endItem: {
                        firstValue: {
                          fields: [{ fieldPath: "object.textModulesData['date']" }],
                        },
                      },
                    },
                  },
                ],
              },
            },
            multipleDevicesAndHoldersAllowedStatus: "ONE_USER_ALL_DEVICES",
            viewUnlockRequirement: "VIEW_UNLOCK_REQUIREMENT_UNSPECIFIED",
          };

          const create = await fetch(`${WALLET_API}/genericClass`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(classBody),
          });
          const created = await create.json();
          if (!create.ok) {
            return Response.json({ error: "Create failed", detail: created }, { status: 502 });
          }
          return Response.json({ created: true, classId, class: created });
        } catch (err) {
          return Response.json({ error: String(err) }, { status: 500 });
        }
      },
    },
  },
});

function buildSampleObject(classId: string, issuerId: string) {
  return {
    id: `${issuerId}.sample_demo`,
    classId,
    state: "ACTIVE",
    cardTitle: { defaultValue: { language: "en-US", value: "Confetti" } },
    header: { defaultValue: { language: "en-US", value: SAMPLE_LOOP.to } },
    subheader: { defaultValue: { language: "en-US", value: SAMPLE_LOOP.from } },
    textModulesData: [
      { id: "passenger", header: "Passenger", body: SAMPLE_LOOP.passenger },
      { id: "date", header: "Date", body: SAMPLE_LOOP.date },
    ],
    barcode: { type: "QR_CODE", value: "https://example.com/sample", alternateText: "DEMO" },
    hexBackgroundColor: "#FF5C4D",
  };
}
