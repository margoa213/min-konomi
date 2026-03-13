import type { CategoryTrendItem, TrendPoint } from "./monthly-report";

export type SmartInsight = {
  title: string;
  description: string;
  severity: "info" | "positive" | "warning";
};

export type FinancialScore = {
  score: number;
  label: string;
  summary: string;
  factors: {
    title: string;
    impact: "positive" | "neutral" | "negative";
    description: string;
  }[];
};

export type FinancialScoreResult = FinancialScore;

export type Recommendation = {
  title: string;
  description: string;
  impactLabel: string;
  severity: "info" | "positive" | "warning";
};

export type MonthlyNarrativeInput = {
  monthLabel: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  topCategory?: {
    category: string;
    total: number;
  } | null;
  comparison?: {
    expenseChangeAmount: number | null;
    expenseChangePercent: number | null;
    incomeChangeAmount: number | null;
    incomeChangePercent: number | null;
    savingsChangeAmount: number | null;
    savingsChangePercent: number | null;
  };
  financialScore: FinancialScore;
  recommendations: Recommendation[];
};

export type MonthlyNarrative = {
  title: string;
  intro: string;
  bullets: string[];
  closing: string;
  emailText: string;
};

export type MonthlyNarrativeResult = MonthlyNarrative;

function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("no-NO")} kr`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")} %`;
}

export function generateFinancialScore(
  trend: TrendPoint[],
  categoryTrend: CategoryTrendItem[]
): FinancialScore {
  if (trend.length === 0) {
    return {
      score: 50,
      label: "Ingen data",
      summary: "Det er ikke nok data til å beregne en økonomiscore ennå.",
      factors: [],
    };
  }

  const latest = trend[trend.length - 1];
  const previous = trend.length >= 2 ? trend[trend.length - 2] : null;

  let score = 50;
  const factors: FinancialScore["factors"] = [];

  if (latest.savingsRate >= 40) {
    score += 20;
    factors.push({
      title: "Høy sparingsgrad",
      impact: "positive",
      description: `Du sparer ${latest.savingsRate.toFixed(1).replace(".", ",")} % av inntekten din.`,
    });
  } else if (latest.savingsRate >= 20) {
    score += 10;
    factors.push({
      title: "Solid sparing",
      impact: "positive",
      description: `Sparingsgraden er ${latest.savingsRate.toFixed(1).replace(".", ",")} %.`,
    });
  } else if (latest.savingsRate > 0) {
    score += 2;
    factors.push({
      title: "Positiv sparing",
      impact: "neutral",
      description: "Du går fortsatt i pluss denne måneden.",
    });
  } else {
    score -= 20;
    factors.push({
      title: "Negativ sparing",
      impact: "negative",
      description: "Du sparer ikke denne måneden, og økonomien er under press.",
    });
  }

  if (previous) {
    const savingsDelta = latest.netSavings - previous.netSavings;
    const expenseDelta = latest.totalExpenses - previous.totalExpenses;

    if (savingsDelta > 0) {
      score += 8;
      factors.push({
        title: "Bedre enn forrige måned",
        impact: "positive",
        description: `Netto sparing har økt med ${Math.abs(savingsDelta).toLocaleString("no-NO")} kr.`,
      });
    } else if (savingsDelta < 0) {
      score -= 8;
      factors.push({
        title: "Svakere enn forrige måned",
        impact: "negative",
        description: `Netto sparing har falt med ${Math.abs(savingsDelta).toLocaleString("no-NO")} kr.`,
      });
    }

    if (expenseDelta < 0) {
      score += 8;
      factors.push({
        title: "Lavere utgifter",
        impact: "positive",
        description: `Utgiftene er redusert med ${Math.abs(expenseDelta).toLocaleString("no-NO")} kr fra forrige måned.`,
      });
    } else if (expenseDelta > 0) {
      score -= 8;
      factors.push({
        title: "Høyere utgifter",
        impact: "negative",
        description: `Utgiftene er økt med ${Math.abs(expenseDelta).toLocaleString("no-NO")} kr fra forrige måned.`,
      });
    }
  }

  if (trend.length >= 3) {
    const last3 = trend.slice(-3);
    const averageSavingsRate =
      last3.reduce((sum, point) => sum + point.savingsRate, 0) / last3.length;

    if (averageSavingsRate >= 30) {
      score += 10;
      factors.push({
        title: "Stabil økonomi",
        impact: "positive",
        description: `Gjennomsnittlig sparingsgrad siste 3 måneder er ${averageSavingsRate
          .toFixed(1)
          .replace(".", ",")} %.`,
      });
    } else if (averageSavingsRate < 10) {
      score -= 10;
      factors.push({
        title: "Svak trend",
        impact: "negative",
        description: `Gjennomsnittlig sparingsgrad siste 3 måneder er bare ${averageSavingsRate
          .toFixed(1)
          .replace(".", ",")} %.`,
      });
    }
  }

  const categoriesAboveAverage = categoryTrend.filter(
    (item) =>
      item.currentTotal > 0 &&
      item.threeMonthAverage > 0 &&
      item.vsAveragePercent !== null &&
      item.vsAveragePercent > 25
  );

  if (categoriesAboveAverage.length > 0) {
    score -= 6;
    const top = [...categoriesAboveAverage].sort(
      (a, b) => b.vsAverageAmount - a.vsAverageAmount
    )[0];
    factors.push({
      title: "Kategori over snitt",
      impact: "negative",
      description: `${top.category} ligger klart over 3-måneders snittet ditt.`,
    });
  }

  const categoriesBelowAverage = categoryTrend.filter(
    (item) =>
      item.threeMonthAverage > 0 &&
      item.vsAveragePercent !== null &&
      item.vsAveragePercent < -20
  );

  if (categoriesBelowAverage.length > 0) {
    score += 6;
    const top = [...categoriesBelowAverage].sort(
      (a, b) => a.vsAverageAmount - b.vsAverageAmount
    )[0];
    factors.push({
      title: "Bedre kostnadskontroll",
      impact: "positive",
      description: `${top.category} er tydelig lavere enn 3-måneders snittet ditt.`,
    });
  }

  score = clamp(Math.round(score), 0, 100);

  let label = "Middels";
  let summary = "Økonomien er ok, men det finnes rom for forbedring.";

  if (score >= 85) {
    label = "Svært sterk";
    summary = "Dette er en veldig sterk måned. Du sparer mye og har god kontroll.";
  } else if (score >= 70) {
    label = "Sterk";
    summary = "Du har god økonomisk kontroll denne måneden.";
  } else if (score >= 55) {
    label = "Stabil";
    summary = "Økonomien er stabil, men enkelte områder kan forbedres.";
  } else if (score >= 40) {
    label = "Svak";
    summary = "Du bør følge ekstra med på sparing og utgifter.";
  } else {
    label = "Kritisk";
    summary = "Denne måneden er økonomisk svak og bør følges opp.";
  }

  return {
    score,
    label,
    summary,
    factors: factors.slice(0, 5),
  };
}

