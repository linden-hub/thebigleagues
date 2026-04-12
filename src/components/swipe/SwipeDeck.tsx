"use client";

import { useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { Button } from "@/components/ui/Button";
import { useRecipes } from "@/hooks/useRecipes";
import { X, Heart, Loader2, RefreshCw } from "lucide-react";

export function SwipeDeck() {
  const { recipes, loading, generating, handleSwipe, generateBatch } =
    useRecipes();

  const topRecipe = recipes[0];
  const nextRecipe = recipes[1];

  const onSwipe = useCallback(
    (direction: "left" | "right") => {
      if (topRecipe) {
        handleSwipe(topRecipe.id, direction);
      }
    },
    [topRecipe, handleSwipe]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") onSwipe("left");
      if (e.key === "ArrowRight") onSwipe("right");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSwipe]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        <p className="text-gray-500">Loading your recipes...</p>
      </div>
    );
  }

  if (generating && recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        <p className="text-gray-500 text-center">
          Creating personalized recipes for you...
          <br />
          <span className="text-xs text-gray-400">
            This takes about 10-15 seconds
          </span>
        </p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-gray-500">No more recipes to show!</p>
        <Button onClick={generateBatch} loading={generating}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate more recipes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card stack */}
      <div className="relative w-full max-w-sm h-[520px]">
        <AnimatePresence>
          {nextRecipe && (
            <SwipeCard
              key={nextRecipe.id}
              recipe={nextRecipe}
              onSwipe={() => {}}
              isTop={false}
            />
          )}
          {topRecipe && (
            <SwipeCard
              key={topRecipe.id}
              recipe={topRecipe}
              onSwipe={onSwipe}
              isTop={true}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => onSwipe("left")}
          className="w-14 h-14 rounded-full border-2 border-red-300 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          onClick={() => onSwipe("right")}
          className="w-14 h-14 rounded-full border-2 border-emerald-300 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-colors"
        >
          <Heart className="h-6 w-6" />
        </button>
      </div>

      {/* Generating indicator */}
      {generating && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading more recipes...
        </p>
      )}
    </div>
  );
}
