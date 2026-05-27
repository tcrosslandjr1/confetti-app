const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageBreak, TabStopPosition, TabStopType, Header, Footer,
  NumberFormat, convertInchesToTwip
} = require("docx");

// --- Color palette ---
const CREAM   = "FFF8F0";
const CORAL    = "FF6B6B";
const DARK     = "1A1A2E";
const GOLD     = "F4A261";
const TEAL     = "2EC4B6";
const LGRAY    = "F5F5F5";
const WHITE    = "FFFFFF";
const RED_BG   = "FFEBEE";
const ORG_BG   = "FFF3E0";
const YEL_BG   = "FFFDE7";
const GRN_BG   = "E8F5E9";

// --- Helpers ---
function heading(text, level) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22, color: DARK })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.afterSpacing || 120 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({ text, font: "Calibri", size: opts.size || 20, bold: !!opts.bold, italics: !!opts.italic, color: opts.color || "333333" })],
  });
}

function multiRunPara(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.afterSpacing || 120 },
    alignment: opts.align || AlignmentType.LEFT,
    children: runs.map(r => new TextRun({ font: "Calibri", size: r.size || 20, bold: !!r.bold, italics: !!r.italic, color: r.color || "333333", text: r.text })),
  });
}

const BORDER_THIN = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const CELL_BORDERS = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    borders: CELL_BORDERS,
    shading: opts.bg ? { type: ShadingType.CLEAR, fill: opts.bg } : undefined,
    verticalAlign: "center",
    children: [new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, font: "Calibri", size: opts.size || 18, bold: !!opts.bold, color: opts.color || "333333" })],
    })],
  });
}