export function generateSmartInsights(
  trend: TrendPoint[],
  categoryTrend: CategoryTrendItem[]
): SmartInsight[] {
  const insights: SmartInsight[] = [];

  if (trend.length >= 2) {
    const latest = trend[trend.length - 1];
    const previous = trend[trend.length - 2];

    if (latest.netSavings < previous.netSavings) {
      const change = percentChange(latest.netSavings, previous.netSavings);

      if (change !== null && change < -10) {
        insights.push({
          title: "Sparing faller",
          description: `Sparingen din falt ${Math.abs(change).toFixed(1).replace(".", ",")} % fra forrige måned.`,
          severity: "warning",
        });
      }
    }

    if (latest.netSavings > previous.netSavings) {
      const change = percentChange(latest.netSavings, previous.netSavings);

      if (change !== null && change > 5) {
        insights.push({
          title: "Sterk sparing",
          description: `Sparingen økte ${change.toFixed(1).replace(".", ",")} % fra forrige måned.`,
          severity: "positive",
        });
      }
    }

    if (latest.totalExpenses > previous.totalExpenses) {
      const change = percentChange(latest.totalExpenses, previous.totalExpenses);

      if (change !== null && change > 15) {
        insights.push({
          title: "Utgiftsspike",
          description: `Utgiftene økte ${change.toFixed(1).replace(".", ",")} % fra forrige måned.`,
          severity: "warning",
        });
      }
    }

    if (latest.savingsRate > 50) {
      insights.push({
        title: "Svært høy sparingsgrad",
        description: `Du sparer ${latest.savingsRate.toFixed(1).replace(".", ",")} % av inntekten din.`,
        severity: "positive",
      });
    }
  }

  if (trend.length >= 3) {
    const last3 = trend.slice(-3);

    if (
      last3[2].netSavings < last3[1].netSavings &&
      last3[1].netSavings < last3[0].netSavings
    ) {
      insights.push({
        title: "Negativ trend",
        description: "Sparingen har falt tre måneder på rad.",
        severity: "warning",
      });
    }
  }

  const increasedCategories = categoryTrend
    .filter(
      (item) =>
        item.currentTotal > 0 &&
        item.changeAmount > 0 &&
        item.changePercent !== null &&
        item.changePercent > 20
    )
    .sort((a, b) => b.changeAmount - a.changeAmount);

  if (increasedCategories.length > 0) {
    const top = increasedCategories[0];
    insights.push({
      title: `${top.category} øker`,
      description: `${top.category} er opp ${Math.abs(top.changePercent ?? 0)
        .toFixed(1)
        .replace(".", ",")} % fra forrige måned (${Math.abs(
        top.changeAmount
      ).toLocaleString("no-NO")} kr mer).`,
      severity: "warning",
    });
  }

  const decreasedCategories = categoryTrend
    .filter(
      (item) =>
        item.previousTotal > 0 &&
        item.changeAmount < 0 &&
        item.changePercent !== null &&
        item.changePercent < -15
    )
    .sort((a, b) => a.changeAmount - b.changeAmount);

  if (decreasedCategories.length > 0) {
    const top = decreasedCategories[0];
    insights.push({
      title: `${top.category} går ned`,
      description: `${top.category} er ned ${Math.abs(top.changePercent ?? 0)
        .toFixed(1)
        .replace(".", ",")} % fra forrige måned (${Math.abs(
        top.changeAmount
      ).toLocaleString("no-NO")} kr mindre).`,
      severity: "positive",
    });
  }

  const aboveAverageCategories = categoryTrend
    .filter(
      (item) =>
        item.currentTotal > 0 &&
        item.threeMonthAverage > 0 &&
        item.vsAverageAmount > 0 &&
        item.vsAveragePercent !== null &&
        item.vsAveragePercent > 25
    )
    .sort((a, b) => b.vsAverageAmount - a.vsAverageAmount);

  if (aboveAverageCategories.length > 0) {
    const top = aboveAverageCategories[0];
    insights.push({
      title: `${top.category} over snitt`,
      description: `Du ligger ${Math.abs(top.vsAveragePercent ?? 0)
        .toFixed(1)
        .replace(".", ",")} % over 3-måneders snitt i ${top.category}.`,
      severity: "info",
    });
  }

  const belowAverageCategories = categoryTrend
    .filter(
      (item) =>
        item.threeMonthAverage > 0 &&
        item.vsAverageAmount < 0 &&
        item.vsAveragePercent !== null &&
        item.vsAveragePercent < -20
    )
    .sort((a, b) => a.vsAverageAmount - b.vsAverageAmount);

  if (belowAverageCategories.length > 0) {
    const top = belowAverageCategories[0];
    insights.push({
      title: `${top.category} under snitt`,
      description: `Du ligger ${Math.abs(top.vsAveragePercent ?? 0)
        .toFixed(1)
        .replace(".", ",")} % under 3-måneders snitt i ${top.category}.`,
      severity: "positive",
    });
  }

  const uniqueInsights = new Map<string, SmartInsight>();

  for (const insight of insights) {
    uniqueInsights.set(insight.title, insight);
  }

  return Array.from(uniqueInsights.values()).slice(0, 6);
}

