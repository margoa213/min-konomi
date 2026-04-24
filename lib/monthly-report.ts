import { db } from "@/lib/db";

type CategoryItem = {
  category: string;
  total: number;
};

export type MonthlyReport = {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  byCategory: CategoryItem[];
};

export type MonthlyReportSummary = MonthlyReport;

export type MonthlyComparison = {
  previousYear: number;
  previousMonth: number;
  incomeChangeAmount: number | null;
  incomeChangePercent: number | null;
  expenseChangeAmount: number | null;
  expenseChangePercent: number | null;
  savingsChangeAmount: number | null;
  savingsChangePercent: number | null;
};

export type TrendPoint = {
  year: number;
  month: number;
  label: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
};

export type SixMonthTrendPoint = TrendPoint;

export type CategoryTrendItem = {
  category: string;
  currentTotal: number;
  previousTotal: number;
  changeAmount: number;
  changePercent: number | null;
  threeMonthAverage: number;
  vsAverageAmount: number;
  vsAveragePercent: number | null;
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

function roundAmount(value: number) {
  return Math.round(value);
}

function roundPercent(value: number) {
  return Math.round(value * 10) / 10;
}

export function getMonthDateRange(year: number, month: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error(`Ugyldig år eller måned: year=${year}, month=${month}`);
  }

  if (month < 1 || month > 12) {
    throw new Error(`Måned må være mellom 1 og 12. Fikk month=${month}`);
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  return { start, end };
}

function getMonthLabel(year: number, month: number) {
  return `${monthNames[month - 1] ?? `Måned ${month}`} ${year}`;
}

function getPreviousMonth(year: number, month: number) {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
}

function getMonthOffset(year: number, month: number, offset: number) {
  const date = new Date(year, month - 1 + offset, 1);

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

function isIncome(direction: string, amount: number) {
  const normalized = direction.trim().toLowerCase();

  if (
    normalized === "in" ||
    normalized === "inn" ||
    normalized === "income" ||
    normalized === "credit" ||
    normalized === "deposit"
  ) {
    return true;
  }

  if (
    normalized === "out" ||
    normalized === "ut" ||
    normalized === "expense" ||
    normalized === "debit"
  ) {
    return false;
  }

  return amount > 0;
}

function calculatePercentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return roundPercent(((current - previous) / previous) * 100);
}

async function getTransactionsForMonth(
  userId: string,
  year: number,
  month: number
) {
  const { start, end } = getMonthDateRange(year, month);

  return db.transaction.findMany({
    where: {
      userId,
      bookingDate: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      bookingDate: "asc",
    },
  });
}

function buildMonthlyTotals(
  transactions: Awaited<ReturnType<typeof getTransactionsForMonth>>
) {
  let totalIncome = 0;
  let totalExpenses = 0;

  const categoryMap = new Map<string, number>();

  for (const tx of transactions) {
    const amount = Number(tx.amount ?? 0);
    const income = isIncome(tx.direction ?? "", amount);

    if (income) {
      totalIncome += Math.abs(amount);
      continue;
    }

    const expenseAmount = Math.abs(amount);
    totalExpenses += expenseAmount;

    const category = tx.category?.trim() || "Ukjent";
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + expenseAmount);
  }

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, total]) => ({
      category,
      total: roundAmount(total),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalIncome: roundAmount(totalIncome),
    totalExpenses: roundAmount(totalExpenses),
    netSavings: roundAmount(netSavings),
    savingsRate: roundPercent(savingsRate),
    byCategory,
  };
}