// --- Bug data ---
const bugs = [
  // CRITICAL
  { id: "C-01", severity: "CRITICAL", area: "Build A Night", page: "Itinerary Result", issue: "LOCK IT IN button redirects to homepage instead of showing the finalized itinerary. The core conversion action is completely broken.", url: "/build-a-night (final step)" },
  { id: "C-02", severity: "CRITICAL", area: "Integrations", page: "Google Places API", issue: "Google Places API key is invalid (INVALID_ARGUMENT error). Breaks venue lookup, photos, addresses, and map links across the entire wizard and venue pages.", url: "/admin/integrations" },

  // HIGH
  { id: "H-01", severity: "HIGH", area: "Navigation", page: "Header Nav", issue: "Nav links route to wrong destinations: HOW links to /guides, ABOUT links to /teams, FOR BUSINESS links to /about, CONTACT links to /advertise. Users cannot find intended content.", url: "Global header" },
  { id: "H-02", severity: "HIGH", area: "Navigation", page: "Header Nav", issue: "PORTAL and ADMIN nav items both route to /admin. Duplicate entry with no distinction.", url: "Global header" },
  { id: "H-03", severity: "HIGH", area: "Auth", page: "Sign Up CTA", issue: "\"SIGN UP FREE\" button routes to sign-in mode (/auth?mode=signin) instead of sign-up mode. New user acquisition funnel is broken.", url: "Landing page hero" },
  { id: "H-04", severity: "HIGH", area: "Auth", page: "Password Reset", issue: "\"Back to sign in\" link on the reset password page routes to SIGN UP mode instead of sign-in. Missing mode=signin parameter.", url: "/auth (reset password)" },
  { id: "H-05", severity: "HIGH", area: "Admin", page: "Users", issue: "Shows 0 users with \"Server functions are not available in SPA mode\" warning. Cannot manage any user accounts.", url: "/admin/users" },
  { id: "H-06", severity: "HIGH", area: "Admin", page: "Admin Roles", issue: "Shows 0 admins with SPA mode warning. Cannot assign or manage admin roles.", url: "/admin/roles" },
  { id: "H-07", severity: "HIGH", area: "Admin", page: "Venue Claims", issue: "Stuck on \"Loading claims...\" spinner indefinitely. Business owners cannot claim venues.", url: "/admin/business-claims" },
  { id: "H-08", severity: "HIGH", area: "Admin", page: "Weekly Outreach", issue: "Displays \"Server functions are not available in SPA mode\" toast. No outreach data loads.", url: "/admin/outreach" },
  { id: "H-09", severity: "HIGH", area: "Admin", page: "Moderation", issue: "Stuck on \"Loading events...\" indefinitely. Content moderation is non-functional.", url: "/admin/moderation" },
  { id: "H-10", severity: "HIGH", area: "Admin", page: "Pick Analytics", issue: "All metric cards show \"--\", chart stuck on \"Loading...\". No analytics data available.", url: "/admin/pick-analytics" },

  // MEDIUM
  { id: "M-01", severity: "MEDIUM", area: "Routing", page: "Multiple", issue: "Direct URL access to SPA routes returns raw browser \"Not Found\" 404. Affects: /contact, /how, /how-it-works, /auth, /login, /signin, /admin/login. No SPA fallback configured on hosting.", url: "Multiple routes" },
  { id: "M-02", severity: "MEDIUM", area: "Routing", page: "404 Page", issue: "No custom 404 error page. Users see raw browser error with no navigation back to the app.", url: "Any invalid route" },
  { id: "M-03", severity: "MEDIUM", area: "Admin", page: "PIN Security", issue: "PIN setup dialog says \"4-8 digit PIN\" but the unlock screen shows \"SIX-DIGIT CODE\" with exactly 6 input dots and auto-submit. Validation mismatch could lock admins out.", url: "/admin/login" },
  { id: "M-04", severity: "MEDIUM", area: "Admin", page: "Notifications", issue: "All RECIPIENT fields show \"--\" across all 4 notification entries. Recipient resolution is completely broken.", url: "/admin/notifications" },
  { id: "M-05", severity: "MEDIUM", area: "Admin", page: "Wallet JWT Debug", issue: "JWT debug panel still references \"loopId\" field. App was rebranded from \"Loop\" to \"Confetti\" on 2026-05-11. Outdated branding in admin tooling.", url: "/admin/wallet-jwt" },

  // LOW
  { id: "L-01", severity: "LOW", area: "Build A Night", page: "Venue Card", issue: "Budget filter set to $ (Comfortable) but venue card for Service Bar DC displays $ price level. Filter-to-result mismatch.", url: "/build-a-night results" },
  { id: "L-02", severity: "LOW", area: "Build A Night", page: "Venue Card", issue: "Le Diplomate shows \"OPEN UNTIL 12:00 PM\" which implies noon. Should display 12:00 AM for midnight.", url: "/build-a-night results" },
  { id: "L-03", severity: "LOW", area: "Performance", page: "Landing Page", issue: "Approximately 3-second blank cream screen on initial app load before content renders. No loading indicator or skeleton.", url: "/" },
];

// Severity colors
function sevBg(sev) {
  if (sev === "CRITICAL") return RED_BG;
  if (sev === "HIGH") return ORG_BG;
  if (sev === "MEDIUM") return YEL_BG;
  return GRN_BG;
}
function sevColor(sev) {
  if (sev === "CRITICAL") return "C62828";
  if (sev === "HIGH") return "E65100";
  if (sev === "MEDIUM") return "F57F17";
  return "2E7D32";
}

// --- Count by severity ---
const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
bugs.forEach(b => counts[b.severity]++);
const total = bugs.length;

// --- Build sections ---
const children = [];

// Title page
children.push(new Paragraph({ spacing: { before: 2400 }, children: [] }));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 80 },
  children: [new TextRun({ text: "CONFETTI", font: "Calibri", size: 56, bold: true, color: CORAL })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [new TextRun({ text: "AI Lifestyle Concierge", font: "Calibri", size: 28, color: "666666", italics: true })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 80 },
  children: [new TextRun({ text: "Comprehensive QA Audit Report", font: "Calibri", size: 40, bold: true, color: DARK })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 },
  children: [new TextRun({ text: "confettiplan.lovable.app", font: "Calibri", size: 22, color: "888888" })],
}));

