"use client";

import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { Button } from "@/components/ui/Button";
import { useRecipes } from "@/hooks/useRecipes";
import { X, Heart, Loader2, RefreshCw, AlertCircle } from "lucide-react";

export function SwipeDeck() {
  const { recipes, loading, generating, error, handleSwipe, generateBatch } =
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

  if (error && recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <div className="text-center">
          <p className="text-gray-700 font-medium">Couldn&apos;t generate recipes</p>
          <p className="text-sm text-gray-500 mt-1">
            The AI service is temporarily overloaded. This usually resolves in a few seconds.
          </p>
        </div>
        <Button onClick={generateBatch} loading={generating}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
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
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Card stack */}
      <div className="relative w-full max-w-sm md:max-w-4xl h-[540px] mx-4">
        <AnimatePresence>
          {nextRecipe && (
            <motion.div
              key={`bg-${nextRecipe.id}`}
              className="absolute inset-0"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 0.95, y: 10 }}
              exit={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ zIndex: 0 }}
            >
              <SwipeCard
                key={nextRecipe.id}
                recipe={nextRecipe}
                onSwipe={() => {}}
                isTop={false}
              />
            </motion.div>
          )}
          {topRecipe && (
            <motion.div
              key={`top-${topRecipe.id}`}
              className="absolute inset-0"
              initial={{ scale: 1, y: 0 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ zIndex: 10 }}
            >
              <SwipeCard
                key={topRecipe.id}
                recipe={topRecipe}
                onSwipe={onSwipe}
                isTop={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-5">
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => onSwipe("left")}
            aria-label="Skip recipe"
            className="w-16 h-16 rounded-full bg-white shadow-lg shadow-red-100 flex items-center justify-center text-red-500 hover:bg-red-50 active:scale-95 transition-all"
          >
            <X className="h-7 w-7" />
          </button>
          <span className="hidden md:block text-xs text-gray-400">
            &larr; Skip
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => onSwipe("right")}
            aria-label="Add recipe to meal plan"
            className="w-16 h-16 rounded-full bg-white shadow-lg shadow-emerald-100 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 active:scale-95 transition-all"
          >
            <Heart className="h-7 w-7" />
          </button>
          <span className="hidden md:block text-xs text-gray-400">
            Add &rarr;
          </span>
        </div>
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
