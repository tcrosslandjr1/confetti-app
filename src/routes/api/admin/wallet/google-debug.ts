import { createFileRoute } from "@tanstack/react-router";
import { SignJWT, importPKCS8, decodeJwt, decodeProtectedHeader } from "jose";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const StopSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  type: z.string().min(1).max(60).optional().default(""),
  time: z.string().min(1).max(32).optional().default(""),
  area: z.string().max(120).optional(),
});

const PayloadSchema = z.object({
  loopId: z.string().min(1).max(64),
  passenger: z.string().min(1).max(80),
  from: z.string().min(1).max(80),
  to: z.string().min(1).max(80),
  date: z.string().min(1).max(40),
  gate: z.string().max(16).optional().default(""),
  boardingTime: z.string().max(16).optional().default(""),
  stops: z.array(StopSchema).min(1).max(12),
});

function normalizePrivateKey(raw: string): string {
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
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

function redact(value: string | undefined | null, keep = 4): string {
  if (!value) return "(unset)";
  if (value.length <= keep * 2) return "*".repeat(value.length);
  return `${value.slice(0, keep)}…${value.slice(-keep)} (len ${value.length})`;
}

export const Route = createFileRoute("/api/admin/wallet/google-debug")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requireAdmin(request);
        } catch (resp) {
          if (resp instanceof Response) return resp;
          throw resp;
        }

        const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
        const classId = process.env.GOOGLE_WALLET_CLASS_ID;
        const saEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
        const saKeyRaw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY;
        const origin = process.env.GOOGLE_WALLET_ORIGIN || new URL(request.url).origin;

        const envStatus = {
          GOOGLE_WALLET_ISSUER_ID: issuerId ? "set" : "missing",
          GOOGLE_WALLET_CLASS_ID: classId ? "set" : "missing",
          GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: saEmail ? "set" : "missing",
          GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY: saKeyRaw ? "set" : "missing",
          GOOGLE_WALLET_ORIGIN: origin,
          serviceAccountEmail: redact(saEmail, 6),
        };

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const parsed = PayloadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Invalid payload", issues: parsed.error.issues, envStatus },
            { status: 400 }
          );
        }
        const data = parsed.data;

        const objectSuffix = `${data.loopId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
        const objectId = issuerId ? `${issuerId}.${objectSuffix}` : `<issuerId>.${objectSuffix}`;
        const itinerary = data.stops
          .map((s, i) => `${i + 1}. ${s.time ? s.time + " — " : ""}${s.name}${s.area ? ` (${s.area})` : ""}`)
          .join("\n");

        const barcode = {
          type: "QR_CODE" as const,
          value: `${origin}/active-confetti?loop=${encodeURIComponent(data.loopId)}`,
          alternateText: data.loopId,
        };

        const genericObject = {
          id: objectId,
          classId: classId ?? "<GOOGLE_WALLET_CLASS_ID>",
          state: "ACTIVE",
          cardTitle: { defaultValue: { language: "en-US", value: "Confetti" } },
          subheader: { defaultValue: { language: "en-US", value: data.from } },
          header: { defaultValue: { language: "en-US", value: data.to } },
          textModulesData: [
            { id: "passenger", header: "Passenger", body: data.passenger },
            { id: "date", header: "Date", body: data.date },
            ...(data.gate ? [{ id: "gate", header: "Gate", body: data.gate }] : []),
            ...(data.boardingTime ? [{ id: "boarding", header: "Boarding", body: data.boardingTime }] : []),
            { id: "itinerary", header: "Itinerary", body: itinerary },
          ],
          barcode,
          hexBackgroundColor: "#FF5C4D",
        };

        const claims = {
          iss: saEmail ?? "<service-account-email>",
          aud: "google",
          typ: "savetowallet",
          iat: Math.floor(Date.now() / 1000),
          origins: [origin],
          payload: { genericObjects: [genericObject] },
        };

        // Validation checks
        const checks: { name: string; pass: boolean; detail?: string }[] = [];
        checks.push({
          name: "classId is set",
          pass: !!classId,
          detail: classId ? classId : "GOOGLE_WALLET_CLASS_ID env var missing",
        });
        checks.push({
          name: "classId starts with issuerId.",
          pass: !!(classId && issuerId && classId.startsWith(`${issuerId}.`)),
          detail: classId && issuerId
            ? `${classId}.startsWith("${issuerId}.") = ${classId.startsWith(`${issuerId}.`)}`
            : "issuerId or classId missing",
        });
        checks.push({
          name: "objectId starts with issuerId.",
          pass: !!(issuerId && objectId.startsWith(`${issuerId}.`)),
          detail: objectId,
        });
        checks.push({
          name: "objectId suffix is URL-safe",
          pass: /^[a-zA-Z0-9_-]+$/.test(objectSuffix),
          detail: `suffix="${objectSuffix}"`,
        });
        checks.push({
          name: "barcode.value is a valid URL",
          pass: (() => {
            try { new URL(barcode.value); return true; } catch { return false; }
          })(),
          detail: barcode.value,
        });
        checks.push({
          name: "barcode.type is QR_CODE",
          pass: barcode.type === "QR_CODE",
        });
        checks.push({
          name: "barcode.alternateText present",
          pass: !!barcode.alternateText,
          detail: barcode.alternateText,
        });
        checks.push({
          name: "origins[] non-empty",
          pass: claims.origins.length > 0,
          detail: claims.origins.join(", "),
        });

        // Try to sign if all secrets present
        let jwt: string | null = null;
        let saveUrl: string | null = null;
        let signError: string | null = null;
        let decodedHeader: unknown = null;
        let decodedClaims: unknown = null;

        if (issuerId && classId && saEmail && saKeyRaw) {
          try {
            const key = await importPKCS8(normalizePrivateKey(saKeyRaw), "RS256");
            jwt = await new SignJWT(claims)
              .setProtectedHeader({ alg: "RS256", typ: "JWT" })
              .sign(key);
            saveUrl = `https://pay.google.com/gp/v/save/${jwt}`;
            decodedHeader = decodeProtectedHeader(jwt);
            decodedClaims = decodeJwt(jwt);
          } catch (err) {
            signError = String(err);
          }
        }

        return Response.json({
          ok: checks.every((c) => c.pass) && !signError,
          envStatus,
          summary: {
            issuerId: issuerId ?? null,
            classId: classId ?? null,
            objectId,
            barcode,
            origin,
          },
          checks,
          claims,
          jwt,
          saveUrl,
          jwtLength: jwt?.length ?? null,
          decodedHeader,
          decodedClaims,
          signError,
        });
      },
    },
  },
});