// Metadata
children.push(para("Date: May 23, 2026", { align: AlignmentType.CENTER, color: "666666", italic: true }));
children.push(para("Auditor: Senior Product Engineering Review", { align: AlignmentType.CENTER, color: "666666", italic: true }));
children.push(para("Scope: Full-stack application audit - Landing, Auth, Build A Night, Admin Panel", { align: AlignmentType.CENTER, color: "666666", italic: true }));
children.push(para("Classification: Internal - Confidential", { align: AlignmentType.CENTER, color: "999999", italic: true, afterSpacing: 200 }));

// Page break
children.push(new Paragraph({ children: [new PageBreak()] }));

// Executive Summary
children.push(heading("1. Executive Summary", HeadingLevel.HEADING_1));
children.push(para(`This report presents the findings of a comprehensive quality assurance audit conducted on the Confetti application (confettiplan.lovable.app) on May 23, 2026. The audit evaluated the application from the perspective of a senior product engineering leader, covering the full user journey from landing page through authentication, the core "Build A Night" wizard, and the complete admin panel (26+ pages).`));
children.push(para(`A total of ${total} distinct issues were identified across 4 severity levels. Two issues are classified as CRITICAL and require immediate remediation before any public launch activity. The application demonstrates strong design foundations and creative UX concepts (boarding pass metaphor, vibe-based discovery), but several systemic issues - particularly around SPA hosting configuration, API key management, and navigation routing - must be resolved to deliver a production-ready experience.`));

// Summary stats table
const COL1 = 3000;
const COL2 = 2000;
const COL3 = 5000;
children.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: "Issue Distribution", font: "Calibri", size: 22, bold: true, color: DARK })] }));
children.push(new Table({
  columnWidths: [COL1, COL2, COL3],
  rows: [
    new TableRow({ children: [
      cell("Severity", { width: COL1, bold: true, bg: DARK, color: WHITE }),
      cell("Count", { width: COL2, bold: true, bg: DARK, color: WHITE }),
      cell("Impact", { width: COL3, bold: true, bg: DARK, color: WHITE }),
    ]}),
    new TableRow({ children: [
      cell("CRITICAL", { width: COL1, bold: true, color: "C62828", bg: RED_BG }),
      cell(String(counts.CRITICAL), { width: COL2, bg: RED_BG }),
      cell("Core functionality broken; blocks launch", { width: COL3, bg: RED_BG }),
    ]}),
    new TableRow({ children: [
      cell("HIGH", { width: COL1, bold: true, color: "E65100", bg: ORG_BG }),
      cell(String(counts.HIGH), { width: COL2, bg: ORG_BG }),
      cell("Major feature degraded; poor user experience", { width: COL3, bg: ORG_BG }),
    ]}),
    new TableRow({ children: [
      cell("MEDIUM", { width: COL1, bold: true, color: "F57F17", bg: YEL_BG }),
      cell(String(counts.MEDIUM), { width: COL2, bg: YEL_BG }),
      cell("Functional gaps; confusing or inconsistent behavior", { width: COL3, bg: YEL_BG }),
    ]}),
    new TableRow({ children: [
      cell("LOW", { width: COL1, bold: true, color: "2E7D32", bg: GRN_BG }),
      cell(String(counts.LOW), { width: COL2, bg: GRN_BG }),
      cell("Minor polish; cosmetic or edge-case issues", { width: COL3, bg: GRN_BG }),
    ]}),
    new TableRow({ children: [
      cell("TOTAL", { width: COL1, bold: true, bg: LGRAY }),
      cell(String(total), { width: COL2, bold: true, bg: LGRAY }),
      cell("", { width: COL3, bg: LGRAY }),
    ]}),
  ],
}));

// Page break
children.push(new Paragraph({ children: [new PageBreak()] }));

// Detailed Findings
children.push(heading("2. Detailed Findings", HeadingLevel.HEADING_1));

const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const severityLabels = { CRITICAL: "2.1 Critical Issues", HIGH: "2.2 High-Priority Issues", MEDIUM: "2.3 Medium-Priority Issues", LOW: "2.4 Low-Priority Issues" };
const severityDescs = {
  CRITICAL: "These issues break core functionality and must be fixed before any public launch or marketing activity.",
  HIGH: "These issues significantly degrade the user or admin experience and should be resolved in the next sprint.",
  MEDIUM: "These issues cause confusion or inconsistency but have workarounds. Schedule for near-term resolution.",
  LOW: "Minor polish items. Address as time permits or bundle with related work.",
};

