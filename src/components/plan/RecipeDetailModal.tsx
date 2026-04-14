"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Recipe } from "@/lib/types";

interface RecipeDetailModalProps {
  isOpen: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onRemove: (recipeId: string) => Promise<void>;
}

const CUISINE_THEMES: Record<string, { emoji: string; color: string }> = {
  thai: { emoji: "🍜", color: "#fbbf24" },
  italian: { emoji: "🍝", color: "#f87171" },
  mexican: { emoji: "🌮", color: "#a3e635" },
  japanese: { emoji: "🍱", color: "#f472b6" },
  indian: { emoji: "🌶️", color: "#facc15" },
  chinese: { emoji: "🥡", color: "#ef4444" },
  mediterranean: { emoji: "🥗", color: "#38bdf8" },
  korean: { emoji: "🍗", color: "#fb7185" },
  american: { emoji: "🍔", color: "#60a5fa" },
  french: { emoji: "🥐", color: "#a78bfa" },
  vietnamese: { emoji: "🍲", color: "#2dd4bf" },
  greek: { emoji: "🥙", color: "#22d3ee" },
};

export function RecipeDetailModal({
  isOpen,
  recipe,
  onClose,
  onRemove,
}: RecipeDetailModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!recipe) return null;

  const theme = CUISINE_THEMES[recipe.cuisine.toLowerCase()] || {
    emoji: "🍽️",
    color: "#34d399",
  };

  const difficultyColor = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  }[recipe.difficulty.toLowerCase()] || "bg-gray-100 text-gray-700";

  const groceryCategories = recipe.ingredients.reduce(
    (acc, ing) => {
      const category = ing.category || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(ing);
      return acc;
    },
    {} as Record<string, typeof recipe.ingredients>
  );

  const categoryOrder = ["produce", "protein", "dairy", "frozen", "pantry", "other"];
  const sortedCategories = categoryOrder.filter((cat) => groceryCategories[cat]);

  async function handleRemove() {
    if (!recipe) return;
    if (
      window.confirm(
        `Remove "${recipe.title}" from your meal plan?`
      )
    ) {
      await onRemove(recipe.id);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
          >
            {/* Header with solid color */}
            <div
              className="relative h-32 flex items-end p-6 text-white"
              style={{
                backgroundColor: theme.color,
              }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <div className="text-4xl mb-2">{theme.emoji}</div>
                <h2 className="text-2xl font-bold">{recipe.title}</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">
                {recipe.description}
              </p>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-2">
                <div className={`${difficultyColor} px-3 py-1 rounded-full text-xs font-medium`}>
                  {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                </div>
                <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  {recipe.prep_time}m prep
                </div>
                <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  {recipe.cook_time}m cook
                </div>
                <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  {recipe.servings} servings
                </div>
              </div>

              {/* Nutrition macros */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Nutrition (per serving)</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {recipe.calories}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">cal</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {recipe.protein}g
                    </div>
                    <div className="text-xs text-gray-500 mt-1">protein</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {recipe.carbs}g
                    </div>
                    <div className="text-xs text-gray-500 mt-1">carbs</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {recipe.fat}g
                    </div>
                    <div className="text-xs text-gray-500 mt-1">fat</div>
                  </div>
                </div>
              </div>

              {/* Cost */}
              <div className="flex items-center justify-between py-2 border-t border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Cost per serving</span>
                <span className="text-lg font-bold text-gray-900">
                  ${recipe.cost_per_serving.toFixed(2)}
                </span>
              </div>

              {/* Ingredients */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Ingredients</h3>
                <div className="space-y-4">
                  {sortedCategories.map((category) => (
                    <div key={category}>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                        {category}
                      </h4>
                      <ul className="space-y-2">
                        {groceryCategories[category].map((ing, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-sm text-gray-700"
                          >
                            <div className="w-4 h-4 rounded border border-gray-300 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-medium">{ing.amount}</span>
                              {ing.unit && <span className="text-gray-500"> {ing.unit}</span>}
                              <span className="text-gray-600"> {ing.name}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Instructions</h3>
                <ol className="space-y-3">
                  {recipe.instructions.map((instruction, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3 text-sm text-gray-700"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-medium text-emerald-700">
                        {idx + 1}
                      </div>
                      <p className="flex-1 leading-relaxed pt-0.5">{instruction}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="danger"
                  onClick={handleRemove}
                  className="flex-1"
                >
                  Remove from Plan
                </Button>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
