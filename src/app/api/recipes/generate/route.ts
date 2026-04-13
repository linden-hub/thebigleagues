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

  // Fetch swipe history for personalization
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

    // Get recipe titles for context
    const { data: likedRecipes } = await supabase
      .from("recipes")
      .select("title, cuisine")
      .in("id", likedIds.length > 0 ? likedIds : ["none"]);

    const { data: dislikedRecipes } = await supabase
      .from("recipes")
      .select("title, cuisine")
      .in("id", dislikedIds.length > 0 ? dislikedIds : ["none"]);

    swipeHistory = {
      liked: (likedRecipes || []).map((r) => `${r.title} (${r.cuisine})`),
      disliked: (dislikedRecipes || []).map(
        (r) => `${r.title} (${r.cuisine})`
      ),
    };
  }

  // Generate recipes with Gemini (with retry for 503 errors)
  const prompt = buildRecipeGenerationPrompt(profile, swipeHistory);

  try {
    let text: string;

    const models = [geminiModelJSON, geminiModelJSONFallback];
    const maxRetries = 3;
    let lastError: unknown;

    outer: {
      for (const model of models) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const result = await model.generateContent(prompt);
            text = result.response.text();
            break outer;
          } catch (err) {
            lastError = err;
            const msg = err instanceof Error ? err.message : String(err);
            const isRetryable = msg.includes("503") || msg.includes("Service Unavailable") || msg.includes("overloaded") || msg.includes("429");
            if (!isRetryable) throw err;
            console.warn(`Model attempt ${attempt + 1} failed (retryable), waiting before retry...`);
            if (attempt < maxRetries - 1) {
              await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
            }
          }
        }
      }
      // All retries exhausted
      throw lastError;
    }
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
