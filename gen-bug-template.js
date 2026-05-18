const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, HeadingLevel,
  BorderStyle, WidthType, ShadingType,
} = require("docx");
const fs = require("fs");

const CELL_BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const CELL_BORDERS = { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER };

function hCell(text, w = 2700, fill = "F5EBE0") {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: w, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 22 })] })],
  });
}

function vCell(text, w = 6660) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: w, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 22 })] })],
  });
}

function row(label, value = "") {
  return new TableRow({ children: [hCell(label), vCell(value)] });
}

function spacer() {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

const fields = [
  "Bug ID",
  "Reported By",
  "Date",
  "Environment (staging / prod / preview)",
  "Device / OS / Browser",
  "App Version / Commit",
  "Severity (P0 Critical / P1 High / P2 Medium / P3 Low)",
  "Area (Onboarding / Vibe / Category / City / Itinerary / Name / Booking / Order-Ahead / Group / Weather / Safety / Time / Swap / Save / Share / Recap / Personalization / Multi-Day / Promo / Orchestration)",
  "Test ID (if from Test Plan)",
  "Summary (one sentence)",
  "Description (what happened)",
  "Steps to Reproduce (numbered)",
  "Expected Result",
  "Actual Result",
  "Screenshots / Video / Logs",
  "Repro Rate (always / often / sometimes / rare / once)",
  "Workaround (if any)",
  "Related Issues / PRs",
  "Assignee",
  "Status (Open / In Review / In Progress / Fixed / Verified / Closed)",
  "Notes",
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "C44569" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      headers: {
        default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "Confetti QA — Bug Report Template", size: 18, color: "888888" })] })] }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Page ", size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 })],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
          children: [new TextRun({ text: "Confetti Bug Report Template", bold: true, size: 48 })],
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [
            new TextRun({ text: "Copy one table per bug. Fill every field. Attach screenshots + console logs. Link to Test ID when applicable.", size: 22 }),
          ],
        }),
        ...fields.flatMap((f) => [new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [2700, 6660], rows: [row(f)] }), spacer()]),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/mnt/documents/confetti-bug-report-template.docx", buf);
  console.log("Wrote /mnt/documents/confetti-bug-report-template.docx");
});