export async function generateMonthlyReport(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyReport> {
  const transactions = await getTransactionsForMonth(userId, year, month);
  const totals = buildMonthlyTotals(transactions);

  return {
    year,
    month,
    totalIncome: totals.totalIncome,
    totalExpenses: totals.totalExpenses,
    netSavings: totals.netSavings,
    savingsRate: totals.savingsRate,
    byCategory: totals.byCategory,
  };
}

export async function generateMonthlyComparison(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyComparison> {
  const current = await generateMonthlyReport(userId, year, month);
  const previousRef = getPreviousMonth(year, month);

  const previous = await generateMonthlyReport(
    userId,
    previousRef.year,
    previousRef.month
  );

  const previousHasAnyData =
    previous.totalIncome > 0 ||
    previous.totalExpenses > 0 ||
    previous.netSavings !== 0;

  if (!previousHasAnyData) {
    return {
      previousYear: previousRef.year,
      previousMonth: previousRef.month,
      incomeChangeAmount: null,
      incomeChangePercent: null,
      expenseChangeAmount: null,
      expenseChangePercent: null,
      savingsChangeAmount: null,
      savingsChangePercent: null,
    };
  }

  return {
    previousYear: previousRef.year,
    previousMonth: previousRef.month,
    incomeChangeAmount: roundAmount(current.totalIncome - previous.totalIncome),
    incomeChangePercent: calculatePercentChange(
      current.totalIncome,
      previous.totalIncome
    ),
    expenseChangeAmount: roundAmount(
      current.totalExpenses - previous.totalExpenses
    ),
    expenseChangePercent: calculatePercentChange(
      current.totalExpenses,
      previous.totalExpenses
    ),
    savingsChangeAmount: roundAmount(current.netSavings - previous.netSavings),
    savingsChangePercent: calculatePercentChange(
      current.netSavings,
      previous.netSavings
    ),
  };
}

export function generateInsights(
  report: MonthlyReport,
  comparison: MonthlyComparison
): string[] {
  const insights: string[] = [];

  if (report.savingsRate >= 20) {
    insights.push(
      `Du sparte ${report.savingsRate.toFixed(1).replace(".", ",")} % denne måneden, som er et sterkt nivå.`
    );
  } else if (report.savingsRate > 0) {
    insights.push(
      `Du hadde en positiv sparingsgrad på ${report.savingsRate
        .toFixed(1)
        .replace(".", ",")} %, men det er rom for forbedring.`
    );
  } else {
    insights.push(
      "Du brukte mer enn du tjente denne måneden. Det er et tydelig signal om å stramme inn enkelte kostnader."
    );
  }

  if (report.byCategory.length > 0) {
    const topCategory = report.byCategory[0];
    insights.push(
      `Største utgiftskategori var ${topCategory.category} med ${topCategory.total.toLocaleString("no-NO")} kr.`
    );
  }

  if (
    comparison.expenseChangeAmount !== null &&
    comparison.expenseChangePercent !== null
  ) {
    if (comparison.expenseChangeAmount > 0) {
      insights.push(
        `Utgiftene økte med ${Math.abs(
          comparison.expenseChangeAmount
        ).toLocaleString("no-NO")} kr (${Math.abs(
          comparison.expenseChangePercent
        )
          .toFixed(1)
          .replace(".", ",")} %) sammenlignet med forrige måned.`
      );
    } else if (comparison.expenseChangeAmount < 0) {
      insights.push(
        `Utgiftene falt med ${Math.abs(
          comparison.expenseChangeAmount
        ).toLocaleString("no-NO")} kr (${Math.abs(
          comparison.expenseChangePercent
        )
          .toFixed(1)
          .replace(".", ",")} %) fra forrige måned.`
      );
    }
  }

  if (report.totalExpenses === 0) {
    insights.push("Ingen utgifter er registrert denne måneden.");
  }

  return insights;
}

export async function generateSixMonthTrend(
  userId: string,
  year: number,
  month: number
): Promise<SixMonthTrendPoint[]> {
  const points: SixMonthTrendPoint[] = [];

  for (let offset = -5; offset <= 0; offset++) {
    const ref = getMonthOffset(year, month, offset);
    const report = await generateMonthlyReport(userId, ref.year, ref.month);

    points.push({
      year: ref.year,
      month: ref.month,
      label: getMonthLabel(ref.year, ref.month),
      totalIncome: report.totalIncome,
      totalExpenses: report.totalExpenses,
      netSavings: report.netSavings,
      savingsRate: report.savingsRate,
    });
  }

  return points;
}

async function getThreeMonthAverageForCategory(
  userId: string,
  year: number,
  month: number,
  category: string
) {
  const refs = [0, -1, -2].map((offset) => getMonthOffset(year, month, offset));

  let total = 0;

  for (const ref of refs) {
    const report = await generateMonthlyReport(userId, ref.year, ref.month);
    const item = report.byCategory.find((entry) => entry.category === category);
    total += item?.total ?? 0;
  }

  return total / refs.length;
}

export async function generateCategoryTrend(
  userId: string,
  year: number,
  month: number
): Promise<CategoryTrendItem[]> {
  const current = await generateMonthlyReport(userId, year, month);
  const previousRef = getPreviousMonth(year, month);

  const previous = await generateMonthlyReport(
    userId,
    previousRef.year,
    previousRef.month
  );

  const categories = new Set<string>([
    ...current.byCategory.map((item) => item.category),
    ...previous.byCategory.map((item) => item.category),
  ]);

  const items: CategoryTrendItem[] = [];

  for (const category of categories) {
    const currentItem = current.byCategory.find(
      (item) => item.category === category
    );
    const previousItem = previous.byCategory.find(
      (item) => item.category === category
    );

    const currentTotal = currentItem?.total ?? 0;
    const previousTotal = previousItem?.total ?? 0;
    const changeAmount = roundAmount(currentTotal - previousTotal);

    const changePercent =
      previousTotal > 0
        ? roundPercent(((currentTotal - previousTotal) / previousTotal) * 100)
        : null;

    const threeMonthAverageRaw = await getThreeMonthAverageForCategory(
      userId,
      year,
      month,
      category
    );

    const threeMonthAverage = roundAmount(threeMonthAverageRaw);
    const vsAverageAmount = roundAmount(currentTotal - threeMonthAverage);

    const vsAveragePercent =
      threeMonthAverage > 0
        ? roundPercent(
            ((currentTotal - threeMonthAverage) / threeMonthAverage) * 100
          )
        : null;

    items.push({
      category,
      currentTotal,
      previousTotal,
      changeAmount,
      changePercent,
      threeMonthAverage,
      vsAverageAmount,
      vsAveragePercent,
    });
  }

  return items.sort((a, b) => b.currentTotal - a.currentTotal);
}