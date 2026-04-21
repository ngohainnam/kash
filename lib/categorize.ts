export type Category =
  | "Food"
  | "Transport"
  | "Bills"
  | "Entertainment"
  | "Shopping"
  | "Health"
  | "Income"
  | "Education"
  | "Travel"
  | "Subscriptions"
  | "Transfers"
  | "Other";

/**
 * Normalize description for consistent matching
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // remove symbols
    .replace(/\s+/g, " ") // collapse spaces
    .trim();
}

/**
 * Strong keyword groups (cleaned + less noisy)
 * Each keyword is intentionally short and high-signal
 */
const RULES: Record<Exclude<Category, "Other">, string[]> = {
  Income: [
    "salary",
    "payroll",
    "wage",
    "bonus",
    "freelance",
    "invoice",
    "dividend",
    "interest",
    "refund",
    "cashback",
    "gift",
  ],

  Food: [
    "restaurant",
    "cafe",
    "coffee",
    "mcdonald",
    "kfc",
    "burger",
    "pizza",
    "sushi",
    "ubereats",
    "doordash",
    "supermarket",
    "coles",
    "woolworths",
    "aldi",
  ],

  Transport: [
    "uber",
    "taxi",
    "train",
    "bus",
    "tram",
    "petrol",
    "fuel",
    "toll",
    "parking",
    "myki",
  ],

  Bills: [
    "electricity",
    "water",
    "gas",
    "internet",
    "wifi",
    "broadband",
    "phone",
    "mobile",
    "insurance",
    "rent",
    "mortgage",
  ],

  Entertainment: [
    "netflix",
    "spotify",
    "youtube",
    "movie",
    "cinema",
    "concert",
    "game",
    "steam",
    "playstation",
    "ticket",
  ],

  Shopping: [
    "amazon",
    "ebay",
    "store",
    "clothing",
    "fashion",
    "uniqlo",
    "zara",
    "electronics",
    "jbhi",
    "ikea",
    "apple",
  ],

  Health: [
    "pharmacy",
    "doctor",
    "clinic",
    "hospital",
    "dentist",
    "gym",
    "fitness",
    "supplement",
  ],

  Education: [
    "course",
    "tuition",
    "school",
    "udemy",
    "coursera",
    "book",
  ],

  Travel: [
    "flight",
    "airline",
    "hotel",
    "booking",
    "airbnb",
    "travel",
  ],

  Subscriptions: [
    "subscription",
    "membership",
  ],

  Transfers: [
    "banktransfer",
    "withdrawal",
    "deposit",
  ],
};

/**
 * Fast rule-based categorizer
 */
export function categorizeTransaction(
  description: string,
  amount: number
): Category {
  const text = normalize(description);

  // 1. Income override (fast path)
  if (amount > 0) return "Income";

  // 2. Hard overrides (high priority exceptions)
  if (text.includes("refund")) return "Income";
  if (text.includes("apple store")) return "Shopping";
  if (text.includes("app store") || text.includes("itunes")) return "Entertainment";

  // 3. Category matching (deterministic scan)
  for (const category of Object.keys(RULES) as (keyof typeof RULES)[]) {
    const keywords = RULES[category];

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category;
      }
    }
  }

  return "Other";
}

/**
 * Batch categorization
 */
export function categorizeTransactions<
  T extends { description: string; amount: number }
>(
  transactions: T[]
): (T & { category: Category })[] {
  return transactions.map((tx) => ({
    ...tx,
    category: categorizeTransaction(tx.description, tx.amount),
  }));
}