export function generateRecommendations(
  trend: TrendPoint[],
  categoryTrend: CategoryTrendItem[],
  financialScore: FinancialScore
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (trend.length === 0) {
    return recommendations;
  }

  const latest = trend[trend.length - 1];

  const topOverAverage = categoryTrend
    .filter(
      (item) =>
        item.currentTotal > 0 &&
        item.threeMonthAverage > 0 &&
        item.vsAverageAmount > 0 &&
        item.vsAveragePercent !== null &&
        item.vsAveragePercent > 20
    )
    .sort((a, b) => b.vsAverageAmount - a.vsAverageAmount)[0];

  if (topOverAverage) {
    const suggestedCut = Math.min(
      Math.round(topOverAverage.vsAverageAmount),
      Math.round(topOverAverage.currentTotal * 0.2)
    );

    recommendations.push({
      title: `Kutt litt i ${topOverAverage.category}`,
      description: `Forbruket i ${topOverAverage.category} ligger over normalen din. Et realistisk mål er å redusere med ca. ${suggestedCut.toLocaleString(
        "no-NO"
      )} kr neste måned.`,
      impactLabel: `Mulig effekt: +${suggestedCut.toLocaleString("no-NO")} kr spart`,
      severity: "warning",
    });
  }

  if (latest.savingsRate < 20) {
    const targetRate = 20;
    const targetSavings = (latest.totalIncome * targetRate) / 100;
    const gap = Math.max(0, Math.round(targetSavings - latest.netSavings));

    recommendations.push({
      title: "Løft sparingsgraden mot 20 %",
      description: `Sparingsgraden din er ${latest.savingsRate
        .toFixed(1)
        .replace(".", ",")} %. Prøv å flytte rundt ${gap.toLocaleString(
        "no-NO"
      )} kr fra forbruk til sparing neste måned for å nå 20 %.`,
      impactLabel: `Mål: ${targetRate} % sparingsgrad`,
      severity: "info",
    });
  }

  const topExpenseCategory = categoryTrend
    .filter((item) => item.currentTotal > 0)
    .sort((a, b) => b.currentTotal - a.currentTotal)[0];

  if (topExpenseCategory) {
    const fivePercent = Math.max(100, Math.round(topExpenseCategory.currentTotal * 0.05));

    recommendations.push({
      title: `Test et lite trekk i ${topExpenseCategory.category}`,
      description: `${topExpenseCategory.category} er blant de største kostnadene dine. Et lite kutt på rundt ${fivePercent.toLocaleString(
        "no-NO"
      )} kr er ofte lettere å få til enn et stort mål.`,
      impactLabel: `Lav terskel, rask effekt`,
      severity: "info",
    });
  }

  if (financialScore.score >= 75) {
    recommendations.push({
      title: "Behold nivået",
      description:
        "Økonomien din ser sterk ut. Det viktigste nå er å holde den gode strukturen stabil neste måned også.",
      impactLabel: `Fokus: stabilitet`,
      severity: "positive",
    });
  } else if (financialScore.score < 50) {
    recommendations.push({
      title: "Prioriter én enkel forbedring",
      description:
        "Velg én kategori å følge ekstra tett neste måned i stedet for å prøve å kutte overalt samtidig.",
      impactLabel: `Fokus: enklere gjennomføring`,
      severity: "warning",
    });
  }

  const unique = new Map<string, Recommendation>();
  for (const item of recommendations) {
    unique.set(item.title, item);
  }

  return Array.from(unique.values()).slice(0, 4);
}

