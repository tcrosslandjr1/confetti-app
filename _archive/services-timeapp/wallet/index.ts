/**
 * Wallet Pass Service — Apple Wallet + Google Wallet
 *
 * Generates "Boarding Pass" style passes for Confetti itineraries.
 * Each itinerary becomes a pass users can save to their phone's wallet.
 *
 * Apple Wallet: Requires Apple Developer account + pass signing certificate
 * Google Wallet: Requires Google Pay & Wallet Console access + service account
 *
 * Cost: Free (both platforms)
 *
 * Setup:
 *   Apple: Get pass certificate from developer.apple.com
 *          Add APPLE_PASS_TYPE_ID, APPLE_TEAM_ID, APPLE_PASS_CERT_PATH to .env
 *   Google: Create issuer at pay.google.com/business/console
 *          Add GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_KEY to .env
 *
 * DEV MODE: Generates mock pass JSON structure for preview without signing.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface ItineraryStop {
  name: string;
  time: string;          // "8:30 PM"
  address: string;
  type: "dinner" | "bar" | "club" | "lounge" | "event" | "activity";
  confirmationCode?: string;
}

export interface BoardingPassRequest {
  itineraryId: string;
  userId: string;
  title: string;           // "Saturday Night in DC"
  date: string;            // "2026-05-17"
  city: string;
  groupName?: string;      // "The Squad"
  stops: ItineraryStop[];
  heroImageUrl?: string;   // background image
  organizerName?: string;
}

export interface WalletPassResult {
  applePassUrl?: string;    // URL to .pkpass file
  googlePassUrl?: string;   // "Add to Google Wallet" link
  passJson: object;         // raw pass structure (for preview)
  expiresAt: string;        // when the pass auto-expires
}

// ─── Configuration ──────────────────────────────────────────────────

interface WalletConfig {
  apple?: {
    passTypeId: string;     // "pass.com.confetti.boardingpass"
    teamId: string;
    certPath: string;       // path to .p12 certificate
    certPassword?: string;
  };
  google?: {
    issuerId: string;
    serviceAccountKey: string; // JSON key content
  };
}

let config: WalletConfig | null = null;

export function configure(cfg: WalletConfig) {
  config = cfg;
}

function isAppleConfigured(): boolean {
  return !!(config?.apple?.passTypeId && config?.apple?.teamId && config?.apple?.certPath);
}

function isGoogleConfigured(): boolean {
  return !!(config?.google?.issuerId && config?.google?.serviceAccountKey);
}

// ─── Generate Boarding Pass ─────────────────────────────────────────

/**
 * Generate a Confetti Boarding Pass for an itinerary.
 * Returns links to add to Apple Wallet and/or Google Wallet.
 */
export async function generateBoardingPass(req: BoardingPassRequest): Promise<WalletPassResult> {
  const passJson = buildPassStructure(req);
  const expiresAt = new Date(req.date + "T06:00:00").toISOString(); // expires morning after

  let applePassUrl: string | undefined;
  let googlePassUrl: string | undefined;

  if (isAppleConfigured()) {
    applePassUrl = await generateApplePass(req, passJson);
  }

  if (isGoogleConfigured()) {
    googlePassUrl = await generateGooglePass(req, passJson);
  }

  // Dev mode — log the pass structure
  if (!isAppleConfigured() && !isGoogleConfigured()) {
    console.log(`[Wallet Mock] Generated boarding pass: "${req.title}"`);
    console.log(`  Stops: ${req.stops.map((s) => s.name).join(" → ")}`);
    console.log(`  Pass JSON preview available in result.passJson`);
  }

  return { applePassUrl, googlePassUrl, passJson, expiresAt };
}

// ─── Pass Structure ─────────────────────────────────────────────────

