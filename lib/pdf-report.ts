import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type CategoryItem = {
  category: string;
  amount: number;
};

type TrendItem = {
  month: string;
  expenses: number;
  netSavings: number;
  savingsRate: number;
};

type ComparisonData = {
  expenseDiff?: number;
  expenseDiffPercent?: number;
  incomeText?: string;
  savingsDiff?: number;
  savingsDiffPercent?: number;
};

type InsightsData = {
  score: number;
  scoreLabel?: string;
  analysis?: string | string[];
  recommendations: string[];
  summary: string;
};

type ReportData = {
  income: number;
  expenses: number;
  netSavings: number;
  savingsRate: number;
  categoryTotals: CategoryItem[];
  trend: TrendItem[];
  comparison?: ComparisonData;
};

export type MonthlyPdfInput = {
  userName: string;
  year: number;
  month: number;
  report: ReportData;
  insights: InsightsData;
};

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("nb-NO").format(Math.round(value))} kr`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")} %`;
}

function getMonthName(month: number) {
  const months = [
    "Januar",
    "Februar",
    "Mars",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return months[month - 1] ?? `Måned ${month}`;
}

function normalizeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value == null) return "";
  return String(value);
}

function splitParagraphs(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function wrapText(
  text: string,
  maxWidth: number,
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  fontSize: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const next = `${currentLine} ${words[i]}`;
    const width = font.widthOfTextAtSize(next, fontSize);

    if (width <= maxWidth) {
      currentLine = next;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }

  lines.push(currentLine);
  return lines;
}

function truncateLabel(label: string, maxLength = 14) {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}…`;
}

export async function buildMonthlyReportPdf(
  input: MonthlyPdfInput
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const addPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const ensureSpace = (neededHeight: number) => {
    if (y - neededHeight < MARGIN) {
      addPage();
    }
  };

  const drawTextLine = (
    text: string,
    options?: {
      x?: number;
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
    }
  ) => {
    const x = options?.x ?? MARGIN;
    const size = options?.size ?? 12;
    const bold = options?.bold ?? false;
    const color = options?.color ?? rgb(0, 0, 0);

    ensureSpace(size + 10);

    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? fontBold : fontRegular,
      color,
    });

    y -= size + 6;
  };

  const drawWrappedText = (
    text: string,
    options?: {
      x?: number;
      size?: number;
      bold?: boolean;
      maxWidth?: number;
      lineGap?: number;
      color?: ReturnType<typeof rgb>;
    }
  ) => {
    const x = options?.x ?? MARGIN;
    const size = options?.size ?? 12;
    const bold = options?.bold ?? false;
    const maxWidth = options?.maxWidth ?? CONTENT_WIDTH;
    const lineGap = options?.lineGap ?? 5;
    const color = options?.color ?? rgb(0, 0, 0);
    const font = bold ? fontBold : fontRegular;

    const paragraphs = splitParagraphs(text);

    for (const paragraph of paragraphs) {
      const lines = wrapText(paragraph, maxWidth, font, size);

      for (const line of lines) {
        ensureSpace(size + lineGap + 2);

        page.drawText(line, {
          x,
          y,
          size,
          font,
          color,
        });

        y -= size + lineGap;
      }

      y -= 4;
    }
  };

  const drawSectionTitle = (title: string) => {
    y -= 8;
    ensureSpace(30);

    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.7,
      color: rgb(0.85, 0.85, 0.85),
    });

    y -= 18;

    page.drawText(title, {
      x: MARGIN,
      y,
      size: 18,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    y -= 22;
  };

  const drawKeyValueRow = (label: string, value: string) => {
    const labelX = MARGIN;
    const valueX = PAGE_WIDTH - MARGIN - 140;

    ensureSpace(22);

    page.drawText(label, {
      x: labelX,
      y,
      size: 12,
      font: fontRegular,
      color: rgb(0.15, 0.15, 0.15),
    });

    page.drawText(value, {
      x: valueX,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    y -= 20;
  };

  const drawBulletList = (items: string[]) => {
    for (const item of items) {
      const bulletX = MARGIN;
      const textX = MARGIN + 14;
      const maxWidth = CONTENT_WIDTH - 14;

      ensureSpace(24);

      page.drawText("•", {
        x: bulletX,
        y,
        size: 12,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      const lines = wrapText(item, maxWidth, fontRegular, 12);

      for (let i = 0; i < lines.length; i++) {
        ensureSpace(18);

        page.drawText(lines[i], {
          x: textX,
          y,
          size: 12,
          font: fontRegular,
          color: rgb(0, 0, 0),
        });

        y -= 17;
      }

      y -= 2;
    }
  };

  const drawScoreCard = (score: number, label?: string) => {
    const cardHeight = 88;
    const cardWidth = CONTENT_WIDTH;
    const cardX = MARGIN;
    const cardY = y - cardHeight + 12;

    ensureSpace(cardHeight + 16);

    page.drawRectangle({
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      borderWidth: 1,
      borderColor: rgb(0.88, 0.88, 0.88),
      color: rgb(0.98, 0.98, 0.98),
    });

    page.drawText(`Økonomiscore: ${score}/100`, {
      x: cardX + 18,
      y: y - 16,
      size: 20,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    const barX = cardX + 18;
    const barY = y - 42;
    const barWidth = cardWidth - 36;
    const barHeight = 12;
    const fillWidth = Math.max(0, Math.min(100, score)) / 100 * barWidth;

    page.drawRectangle({
      x: barX,
      y: barY,
      width: barWidth,
      height: barHeight,
      color: rgb(0.9, 0.9, 0.9),
      borderWidth: 0,
    });

    page.drawRectangle({
      x: barX,
      y: barY,
      width: fillWidth,
      height: barHeight,
      color: rgb(0.2, 0.6, 0.3),
      borderWidth: 0,
    });

    if (label) {
      page.drawText(label, {
        x: cardX + 18,
        y: y - 64,
        size: 11,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    y -= cardHeight + 10;
  };

  const drawCategoryTable = (categories: CategoryItem[]) => {
    const labelX = MARGIN;
    const valueX = PAGE_WIDTH - MARGIN - 140;

    for (const item of categories) {
      ensureSpace(20);

      page.drawText(item.category, {
        x: labelX,
        y,
        size: 12,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });

      page.drawText(formatCurrency(item.amount), {
        x: valueX,
        y,
        size: 12,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      y -= 18;
    }
  };

  const drawTrendTable = (trend: TrendItem[]) => {
    const headers = [
      { label: "Måned", x: MARGIN },
      { label: "Utgifter", x: MARGIN + 110 },
      { label: "Spart", x: MARGIN + 230 },
      { label: "Rate", x: MARGIN + 350 },
    ];

    ensureSpace(28);

    for (const header of headers) {
      page.drawText(header.label, {
        x: header.x,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.15, 0.15, 0.15),
      });
    }

    y -= 16;

    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.82, 0.82, 0.82),
    });

    y -= 14;

    for (const item of trend) {
      ensureSpace(20);

      page.drawText(truncateLabel(item.month, 16), {
        x: MARGIN,
        y,
        size: 10.5,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });

      page.drawText(formatCurrency(item.expenses), {
        x: MARGIN + 110,
        y,
        size: 10.5,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });

      page.drawText(formatCurrency(item.netSavings), {
        x: MARGIN + 230,
        y,
        size: 10.5,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });

      page.drawText(formatPercent(item.savingsRate), {
        x: MARGIN + 350,
        y,
        size: 10.5,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });

      y -= 17;
    }
  };

  const monthLabel = `${getMonthName(input.month)} ${input.year}`;

  drawTextLine("Månedsrapport", { size: 28, bold: true });
  drawTextLine(monthLabel, { size: 14, color: rgb(0.35, 0.35, 0.35) });
  y -= 10;

  drawScoreCard(input.insights.score, input.insights.scoreLabel);

  drawSectionTitle("Nøkkeltall");
  drawKeyValueRow("Inntekter", formatCurrency(input.report.income));
  drawKeyValueRow("Utgifter", formatCurrency(input.report.expenses));
  drawKeyValueRow("Netto spart", formatCurrency(input.report.netSavings));
  drawKeyValueRow("Sparingsgrad", formatPercent(input.report.savingsRate));

  if (input.report.comparison) {
    drawSectionTitle("Sammenlignet med forrige måned");

    const comparisonLines: string[] = [];

    if (
      typeof input.report.comparison.expenseDiff === "number" &&
      typeof input.report.comparison.expenseDiffPercent === "number"
    ) {
      const dir = input.report.comparison.expenseDiff >= 0 ? "Opp" : "Ned";
      comparisonLines.push(
        `Utgifter: ${dir} ${formatCurrency(Math.abs(input.report.comparison.expenseDiff))} (${Math.abs(input.report.comparison.expenseDiffPercent).toFixed(1).replace(".", ",")} %)`
      );
    }

    if (input.report.comparison.incomeText) {
      comparisonLines.push(`Inntekter: ${input.report.comparison.incomeText}`);
    }

    if (
      typeof input.report.comparison.savingsDiff === "number" &&
      typeof input.report.comparison.savingsDiffPercent === "number"
    ) {
      const dir = input.report.comparison.savingsDiff >= 0 ? "Opp" : "Ned";
      comparisonLines.push(
        `Sparing: ${dir} ${formatCurrency(Math.abs(input.report.comparison.savingsDiff))} (${Math.abs(input.report.comparison.savingsDiffPercent).toFixed(1).replace(".", ",")} %)`
      );
    }

    if (comparisonLines.length > 0) {
      drawBulletList(comparisonLines);
    }
  }

  drawSectionTitle("Månedlig oppsummering");
  drawWrappedText(input.insights.summary, { size: 12, maxWidth: CONTENT_WIDTH });

  const analysisText =
    Array.isArray(input.insights.analysis)
      ? input.insights.analysis.filter(Boolean).join("\n")
      : normalizeText(input.insights.analysis);

  if (analysisText) {
    y -= 4;
    drawWrappedText(analysisText, { size: 12, maxWidth: CONTENT_WIDTH });
  }

  drawSectionTitle("Anbefalinger");
  drawBulletList(input.insights.recommendations);

  drawSectionTitle("Største kategorier");
  drawCategoryTable(input.report.categoryTotals);

  drawSectionTitle("6-måneders trend");
  drawTrendTable(input.report.trend);

  return await pdfDoc.save();
}