export function generateMonthlyNarrative(
  input: MonthlyNarrativeInput
): MonthlyNarrative {
  const {
    monthLabel,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    topCategory,
    comparison,
    financialScore,
    recommendations,
  } = input;

  const bullets: string[] = [];

  bullets.push(
    `Inntektene endte på ${formatCurrency(totalIncome)}, mens utgiftene endte på ${formatCurrency(totalExpenses)}.`
  );
  bullets.push(
    `Netto spart denne måneden var ${formatCurrency(netSavings)}, som tilsvarer en sparingsgrad på ${formatPercent(
      savingsRate
    )}.`
  );

  if (topCategory) {
    bullets.push(
      `Største utgiftskategori var ${topCategory.category} med ${formatCurrency(topCategory.total)}.`
    );
  }

  if (
    comparison?.expenseChangeAmount !== null &&
    comparison?.expenseChangePercent !== null
  ) {
    if (comparison.expenseChangeAmount > 0) {
      bullets.push(
        `Utgiftene økte med ${formatCurrency(
          Math.abs(comparison.expenseChangeAmount)
        )} (${formatPercent(Math.abs(comparison.expenseChangePercent))}) sammenlignet med forrige måned.`
      );
    } else if (comparison.expenseChangeAmount < 0) {
      bullets.push(
        `Utgiftene falt med ${formatCurrency(
          Math.abs(comparison.expenseChangeAmount)
        )} (${formatPercent(Math.abs(comparison.expenseChangePercent))}) sammenlignet med forrige måned.`
      );
    }
  }

  const intro = `${monthLabel} ble vurdert som en ${financialScore.label.toLowerCase()} måned med en økonomiscore på ${financialScore.score}/100. ${financialScore.summary}`;

  const closing =
    recommendations.length > 0
      ? `Neste beste steg er å starte med: ${recommendations[0].title.toLowerCase()}.`
      : "Neste steg er å holde strukturen stabil og følge utviklingen videre.";

  const emailLines = [
    `${monthLabel} – månedsoppsummering`,
    "",
    intro,
    "",
    ...bullets.map((bullet) => `• ${bullet}`),
    "",
    closing,
  ];

  return {
    title: `${monthLabel} – oppsummering`,
    intro,
    bullets,
    closing,
    emailText: emailLines.join("\n"),
  };
}