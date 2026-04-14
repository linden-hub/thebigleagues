import { geminiModelJSON, geminiModelJSONFallback } from "@/lib/gemini";
import { buildRecipeGenerationPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { GeneratedRecipe } from "@/lib/types";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch swipe history for personalization (optimized: single batched query)
  const { data: swipes } = await supabase
    .from("swipes")
    .select("direction, recipe_id")
    .eq("user_id", user.id);

  let swipeHistory: { liked: string[]; disliked: string[] } | undefined;

  if (swipes && swipes.length > 0) {
    const likedIds = swipes
      .filter((s) => s.direction === "right")
      .map((s) => s.recipe_id);
    const dislikedIds = swipes
      .filter((s) => s.direction === "left")
      .map((s) => s.recipe_id);

    // Get recipe titles for context (single batched query)
    const allIds = [...new Set([...likedIds, ...dislikedIds])];
    const { data: allRecipes } = allIds.length > 0
      ? await supabase
          .from("recipes")
          .select("id, title, cuisine")
          .in("id", allIds)
      : { data: [] };

    const recipeMap = (allRecipes || []).reduce(
      (acc, r) => {
        acc[r.id] = `${r.title} (${r.cuisine})`;
        return acc;
      },
      {} as Record<string, string>
    );

    swipeHistory = {
      liked: likedIds.map((id) => recipeMap[id]).filter(Boolean),
      disliked: dislikedIds.map((id) => recipeMap[id]).filter(Boolean),
    };
  }

  // Generate recipes with Gemini (with retry for 503 errors)
  const prompt = buildRecipeGenerationPrompt(profile, swipeHistory);

  try {
    let text: string = "";

    const models = [geminiModelJSON, geminiModelJSONFallback];
    let lastError: unknown;

    for (const model of models) {
      try {
        // Single attempt per model with quick fallback
        const result = await model.generateContent(prompt);
        text = result.response.text();
        break;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isRetryable = msg.includes("503") || msg.includes("Service Unavailable") || msg.includes("overloaded") || msg.includes("429");
        if (!isRetryable) throw err;
        console.warn(`Model failed, trying fallback...`, msg);
        // Continue to next model
      }
    }
    // All models exhausted
    if (!text) throw lastError;
    const recipes: GeneratedRecipe[] = JSON.parse(text);

    // Generate a batch ID
    const batchId = crypto.randomUUID();

    // Save all recipes to Supabase
    const recipesToInsert = recipes.map((recipe) => ({
      user_id: user.id,
      title: recipe.title,
      description: recipe.description,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      cost_per_serving: recipe.cost_per_serving,
      batch_id: batchId,
    }));

    const { data: insertedRecipes, error } = await supabase
      .from("recipes")
      .insert(recipesToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ recipes: insertedRecipes, batchId });
  } catch (error) {
    console.error("Recipe generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recipes" },
      { status: 500 }
    );
  }
}
