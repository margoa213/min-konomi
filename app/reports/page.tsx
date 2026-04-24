import { getOrCreateCurrentUser } from "../../lib/get-or-create-user";
import { db } from "../../lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  generateFinancialScore,
  generateMonthlyNarrative,
  generateRecommendations,
  generateSmartInsights,
} from "../../lib/insight-engine";
import {
  generateCategoryTrend,
  generateInsights,
  generateMonthlyComparison,
  generateMonthlyReport,
  generateSixMonthTrend,
} from "../../lib/monthly-report";
import { RecentTransactionsSection } from "./recent-transactions-section";

type ReportsPageProps = {
  searchParams?: Promise<{
    year?: string;
    month?: string;
  }>;
};

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

function formatCurrency(value: number) {
  return `${value.toLocaleString("no-NO")} kr`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")} %`;
}

function getSavingsColor(value: number) {
  if (value > 50) return "#4ade80";
  if (value > 0) return "#facc15";
  return "#f87171";
}

function getScoreColor(score: number) {
  if (score >= 85) return "#4ade80";
  if (score >= 70) return "#86efac";
  if (score >= 55) return "#facc15";
  if (score >= 40) return "#fb923c";
  return "#f87171";
}

function getChangeMeta(amount: number | null, percent: number | null) {
  if (amount === null || percent === null) {
    return {
      label: "Første måned med data",
      color: "#a3a3a3",
      amountText: "–",
      percentText: "–",
    };
  }

  if (amount === 0) {
    return {
      label: "Uendret",
      color: "#a3a3a3",
      amountText: "0 kr",
      percentText: "0,0 %",
    };
  }

  const isUp = amount > 0;

  return {
    label: isUp ? "Opp" : "Ned",
    color: isUp ? "#f87171" : "#4ade80",
    amountText: formatCurrency(Math.abs(amount)),
    percentText: formatPercent(Math.abs(percent)),
  };
}

function getCategoryDeltaMeta(changeAmount: number, changePercent: number | null) {
  if (changeAmount === 0) {
    return {
      label: "Uendret",
      color: "#a3a3a3",
      amountText: "0 kr",
      percentText: "0,0 %",
    };
  }

  if (changePercent === null) {
    return {
      label: changeAmount > 0 ? "Ny kostnad" : "Lavere",
      color: changeAmount > 0 ? "#f87171" : "#4ade80",
      amountText: formatCurrency(Math.abs(changeAmount)),
      percentText: "–",
    };
  }

  return {
    label: changeAmount > 0 ? "Opp" : "Ned",
    color: changeAmount > 0 ? "#f87171" : "#4ade80",
    amountText: formatCurrency(Math.abs(changePercent)),
    percentText: formatPercent(Math.abs(changePercent)),
  };
}

