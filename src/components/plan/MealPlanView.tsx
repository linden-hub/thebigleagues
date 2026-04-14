"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RecipeDetailModal } from "@/components/plan/RecipeDetailModal";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  CalendarDays,
} from "lucide-react";
import type { MealPlanItem, Recipe } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export function MealPlanView() {
  const supabase = createClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [items, setItems] = useState<MealPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const weekStart = getWeekStartWithOffset(weekOffset);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("meal_plan_items")
      .select("*, recipe:recipes(*)")
      .eq("user_id", user.id)
      .eq("week_start", weekStart);

    setItems((data as MealPlanItem[]) || []);
    setLoading(false);
  }, [supabase, weekStart]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  async function removeItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await supabase.from("meal_plan_items").delete().eq("id", itemId);
  }

  function handleRecipeClick(recipe: Recipe) {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  }

  function handleModalClose() {
    setIsModalOpen(false);
    setTimeout(() => setSelectedRecipe(null), 300);
  }

  async function handleRecipeRemove(recipeId: string) {
    const itemToRemove = items.find((i) => i.recipe_id === recipeId);
    if (itemToRemove) {
      await removeItem(itemToRemove.id);
      handleModalClose();
    }
  }

  // Calculate avgs
  const avgs = items.reduce(
    (acc, item) => {
      if (item.recipe) {
        acc.calories += item.recipe.calories || 0;
        acc.protein += item.recipe.protein || 0;
        acc.carbs += item.recipe.carbs || 0;
        acc.fat += item.recipe.fat || 0;
        acc.cost += item.recipe.cost_per_serving || 0;
      }
      return acc; // Average per meal
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 }
  );

  return (
    <div className="pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Plan</h1>
          <p className="text-sm text-gray-500">
            Week of {formatWeekDate(weekStart)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset((o) => o - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setWeekOffset(0)}
          >
            This Week
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset((o) => o + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-400">Meals</div>
            <div className="font-bold text-gray-900">
              {items.length} / 21
            </div>
          </div>
          <div>
            <div className="text-gray-400">Calories</div>
            <div className="font-bold text-gray-900">
              {avgs.calories.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Protein</div>
            <div className="font-bold text-gray-900">{avgs.protein}g</div>
          </div>
          <div>
            <div className="text-gray-400">Carbs</div>
            <div className="font-bold text-gray-900">{avgs.carbs}g</div>
          </div>
          <div>
            <div className="text-gray-400">Est. Cost</div>
            <div className="font-bold text-gray-900">
              {formatCurrency(avgs.cost)}
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop grid */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-20" />
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className="px-2 py-2 text-xs font-medium text-gray-500 text-center"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEAL_TYPES.map((mealType) => (
                  <tr key={mealType}>
                    <td className="pr-3 py-2 text-xs font-medium text-gray-500 align-top">
                      {MEAL_LABELS[mealType]}
                    </td>
                    {DAYS.map((_, dayIdx) => {
                      const item = items.find(
                        (i) =>
                          i.day_of_week === dayIdx && i.meal_type === mealType
                      );
                      return (
                        <td key={dayIdx} className="px-1 py-1">
                          {item?.recipe ? (
                            <div className="bg-white border border-gray-200 rounded-xl p-2 text-xs group relative cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all"
                              onClick={() => handleRecipeClick(item.recipe!)}>
                              <div className="font-medium text-gray-900 truncate">
                                {item.recipe.title}
                              </div>
                              <div className="text-gray-400 mt-0.5">
                                {item.recipe.calories} cal
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeItem(item.id);
                                }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="h-16 border border-dashed border-gray-200 rounded-xl" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden space-y-4">
            {DAYS.map((day, dayIdx) => {
              const dayItems = items.filter((i) => i.day_of_week === dayIdx);
              return (
                <div key={day}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {day}
                  </h3>
                  {dayItems.length > 0 ? (
                    <div className="space-y-2">
                      {dayItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all" onClick={() => item.recipe && handleRecipeClick(item.recipe)}>
                          <div>
                            <div className="text-xs text-gray-400 uppercase">
                              {item.meal_type}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.recipe?.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.recipe?.calories} cal ·{" "}
                              {item.recipe?.protein}g protein
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                            className="p-2 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-300 text-sm py-2">
                      <CalendarDays className="h-4 w-4" />
                      No meals planned
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      <RecipeDetailModal
        isOpen={isModalOpen}
        recipe={selectedRecipe}
        onClose={handleModalClose}
        onRemove={handleRecipeRemove}
      />
    </div>
  );
}

function getWeekStartWithOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  return getWeekStart(d);
}

function formatWeekDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