const BW = [1200, 1600, 1800, 5400];

severityOrder.forEach(sev => {
  const sevBugs = bugs.filter(b => b.severity === sev);
  if (sevBugs.length === 0) return;

  children.push(heading(severityLabels[sev], HeadingLevel.HEADING_2));
  children.push(para(severityDescs[sev], { italic: true, color: "666666" }));

  // Table header
  children.push(new Table({
    columnWidths: BW,
    rows: [
      new TableRow({ children: [
        cell("ID", { width: BW[0], bold: true, bg: DARK, color: WHITE }),
        cell("Area", { width: BW[1], bold: true, bg: DARK, color: WHITE }),
        cell("Page", { width: BW[2], bold: true, bg: DARK, color: WHITE }),
        cell("Issue Description", { width: BW[3], bold: true, bg: DARK, color: WHITE }),
      ]}),
      ...sevBugs.map(b => new TableRow({ children: [
        cell(b.id, { width: BW[0], bold: true, color: sevColor(sev), bg: sevBg(sev) }),
        cell(b.area, { width: BW[1], bg: sevBg(sev) }),
        cell(b.page, { width: BW[2], bg: sevBg(sev) }),
        cell(b.issue, { width: BW[3], bg: sevBg(sev) }),
      ]})),
    ],
  }));

  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
});

// Page break
children.push(new Paragraph({ children: [new PageBreak()] }));

// Section 3 - Areas Tested
children.push(heading("3. Scope of Testing", HeadingLevel.HEADING_1));

children.push(heading("3.1 Landing Page & Navigation", HeadingLevel.HEADING_2));
children.push(para("Tested all header navigation links, hero CTA buttons, footer links, and page routing. Verified the boarding pass visual metaphor renders correctly. Checked responsive behavior and initial load performance."));

children.push(heading("3.2 Authentication Flows", HeadingLevel.HEADING_2));
children.push(para("Tested email/password sign-in and sign-up flows, Google SSO, Apple SSO options, password reset flow, and the \"Back to sign in\" navigation. Verified auth state persistence and redirect behavior post-login."));

children.push(heading("3.3 Build A Night Wizard", HeadingLevel.HEADING_2));
children.push(para("Walked through the complete 6-step wizard: Vibe selection, Group Size, When (date/time), Budget, Must-haves, and Dietary preferences. Tested the final itinerary generation and the LOCK IT IN conversion action. Verified venue card data accuracy including hours, pricing, and photos."));

children.push(heading("3.4 Admin Panel (26+ Pages)", HeadingLevel.HEADING_2));
children.push(para("Systematically tested every sidebar item in the admin panel across all sections:"));

const adminSections = [
  ["PEOPLE", "Users, Admin Roles"],
  ["MARKETPLACE", "Venues, Venue Claims, Bookings"],
  ["GROWTH", "Advertisers, Sponsored Marquee, Weekly Outreach, Testimonials, Notifications"],
  ["TRUST & SAFETY", "Moderation"],
  ["ANALYTICS", "Analytics Dashboard, Event Analytics, Ad Analytics, Pick Analytics"],
  ["SYSTEM", "Integrations, Settings, Audit Log, System Logs, Wallet JWT Debug, Launch Checklist, Deploy Preflight, Routes Map, Agent Control Center"],
];

const AW = [2500, 7500];
children.push(new Table({
  columnWidths: AW,
  rows: [
    new TableRow({ children: [
      cell("Section", { width: AW[0], bold: true, bg: DARK, color: WHITE }),
      cell("Pages Tested", { width: AW[1], bold: true, bg: DARK, color: WHITE }),
    ]}),
    ...adminSections.map((s, i) => new TableRow({ children: [
      cell(s[0], { width: AW[0], bold: true, bg: i % 2 === 0 ? LGRAY : WHITE }),
      cell(s[1], { width: AW[1], bg: i % 2 === 0 ? LGRAY : WHITE }),
    ]})),
  ],
}));

