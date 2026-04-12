import { SupabaseClient } from "@supabase/supabase-js";
import { getWeekStart } from "./utils";

const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export async function addToNextMealSlot(
  supabase: SupabaseClient,
  userId: string,
  recipeId: string
): Promise<{ added: boolean; full: boolean; slot?: { meal_type: string; day_of_week: number } }> {
  const weekStart = getWeekStart();

  // Get existing meal plan items for this week
  const { data: existing } = await supabase
    .from("meal_plan_items")
    .select("meal_type, day_of_week")
    .eq("user_id", userId)
    .eq("week_start", weekStart);

  const filledSlots = new Set(
    (existing || []).map((item) => `${item.day_of_week}-${item.meal_type}`)
  );

  // Find the next empty slot (iterate days first, then meal types)
  for (const day of DAYS) {
    for (const mealType of MEAL_TYPES) {
      const key = `${day}-${mealType}`;
      if (!filledSlots.has(key)) {
        await supabase.from("meal_plan_items").insert({
          user_id: userId,
          recipe_id: recipeId,
          week_start: weekStart,
          meal_type: mealType,
          day_of_week: day,
        });
        return { added: true, full: false, slot: { meal_type: mealType, day_of_week: day } };
      }
    }
  }

  // All 21 slots full
  return { added: false, full: true };
}
