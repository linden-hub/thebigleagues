import { geminiModelJSON } from "@/lib/gemini";
import { buildShoppingListPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { weekStart: requestedWeek } = (await req.json().catch(() => ({}))) as {
    weekStart?: string;
  };
  const weekStart = requestedWeek || getWeekStart();

  // Get user profile for household size
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_size")
    .eq("id", user.id)
    .single();

  // Get all recipes in the meal plan for this week
  const { data: planItems } = await supabase
    .from("meal_plan_items")
    .select("recipe:recipes(*)")
    .eq("user_id", user.id)
    .eq("week_start", weekStart);

  if (!planItems || planItems.length === 0) {
    return NextResponse.json(
      { error: "No meals planned for this week" },
      { status: 400 }
    );
  }

  const recipes = planItems
    .map((item) => (item as unknown as { recipe: Record<string, unknown> }).recipe)
    .filter(Boolean);

  // Generate shopping list with Gemini
  const prompt = buildShoppingListPrompt(
    JSON.stringify(recipes, null, 2),
    profile?.household_size || 1
  );

  try {
    const result = await geminiModelJSON.generateContent(prompt);
    const text = result.response.text();
    const items: { ingredient_name: string; amount: string; category: string }[] =
      JSON.parse(text);

    // Clear existing shopping list for this week
    await supabase
      .from("shopping_list_items")
      .delete()
      .eq("user_id", user.id)
      .eq("week_start", weekStart);

    // Insert new items
    const itemsToInsert = items.map((item) => ({
      user_id: user.id,
      week_start: weekStart,
      ingredient_name: item.ingredient_name,
      amount: item.amount,
      category: item.category,
      checked: false,
    }));

    const { data: insertedItems, error } = await supabase
      .from("shopping_list_items")
      .insert(itemsToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ items: insertedItems });
  } catch (error) {
    console.error("Shopping list generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate shopping list" },
      { status: 500 }
    );
  }
}
