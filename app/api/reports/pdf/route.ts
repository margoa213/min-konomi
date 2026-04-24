import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getOrCreateCurrentUser } from "@/lib/get-or-create-user";
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
import { buildMonthlyReportPdf } from "@/lib/pdf-report";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await getOrCreateCurrentUser();

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const { searchParams } = new URL(req.url);

    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);

    const report = await generateMonthlyReport(user.id, year, month);
    const comparison = await generateMonthlyComparison(user.id, year, month);
    const trendRaw = await generateSixMonthTrend(user.id, year, month);

    const financialScore = generateFinancialScore(trendRaw, []);
    const recommendations = generateRecommendations(
      trendRaw,
      [],
      financialScore
    );

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

    const monthLabel = `${monthNames[month - 1]} ${year}`;

    const narrative = generateMonthlyNarrative({
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
      userName: user.name ?? user.email ?? "Bruker",
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
        trend: trendRaw.map((point) => ({
          month: point.label,
          expenses: point.totalExpenses,
          netSavings: point.netSavings,
          savingsRate: point.savingsRate,
        })),
        comparison: {
          expenseDiff: comparison.expenseChangeAmount ?? undefined,
          expenseDiffPercent: comparison.expenseChangePercent ?? undefined,
          incomeText:
            comparison.incomeChangeAmount == null ||
            comparison.incomeChangePercent == null
              ? undefined
              : `${comparison.incomeChangeAmount >= 0 ? "Opp" : "Ned"} ${Math.abs(
                  comparison.incomeChangeAmount
                ).toLocaleString("nb-NO")} kr (${Math.abs(
                  comparison.incomeChangePercent
                )
                  .toFixed(1)
                  .replace(".", ",")} %)`,
          savingsDiff: comparison.savingsChangeAmount ?? undefined,
          savingsDiffPercent: comparison.savingsChangePercent ?? undefined,
        },
      },
      insights: {
        score: financialScore.score,
        scoreLabel: financialScore.label,
        analysis: Array.isArray(narrative.bullets)
          ? [narrative.intro, ...narrative.bullets, narrative.closing]
          : narrative.intro,
        recommendations: recommendations.map((r) => r.title),
        summary: narrative.intro,
      },
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="rapport-${year}-${month}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF ERROR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}