function buildPassStructure(req: BoardingPassRequest): object {
  return {
    formatVersion: 1,
    passTypeIdentifier: config?.apple?.passTypeId || "pass.com.confetti.boardingpass",
    serialNumber: `confetti-${req.itineraryId}`,
    teamIdentifier: config?.apple?.teamId || "XXXXXXXXXX",
    organizationName: "Confetti",
    description: req.title,
    logoText: "CONFETTI",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(26, 26, 26)",
    labelColor: "rgb(200, 200, 200)",

    boardingPass: {
      transitType: "PKTransitTypeGeneric",

      headerFields: [
        { key: "date", label: "DATE", value: formatDate(req.date) },
        { key: "city", label: "CITY", value: req.city.toUpperCase() },
      ],

      primaryFields: [
        { key: "title", label: "ITINERARY", value: req.title },
      ],

      secondaryFields: [
        { key: "group", label: "CREW", value: req.groupName || "Solo" },
        { key: "stops", label: "STOPS", value: `${req.stops.length} venues` },
      ],

      auxiliaryFields: req.stops.slice(0, 4).map((stop, i) => ({
        key: `stop${i + 1}`,
        label: stop.time,
        value: stop.name,
      })),

      backFields: [
        { key: "fullItinerary", label: "FULL ITINERARY", value: formatBackFields(req.stops) },
        { key: "organizer", label: "ORGANIZED BY", value: req.organizerName || "You" },
        { key: "poweredBy", label: "", value: "Powered by Confetti — your AI nightlife concierge" },
      ],
    },

    barcode: {
      format: "PKBarcodeFormatQR",
      message: `confetti://itinerary/${req.itineraryId}`,
      messageEncoding: "iso-8859-1",
    },

    // Relevance
    relevantDate: `${req.date}T${parseFirstTime(req.stops[0]?.time)}:00-04:00`,
    expirationDate: `${req.date}T06:00:00-04:00`, // expires at 6am next morning

    // Metadata
    userInfo: {
      itineraryId: req.itineraryId,
      userId: req.userId,
    },
  };
}

// ─── Apple Wallet ───────────────────────────────────────────────────

async function generateApplePass(_req: BoardingPassRequest, _passJson: object): Promise<string> {
  // In production:
  // 1. Create pass.json from passJson
  // 2. Add icon.png, logo.png, strip.png to pass bundle
  // 3. Create manifest.json (SHA1 hashes of all files)
  // 4. Sign manifest with Apple certificate → signature file
  // 5. ZIP everything into .pkpass
  // 6. Upload to CDN or serve from API
  //
  // Libraries: passkit-generator (npm) or node-passbook
  // npm install passkit-generator

  console.log("[Wallet] Apple pass generation requires passkit-generator + signing certificate");
  return `https://api.confetti.app/passes/apple/${_req.itineraryId}.pkpass`;
}

// ─── Google Wallet ──────────────────────────────────────────────────

async function generateGooglePass(req: BoardingPassRequest, _passJson: object): Promise<string> {
  // In production:
  // 1. Create a Generic Pass Class (one-time setup)
  // 2. Create a Generic Pass Object for this itinerary
  // 3. Generate JWT signed with service account
  // 4. Return "Add to Google Wallet" URL with JWT
  //
  // API: https://walletobjects.googleapis.com/walletobjects/v1/
  // npm install google-auth-library

  const objectId = `confetti_${req.itineraryId}`;
  console.log(`[Wallet] Google pass: ${objectId}`);

  // The "Add to Google Wallet" link format:
  return `https://pay.google.com/gp/v/save/${objectId}`;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatBackFields(stops: ItineraryStop[]): string {
  return stops
    .map((s, i) => `${i + 1}. ${s.time} — ${s.name}\n   ${s.address}${s.confirmationCode ? `\n   Code: ${s.confirmationCode}` : ""}`)
    .join("\n\n");
}

function parseFirstTime(time?: string): string {
  if (!time) return "19:00";
  // Parse "8:30 PM" → "20:30"
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "19:00";
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}