// Page break
children.push(new Paragraph({ children: [new PageBreak()] }));

// Section 4 - Systemic Patterns
children.push(heading("4. Systemic Patterns & Root Causes", HeadingLevel.HEADING_1));

children.push(heading("4.1 SPA Hosting Misconfiguration", HeadingLevel.HEADING_2));
children.push(para("The most pervasive issue is that the Lovable hosting environment does not serve the SPA index.html for all routes. Direct URL access to any route (e.g., pasting /admin/login into the address bar or refreshing a deep page) returns a raw 404 from the web server instead of loading the React app and letting the client-side router handle it. This also means that 6 admin pages that require server-side data fetching show \"Server functions are not available in SPA mode\" errors. Recommendation: Configure a server-side catch-all route or move to a hosting platform that supports SPA fallback and edge functions."));

children.push(heading("4.2 Invalid Google Places API Key", HeadingLevel.HEADING_2));
children.push(para("The Google Places API key configured in the Integrations panel returns INVALID_ARGUMENT. This is a single point of failure that cascades across the entire app: venue photos don't load, addresses can't be verified, map links are broken, and the Build A Night wizard cannot source real venue data. Recommendation: Generate a new API key with Places API (New) enabled, restrict it to the app's domain, and add billing to the Google Cloud project."));

children.push(heading("4.3 Navigation Route Mapping Errors", HeadingLevel.HEADING_2));
children.push(para("Multiple header nav items point to incorrect routes (HOW to /guides, ABOUT to /teams, FOR BUSINESS to /about, CONTACT to /advertise). This suggests routes were renamed or reorganized without updating the navigation component. Recommendation: Audit the nav component against the Routes Map admin page (which lists 93 routes) and correct all href values."));

children.push(heading("4.4 Auth Flow Direction Errors", HeadingLevel.HEADING_2));
children.push(para("Both the primary CTA (\"SIGN UP FREE\") and the password reset \"Back to sign in\" link have incorrect mode parameters, sending users to the wrong auth state. These are high-impact because they directly affect new user acquisition and account recovery. Recommendation: Fix the mode query parameters: signup CTA should use mode=signup, back-to-signin should use mode=signin."));

// Page break
children.push(new Paragraph({ children: [new PageBreak()] }));

// Section 5 - What's Working Well
children.push(heading("5. Strengths & What's Working Well", HeadingLevel.HEADING_1));
children.push(para("The audit is not solely focused on issues. Several aspects of the application demonstrate strong product thinking and execution:"));

const strengths = [
  ["Boarding Pass UX Metaphor", "The itinerary-as-boarding-pass concept is distinctive, memorable, and delightful. It sets Confetti apart from generic recommendation apps."],
  ["Build A Night Wizard Flow", "The 6-step wizard (Vibe, Group, When, Budget, Must-haves, Dietary) is well-structured and intuitive. Step transitions are smooth with clear progress indication."],
  ["Admin Panel Architecture", "The admin panel is impressively comprehensive with 26+ pages covering every operational need. The Agent Control Center with 22 AI agents across 6 teams shows sophisticated AI orchestration architecture."],
  ["Visual Design", "The cream-and-coral color palette is cohesive and warm. Typography is clean and readable. The overall aesthetic is premium without being intimidating."],
  ["Deploy Preflight System", "The built-in deployment checklist with GitHub repo validation is a thoughtful operational safeguard."],
  ["Routes Map", "The admin Routes Map tracking 93 routes across 14 purpose buckets demonstrates strong architectural awareness and is an excellent debugging tool."],
];

const SW = [3000, 7000];
children.push(new Table({
  columnWidths: SW,
  rows: [
    new TableRow({ children: [
      cell("Strength", { width: SW[0], bold: true, bg: DARK, color: WHITE }),
      cell("Details", { width: SW[1], bold: true, bg: DARK, color: WHITE }),
    ]}),
    ...strengths.map((s, i) => new TableRow({ children: [
      cell(s[0], { width: SW[0], bold: true, bg: i % 2 === 0 ? LGRAY : WHITE }),
      cell(s[1], { width: SW[1], bg: i % 2 === 0 ? LGRAY : WHITE }),
    ]})),
  ],
}));