function MetricCard({
  label,
  value,
  valueColor = "#ffffff",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: valueColor,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <h2
        style={{
          fontSize: 30,
          fontWeight: 700,
          marginBottom: 20,
          color: "#ffffff",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ComparisonCard({
  title,
  amount,
  percent,
}: {
  title: string;
  amount: number | null;
  percent: number | null;
}) {
  const meta = getChangeMeta(amount, percent);

  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 18,
        minHeight: 120,
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: meta.color,
          marginBottom: 8,
        }}
      >
        {meta.label}
      </div>

      <div style={{ fontSize: 15, color: "rgba(255,255,255,0.88)" }}>
        Endring: {meta.amountText}
      </div>

      <div
        style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.68)",
          marginTop: 4,
        }}
      >
        Prosent: {meta.percentText}
      </div>
    </div>
  );
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const params = (await searchParams) ?? {};

  const now = new Date();
  const year = Number(params.year ?? now.getFullYear());
  const month = Number(params.month ?? now.getMonth() + 1);

  const user = await getOrCreateCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const recentTransactions = await db.transaction.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      bookingDate: "desc",
    },
    take: 5,
    select: {
      id: true,
      amount: true,
      category: true,
      description: true,
      bookingDate: true,
      direction: true,
    },
  });

  const report = await generateMonthlyReport(user.id, year, month);
  const comparison = await generateMonthlyComparison(user.id, year, month);
  const insights = generateInsights(report, comparison);
  const trend = await generateSixMonthTrend(user.id, year, month);
  const categoryTrend = await generateCategoryTrend(user.id, year, month);
  const smartInsights = generateSmartInsights(trend, categoryTrend);
  const financialScore = generateFinancialScore(trend, categoryTrend);
  const recommendations = generateRecommendations(
    trend,
    categoryTrend,
    financialScore
  );

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

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const comparisonMonthLabel = `${monthNames[comparison.previousMonth - 1]} ${comparison.previousYear}`;

  const maxCategoryTotal =
    report.byCategory.length > 0
      ? Math.max(...report.byCategory.map((item) => item.total))
      : 1;

  const maxTrendExpenses =
    trend.length > 0 ? Math.max(...trend.map((point) => point.totalExpenses), 1) : 1;

  const maxTrendSavings =
    trend.length > 0 ? Math.max(...trend.map((point) => point.netSavings), 1) : 1;

  const visibleCategoryTrend = categoryTrend
    .filter((item) => item.currentTotal > 0 || item.previousTotal > 0)
    .slice(0, 6);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #111827 0%, #050505 45%, #000000 100%)",
        color: "#ffffff",
        padding: "48px 24px 80px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
            marginBottom: 36,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 46,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              Månedsrapport
            </h1>
            <p
              style={{
                marginTop: 10,
                fontSize: 22,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {monthLabel}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/transactions/new"
              style={{
                background: "#16a34a",
                border: "1px solid rgba(134,239,172,0.35)",
                color: "#ffffff",
                padding: "12px 18px",
                borderRadius: 14,
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              + Ny transaksjon
            </Link>

            <Link
              href={`/reports?year=${prevYear}&month=${prevMonth}`}
              style={{
                background: "#171717",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#ffffff",
                padding: "12px 18px",
                borderRadius: 14,
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              ← Forrige
            </Link>

            <Link
              href={`/reports?year=${nextYear}&month=${nextMonth}`}
              style={{
                background: "#171717",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#ffffff",
                padding: "12px 18px",
                borderRadius: 14,
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              Neste →
            </Link>

            <a
              href={`/api/reports/pdf?year=${year}&month=${month}`}
              target="_blank"
              rel="noreferrer"
              style={{
                background: "#2563eb",
                border: "1px solid rgba(147,197,253,0.35)",
                color: "#ffffff",
                padding: "12px 18px",
                borderRadius: 14,
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Last ned PDF
            </a>
          </div>
        </div>

        <SectionCard title="Økonomiscore">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(180px, 220px) 1fr",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div
              style={{
                background: "#0a0a0a",
                border: `1px solid ${getScoreColor(financialScore.score)}33`,
                borderRadius: 20,
                padding: 24,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: getScoreColor(financialScore.score),
                }}
              >
                {financialScore.score}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {financialScore.label}
              </div>
            </div>

            <div>
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 18,
                  color: "rgba(255,255,255,0.78)",
                  lineHeight: 1.6,
                }}
              >
                {financialScore.summary}
              </p>

              <div style={{ display: "grid", gap: 12 }}>
                {financialScore.factors.map((factor) => {
                  const color =
                    factor.impact === "positive"
                      ? "#4ade80"
                      : factor.impact === "negative"
                        ? "#f87171"
                        : "#60a5fa";

                  return (
                    <div
                      key={factor.title}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${color}22`,
                        borderRadius: 14,
                        padding: "14px 16px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color,
                          marginBottom: 4,
                        }}
                      >
                        {factor.title}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.72)" }}>
                        {factor.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>

        {recommendations.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <SectionCard title="Anbefalinger">
              <div style={{ display: "grid", gap: 14 }}>
                {recommendations.map((recommendation) => {
                  const color =
                    recommendation.severity === "warning"
                      ? "#f87171"
                      : recommendation.severity === "positive"
                        ? "#4ade80"
                        : "#60a5fa";

                  return (
                    <div
                      key={recommendation.title}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${color}33`,
                        borderRadius: 16,
                        padding: "16px 18px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: 6,
                          color,
                        }}
                      >
                        {recommendation.title}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.75)",
                          lineHeight: 1.5,
                          marginBottom: 8,
                        }}
                      >
                        {recommendation.description}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "rgba(255,255,255,0.52)",
                        }}
                      >
                        {recommendation.impactLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
            marginTop: 28,
            marginBottom: 28,
          }}
        >
          <MetricCard label="Inntekter" value={formatCurrency(report.totalIncome)} />
          <MetricCard label="Utgifter" value={formatCurrency(report.totalExpenses)} />
          <MetricCard label="Netto spart" value={formatCurrency(report.netSavings)} />
          <MetricCard
            label="Sparingsgrad"
            value={formatPercent(report.savingsRate)}
            valueColor={getSavingsColor(report.savingsRate)}
          />
        </div>

        <div style={{ display: "grid", gap: 24 }}>
          <SectionCard title="Månedlig oppsummering">
            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  {monthlyNarrative.title}
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "rgba(255,255,255,0.78)",
                    lineHeight: 1.6,
                  }}
                >
                  {monthlyNarrative.intro}
                </p>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  Hovedpunkter
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {monthlyNarrative.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      style={{
                        color: "rgba(255,255,255,0.76)",
                        lineHeight: 1.5,
                      }}
                    >
                      • {bullet}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.86)",
                    fontWeight: 600,
                  }}
                >
                  {monthlyNarrative.closing}
                </div>
              </div>

              <div
                style={{
                  background: "#0a0a0a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  Klar for e-post / PDF
                </div>

                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.6,
                  }}
                >
                  {monthlyNarrative.emailText}
                </pre>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Sammenlignet med forrige måned">
            <p
              style={{
                marginTop: 0,
                marginBottom: 18,
                color: "rgba(255,255,255,0.65)",
                fontSize: 15,
              }}
            >
              Sammenligner med {comparisonMonthLabel}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <ComparisonCard
                title="Utgifter"
                amount={comparison.expenseChangeAmount}
                percent={comparison.expenseChangePercent}
              />
              <ComparisonCard
                title="Inntekter"
                amount={comparison.incomeChangeAmount}
                percent={comparison.incomeChangePercent}
              />
              <ComparisonCard
                title="Sparing"
                amount={comparison.savingsChangeAmount}
                percent={comparison.savingsChangePercent}
              />
            </div>
          </SectionCard>

          <SectionCard title="Innsikt">
            <div style={{ display: "grid", gap: 12 }}>
              {insights.map((insight) => (
                <div
                  key={insight}
                  style={{
                    background: "rgba(59,130,246,0.12)",
                    border: "1px solid rgba(96,165,250,0.18)",
                    borderRadius: 16,
                    padding: "14px 16px",
                    color: "#dbeafe",
                    lineHeight: 1.5,
                  }}
                >
                  {insight}
                </div>
              ))}
            </div>
          </SectionCard>

          {smartInsights.length > 0 && (
            <SectionCard title="Smart analyse">
              <div style={{ display: "grid", gap: 14 }}>
                {smartInsights.map((insight) => {
                  const color =
                    insight.severity === "warning"
                      ? "#f87171"
                      : insight.severity === "positive"
                        ? "#4ade80"
                        : "#60a5fa";

                  return (
                    <div
                      key={insight.title}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${color}33`,
                        borderRadius: 16,
                        padding: "16px 18px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: 6,
                          color,
                        }}
                      >
                        {insight.title}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.75)" }}>
                        {insight.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Kategoriutvikling">
            {visibleCategoryTrend.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.65)" }}>
                Ingen kategoriendringer tilgjengelig.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 14,
                }}
              >
                {visibleCategoryTrend.map((item) => {
                  const delta = getCategoryDeltaMeta(item.changeAmount, item.changePercent);

                  return (
                    <div
                      key={item.category}
                      style={{
                        background: "#0a0a0a",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 16,
                        padding: 18,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          marginBottom: 12,
                        }}
                      >
                        {item.category}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gap: 8,
                          fontSize: 14,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            color: "rgba(255,255,255,0.82)",
                          }}
                        >
                          <span>Denne måneden</span>
                          <span>{formatCurrency(item.currentTotal)}</span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            color: "rgba(255,255,255,0.68)",
                          }}
                        >
                          <span>Forrige måned</span>
                          <span>{formatCurrency(item.previousTotal)}</span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            color: "rgba(255,255,255,0.68)",
                          }}
                        >
                          <span>3-mnd snitt</span>
                          <span>{formatCurrency(Math.round(item.threeMonthAverage))}</span>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 14,
                          paddingTop: 14,
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            color: "rgba(255,255,255,0.55)",
                            marginBottom: 6,
                          }}
                        >
                          Endring mot forrige måned
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              color: delta.color,
                            }}
                          >
                            {delta.label}
                          </div>

                          <div
                            style={{
                              textAlign: "right",
                              color: "rgba(255,255,255,0.78)",
                              fontSize: 14,
                            }}
                          >
                            <div>{delta.amountText}</div>
                            <div style={{ color: "rgba(255,255,255,0.5)" }}>
                              {delta.percentText}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="6-måneders trend">
            <div style={{ display: "grid", gap: 18 }}>
              {trend.map((point) => {
                const expenseWidth =
                  maxTrendExpenses > 0 ? (point.totalExpenses / maxTrendExpenses) * 100 : 0;

                const savingsWidth =
                  maxTrendSavings > 0 ? (point.netSavings / maxTrendSavings) * 100 : 0;

                return (
                  <div
                    key={`${point.year}-${point.month}`}
                    style={{
                      background: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{point.label}</div>
                      <div
                        style={{
                          fontSize: 14,
                          color: "rgba(255,255,255,0.68)",
                        }}
                      >
                        Sparingsgrad: {formatPercent(point.savingsRate)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                            fontSize: 14,
                          }}
                        >
                          <span style={{ color: "rgba(255,255,255,0.75)" }}>Utgifter</span>
                          <span style={{ color: "rgba(255,255,255,0.85)" }}>
                            {formatCurrency(point.totalExpenses)}
                          </span>
                        </div>
                        <div
                          style={{
                            height: 10,
                            width: "100%",
                            background: "#222222",
                            borderRadius: 999,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${expenseWidth}%`,
                              background: "linear-gradient(90deg, #f87171 0%, #fb7185 100%)",
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                            fontSize: 14,
                          }}
                        >
                          <span style={{ color: "rgba(255,255,255,0.75)" }}>Netto spart</span>
                          <span style={{ color: "rgba(255,255,255,0.85)" }}>
                            {formatCurrency(point.netSavings)}
                          </span>
                        </div>
                        <div
                          style={{
                            height: 10,
                            width: "100%",
                            background: "#222222",
                            borderRadius: 999,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${savingsWidth}%`,
                              background: "linear-gradient(90deg, #4ade80 0%, #86efac 100%)",
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <RecentTransactionsSection transactions={recentTransactions} />

          <SectionCard title="Utgifter per kategori">
            {report.byCategory.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.65)" }}>
                Ingen utgifter denne måneden.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 18 }}>
                {report.byCategory.map((item) => {
                  const widthPercent = (item.total / maxCategoryTotal) * 100;

                  return (
                    <div key={item.category}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                          fontSize: 15,
                        }}
                      >
                        <span style={{ color: "rgba(255,255,255,0.92)" }}>
                          {item.category}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.72)" }}>
                          {formatCurrency(item.total)}
                        </span>
                      </div>

                      <div
                        style={{
                          height: 12,
                          width: "100%",
                          background: "#222222",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${widthPercent}%`,
                            background: "linear-gradient(90deg, #60a5fa 0%, #93c5fd 100%)",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </main>
  );
}