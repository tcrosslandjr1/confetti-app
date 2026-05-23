import { createFileRoute } from "@tanstack/react-router";
import { SignJWT, importPKCS8 } from "jose";
import { z } from "zod";

const StopSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  type: z.string().min(1).max(60).optional().default(""),
  time: z.string().min(1).max(32).optional().default(""),
  area: z.string().max(120).optional(),
});

const PayloadSchema = z.object({
  planId: z.string().min(1).max(64),
  passenger: z.string().min(1).max(80),
  from: z.string().min(1).max(80),
  to: z.string().min(1).max(80),
  date: z.string().min(1).max(40),
  gate: z.string().max(16).optional().default(""),
  boardingTime: z.string().max(16).optional().default(""),
  stops: z.array(StopSchema).min(1).max(12),
});

function normalizePrivateKey(raw: string): string {
  // Service account JSON often stores the key with literal \n sequences.
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

export const Route = createFileRoute("/api/public/wallet/google")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
        const classId = process.env.GOOGLE_WALLET_CLASS_ID;
        const saEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
        const saKeyRaw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY;
        const origin = process.env.GOOGLE_WALLET_ORIGIN || new URL(request.url).origin;

        if (!issuerId || !classId || !saEmail || !saKeyRaw) {
          return Response.json(
            {
              error:
                "Google Wallet not configured. Missing GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_CLASS_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL, or GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY.",
            },
            { status: 503 },
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const parsed = PayloadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Invalid payload", issues: parsed.error.issues },
            { status: 400 },
          );
        }

        const data = parsed.data;
        const objectSuffix = `${data.planId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
        const objectId = `${issuerId}.${objectSuffix}`;

        const itinerary = data.stops
          .map(
            (s, i) =>
              `${i + 1}. ${s.time ? s.time + " — " : ""}${s.name}${s.area ? ` (${s.area})` : ""}`,
          )
          .join("\n");

        const genericObject = {
          id: objectId,
          classId,
          state: "ACTIVE",
          logo: undefined,
          cardTitle: { defaultValue: { language: "en-US", value: "Confetti" } },
          subheader: { defaultValue: { language: "en-US", value: data.from } },
          header: { defaultValue: { language: "en-US", value: data.to } },
          textModulesData: [
            { id: "passenger", header: "Passenger", body: data.passenger },
            { id: "date", header: "Date", body: data.date },
            ...(data.gate ? [{ id: "gate", header: "Gate", body: data.gate }] : []),
            ...(data.boardingTime
              ? [{ id: "boarding", header: "Boarding", body: data.boardingTime }]
              : []),
            { id: "itinerary", header: "Itinerary", body: itinerary },
          ],
          barcode: {
            type: "QR_CODE",
            value: `${origin}/active-confetti?plan=${encodeURIComponent(data.planId)}`,
            alternateText: data.planId,
          },
          hexBackgroundColor: "#FF5C4D",
        };

        const claims = {
          iss: saEmail,
          aud: "google",
          typ: "savetowallet",
          iat: Math.floor(Date.now() / 1000),
          origins: [origin],
          payload: { genericObjects: [genericObject] },
        };

        try {
          const pkcs8 = normalizePrivateKey(saKeyRaw);
          const key = await importPKCS8(pkcs8, "RS256");
          const jwt = await new SignJWT(claims)
            .setProtectedHeader({ alg: "RS256", typ: "JWT" })
            .sign(key);

          return Response.json({
            jwt,
            saveUrl: `https://pay.google.com/gp/v/save/${jwt}`,
            objectId,
          });
        } catch (err) {
          console.error("Google Wallet JWT signing failed:", err);
          return Response.json(
            { error: "Failed to sign Google Wallet JWT", detail: String(err) },
            { status: 500 },
          );
        }
      },
    },
  },
});
