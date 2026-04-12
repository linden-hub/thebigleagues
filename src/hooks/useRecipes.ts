"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Recipe } from "@/lib/types";

export function useRecipes() {
  const supabase = createClient();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [totalSwiped, setTotalSwiped] = useState(0);

  // Fetch unswiped recipes
  const fetchRecipes = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get IDs of already-swiped recipes
    const { data: swipes } = await supabase
      .from("swipes")
      .select("recipe_id")
      .eq("user_id", user.id);

    const swipedIds = (swipes || []).map((s) => s.recipe_id);
    setTotalSwiped(swipedIds.length);

    // Get unswiped recipes
    let query = supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (swipedIds.length > 0) {
      query = query.not("id", "in", `(${swipedIds.join(",")})`);
    }

    const { data } = await query;
    setRecipes(data || []);
    setLoading(false);

    // If no recipes exist at all, generate first batch
    if ((data || []).length === 0 && swipedIds.length === 0) {
      await generateBatch();
    }
  }, [supabase]);

  // Generate a new batch
  const generateBatch = useCallback(async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/recipes/generate", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Generation failed");
      const { recipes: newRecipes } = await response.json();
      setRecipes((prev) => [...prev, ...newRecipes]);
    } catch (error) {
      console.error("Failed to generate recipes:", error);
    } finally {
      setGenerating(false);
    }
  }, []);

  // Handle swipe
  const handleSwipe = useCallback(
    async (recipeId: string, direction: "left" | "right") => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Optimistic: remove from deck
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setTotalSwiped((prev) => prev + 1);

      // Save swipe
      await supabase.from("swipes").insert({
        user_id: user.id,
        recipe_id: recipeId,
        direction,
      });

      // If swiped right, add to meal plan
      if (direction === "right") {
        const { addToNextMealSlot } = await import("@/lib/meal-plan");
        await addToNextMealSlot(supabase, user.id, recipeId);
      }

      // Pre-fetch: if 3 or fewer recipes left, generate more
      const remaining = recipes.length - 1;
      if (remaining <= 3 && !generating) {
        generateBatch();
      }
    },
    [supabase, recipes.length, generating, generateBatch]
  );

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return {
    recipes,
    loading,
    generating,
    totalSwiped,
    handleSwipe,
    generateBatch,
    refetch: fetchRecipes,
  };
}