// Page break
children.push(new Paragraph({ children: [new PageBreak()] }));

// Section 6 - Recommendations
children.push(heading("6. Prioritized Recommendations", HeadingLevel.HEADING_1));

children.push(heading("6.1 Immediate (Before Launch)", HeadingLevel.HEADING_2));
children.push(para("1. Fix the LOCK IT IN button to display the finalized itinerary instead of redirecting to the homepage. This is the core conversion action.", { bold: false }));
children.push(para("2. Replace the invalid Google Places API key with a properly configured, billing-enabled key restricted to the app domain.", { bold: false }));
children.push(para("3. Configure SPA fallback routing on the hosting platform so direct URL access and page refreshes work correctly.", { bold: false }));
children.push(para("4. Fix the SIGN UP FREE CTA to route to signup mode (mode=signup).", { bold: false }));

children.push(heading("6.2 Next Sprint", HeadingLevel.HEADING_2));
children.push(para("5. Correct all header navigation route mappings (HOW, ABOUT, FOR BUSINESS, CONTACT).", { bold: false }));
children.push(para("6. Fix the password reset \"Back to sign in\" link to use mode=signin.", { bold: false }));
children.push(para("7. Resolve the SPA mode limitation for admin pages requiring server-side functions (Users, Roles, Claims, Outreach, Moderation, Pick Analytics). Consider migrating to a framework with SSR/edge function support.", { bold: false }));
children.push(para("8. Fix notification recipient resolution so admin can see who receives each notification.", { bold: false }));

children.push(heading("6.3 Near-Term Polish", HeadingLevel.HEADING_2));
children.push(para("9. Build a custom 404 page with navigation back to the app.", { bold: false }));
children.push(para("10. Resolve the PIN setup/unlock digit count mismatch (standardize on 6 digits).", { bold: false }));
children.push(para("11. Update the Wallet JWT debug panel to replace \"loopId\" with \"confettiId\" or equivalent.", { bold: false }));
children.push(para("12. Fix the midnight display bug (12:00 PM should be 12:00 AM) and budget filter consistency on venue cards.", { bold: false }));
children.push(para("13. Add a loading skeleton or spinner to eliminate the 3-second blank cream screen on initial load.", { bold: false }));

// Footer
children.push(new Paragraph({ spacing: { before: 600 }, children: [] }));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 200 },
  children: [new TextRun({ text: "--- End of Report ---", font: "Calibri", size: 20, color: "999999", italics: true })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 80 },
  children: [new TextRun({ text: `${total} issues documented across ${bugs.filter(b=>b.severity==="CRITICAL").length} critical, ${bugs.filter(b=>b.severity==="HIGH").length} high, ${bugs.filter(b=>b.severity==="MEDIUM").length} medium, and ${bugs.filter(b=>b.severity==="LOW").length} low severity findings.`, font: "Calibri", size: 18, color: "999999" })],
}));

// --- Build document ---
const doc = new Document({
  creator: "Confetti QA Audit",
  title: "Confetti App - Comprehensive QA Audit Report",
  description: "Full-stack QA audit of confettiplan.lovable.app",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 20 } },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, bottom: 1080, left: 1200, right: 1200 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "CONFETTI QA AUDIT  |  May 23, 2026  |  CONFIDENTIAL", font: "Calibri", size: 14, color: "BBBBBB", italics: true })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Confetti - AI Lifestyle Concierge  |  confettiplan.lovable.app", font: "Calibri", size: 14, color: "BBBBBB" })],
        })],
      }),
    },
    children,
  }],
});

// --- Write to file ---
Packer.toBuffer(doc).then(buffer => {
  const outPath = "/sessions/quirky-beautiful-bell/mnt/ai-lifestyle-concierge/Confetti-QA-Audit-Report-2026-05-23.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("Report saved to: " + outPath);
  console.log("File size: " + (buffer.length / 1024).toFixed(1) + " KB");
}).catch(err => {
  console.error("Error generating report:", err);
  process.exit(1);
});
