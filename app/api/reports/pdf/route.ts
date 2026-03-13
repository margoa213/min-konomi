import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildMonthlyReportPdf } from "@/lib/pdf-report";
import {
  generateMonthlyComparison,
  generateMonthlyReport,
  generateSixMonthTrend,
} from "@/lib/monthly-report";
import {
  generateFinancialScore,
  generateMonthlyNarrative,
  generateRecommendations,
} from "@/lib/insight-engine";

const monthNames = [
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

function safeNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const now = new Date();
    const year = safeNumber(searchParams.get("year"), now.getFullYear());
    const month = safeNumber(searchParams.get("month"), now.getMonth() + 1);

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Ugyldig år eller måned." },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst();

    if (!user) {
      return NextResponse.json(
        { error: "Fant ingen bruker i databasen." },
        { status: 404 }
      );
    }

    const report = await generateMonthlyReport(user.id, year, month);
    const comparison = await generateMonthlyComparison(user.id, year, month);
    const trend = await generateSixMonthTrend(user.id, year, month);
    const financialScore = generateFinancialScore(trend, []);
    const recommendations = generateRecommendations(trend, [], financialScore);

    const monthLabel = `${monthNames[month - 1]} ${year}`;

    const monthlyNarrative = generateMonthlyNarrative({
      monthLabel,
      totalIncome: report.totalIncome,
      totalExpenses: report.totalExpenses,
      netSavings: report.netSavings,
      savingsRate: report.savingsRate,
      topCategory: report.byCategory[0] ?? null,
      comparison: {
        expenseChangeAmount: comparison.expenseChangeAmount,
        expenseChangePercent: comparison.expenseChangePercent,
        incomeChangeAmount: comparison.incomeChangeAmount,
        incomeChangePercent: comparison.incomeChangePercent,
        savingsChangeAmount: comparison.savingsChangeAmount,
        savingsChangePercent: comparison.savingsChangePercent,
      },
      financialScore,
      recommendations,
    });

    const pdfBytes = await buildMonthlyReportPdf({
      userName: user.name ?? "Demo-bruker",
      year,
      month,
      report: {
        income: report.totalIncome,
        expenses: report.totalExpenses,
        netSavings: report.netSavings,
        savingsRate: report.savingsRate,
        categoryTotals: report.byCategory.map((item) => ({
          category: item.category,
          amount: item.total,
        })),
        trend: trend.map((item) => ({
          month: item.label,
          expenses: item.totalExpenses,
          netSavings: item.netSavings,
          savingsRate: item.savingsRate,
        })),
        comparison: {
          expenseDiff: comparison.expenseChangeAmount ?? 0,
          expenseDiffPercent: comparison.expenseChangePercent ?? 0,
          incomeText:
            comparison.incomeChangeAmount === null
              ? "Første måned med data"
              : comparison.incomeChangeAmount > 0
                ? "Opp"
                : comparison.incomeChangeAmount < 0
                  ? "Ned"
                  : "Uendret",
          savingsDiff: comparison.savingsChangeAmount ?? 0,
          savingsDiffPercent: comparison.savingsChangePercent ?? 0,
        },
      },
      insights: {
        score: financialScore.score,
        scoreLabel: financialScore.label,
        analysis: financialScore.summary,
        recommendations: recommendations.map((item) => item.title),
        summary: monthlyNarrative.emailText,
      },
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="manedsrapport-${year}-${String(
          month
        ).padStart(2, "0")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF route error:", error);

    const message =
      error instanceof Error ? error.message : "Ukjent serverfeil";

    return NextResponse.json(
      {
        error: "Kunne ikke generere PDF.",
        details: message,
      },
      { status: 500 }
    );
  }
}