"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Clock, Flame, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface SwipeCardProps {
  recipe: Recipe;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

export function SwipeCard({ recipe, onSwipe, isTop }: SwipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  function handleDragEnd(
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } }
  ) {
    const threshold = 100;
    if (info.offset.x > threshold || info.velocity.x > 500) {
      onSwipe("right");
    } else if (info.offset.x < -threshold || info.velocity.x < -500) {
      onSwipe("left");
    }
  }

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
      exit={{ x: x.get() > 0 ? 300 : -300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden h-full flex flex-col cursor-grab">
        {/* Swipe overlays */}
        <motion.div
          className="absolute inset-0 bg-emerald-500/20 rounded-3xl z-10 flex items-center justify-center pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <div className="bg-emerald-500 text-white px-6 py-2 rounded-xl text-2xl font-bold rotate-[-15deg]">
            ADD
          </div>
        </motion.div>
        <motion.div
          className="absolute inset-0 bg-red-500/20 rounded-3xl z-10 flex items-center justify-center pointer-events-none"
          style={{ opacity: skipOpacity }}
        >
          <div className="bg-red-500 text-white px-6 py-2 rounded-xl text-2xl font-bold rotate-[15deg]">
            SKIP
          </div>
        </motion.div>

        {/* Recipe header */}
        <div className="p-6 flex-shrink-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {recipe.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
              {recipe.cuisine}
            </span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
              {recipe.difficulty}
            </span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 px-6 pb-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{recipe.prep_time + recipe.cook_time}m</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Flame className="h-4 w-4 text-gray-400" />
            <span>{recipe.calories} cal</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span>{formatCurrency(recipe.cost_per_serving)}</span>
          </div>
        </div>

        {/* Macros bar */}
        <div className="px-6 pb-4">
          <div className="flex gap-4 text-xs">
            <div className="flex-1 text-center">
              <div className="font-semibold text-gray-900">{recipe.protein}g</div>
              <div className="text-gray-400">Protein</div>
            </div>
            <div className="flex-1 text-center">
              <div className="font-semibold text-gray-900">{recipe.carbs}g</div>
              <div className="text-gray-400">Carbs</div>
            </div>
            <div className="flex-1 text-center">
              <div className="font-semibold text-gray-900">{recipe.fat}g</div>
              <div className="text-gray-400">Fat</div>
            </div>
            <div className="flex-1 text-center">
              <div className="font-semibold text-gray-900">{recipe.servings}</div>
              <div className="text-gray-400">Servings</div>
            </div>
          </div>
        </div>

        {/* Expandable details */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-emerald-600 font-medium mb-2"
          >
            {expanded ? (
              <>
                Hide details <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                View full recipe <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>

          {expanded && (
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Ingredients
                </h4>
                <ul className="space-y-1">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="text-gray-600">
                      {ing.amount} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Instructions
                </h4>
                <ol className="space-y-2">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="text-gray-600">
                      <span className="font-medium text-gray-800">
                        {i + 1}.
                      </span>{" "}
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
