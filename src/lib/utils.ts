export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function extractJsonFromMessage(text: string): Record<string, unknown> | null {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      return null;
    }
  }
  // Try parsing the entire text as JSON
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
