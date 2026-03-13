export function categorizeTransaction(description: string, amount: number) {
  const text = description.toLowerCase();

  if (amount > 0) {
    if (
      text.includes("lønn") ||
      text.includes("salary") ||
      text.includes("payroll")
    ) {
      return "Lønn";
    }

    return "Annet";
  }

  if (
    text.includes("rema") ||
    text.includes("kiwi") ||
    text.includes("coop") ||
    text.includes("meny")
  ) {
    return "Dagligvarer";
  }

  if (
    text.includes("spotify") ||
    text.includes("netflix") ||
    text.includes("youtube")
  ) {
    return "Abonnement";
  }

  if (
    text.includes("ruter") ||
    text.includes("vy") ||
    text.includes("flytoget")
  ) {
    return "Transport";
  }

  if (
    text.includes("foodora") ||
    text.includes("wolt") ||
    text.includes("espresso")
  ) {
    return "Restaurant";
  }

  if (
    text.includes("tibber") ||
    text.includes("fjordkraft") ||
    text.includes("strøm")
  ) {
    return "Strøm";
  }

  return "Annet";
}