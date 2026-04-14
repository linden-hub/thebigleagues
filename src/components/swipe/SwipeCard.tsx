"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { Clock, Flame, DollarSign, Users, ListChecks } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useTrackpadSwipe } from "@/hooks/useTrackpadSwipe";

interface CuisineTheme {
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  accentBg: string;
  accentText: string;
}

const CUISINE_THEMES: Record<string, CuisineTheme> = {
  thai: {
    emoji: "\u{1F35C}",
    gradientFrom: "#fbbf24",
    gradientTo: "#f97316",
    accentBg: "bg-amber-50",
    accentText: "text-amber-700",
  },
  italian: {
    emoji: "\u{1F35D}",
    gradientFrom: "#f87171",
    gradientTo: "#f43f5e",
    accentBg: "bg-rose-50",
    accentText: "text-rose-700",
  },
  mexican: {
    emoji: "\u{1F32E}",
    gradientFrom: "#a3e635",
    gradientTo: "#10b981",
    accentBg: "bg-lime-50",
    accentText: "text-lime-700",
  },
  japanese: {
    emoji: "\u{1F371}",
    gradientFrom: "#f472b6",
    gradientTo: "#d946ef",
    accentBg: "bg-pink-50",
    accentText: "text-pink-700",
  },
  indian: {
    emoji: "\u{1F35B}",
    gradientFrom: "#facc15",
    gradientTo: "#f97316",
    accentBg: "bg-yellow-50",
    accentText: "text-yellow-700",
  },
  chinese: {
    emoji: "\u{1F961}",
    gradientFrom: "#ef4444",
    gradientTo: "#fbbf24",
    accentBg: "bg-red-50",
    accentText: "text-red-700",
  },
  mediterranean: {
    emoji: "\u{1FAD2}",
    gradientFrom: "#38bdf8",
    gradientTo: "#3b82f6",
    accentBg: "bg-sky-50",
    accentText: "text-sky-700",
  },
  korean: {
    emoji: "\u{1F958}",
    gradientFrom: "#fb7185",
    gradientTo: "#ef4444",
    accentBg: "bg-rose-50",
    accentText: "text-rose-700",
  },
  american: {
    emoji: "\u{1F354}",
    gradientFrom: "#60a5fa",
    gradientTo: "#6366f1",
    accentBg: "bg-blue-50",
    accentText: "text-blue-700",
  },
  french: {
    emoji: "\u{1F950}",
    gradientFrom: "#a78bfa",
    gradientTo: "#a855f7",
    accentBg: "bg-violet-50",
    accentText: "text-violet-700",
  },
  vietnamese: {
    emoji: "\u{1F372}",
    gradientFrom: "#2dd4bf",
    gradientTo: "#06b6d4",
    accentBg: "bg-teal-50",
    accentText: "text-teal-700",
  },
  greek: {
    emoji: "\u{1F957}",
    gradientFrom: "#22d3ee",
    gradientTo: "#3b82f6",
    accentBg: "bg-cyan-50",
    accentText: "text-cyan-700",
  },
};

const DEFAULT_THEME: CuisineTheme = {
  emoji: "\u{1F37D}\u{FE0F}",
  gradientFrom: "#34d399",
  gradientTo: "#14b8a6",
  accentBg: "bg-emerald-50",
  accentText: "text-emerald-700",
};

function getCuisineTheme(cuisine: string): CuisineTheme {
  const normalized = cuisine.toLowerCase().trim();
  for (const [key, theme] of Object.entries(CUISINE_THEMES)) {
    if (normalized.includes(key)) return theme;
  }
  return DEFAULT_THEME;
}

interface SwipeCardProps {
  recipe: Recipe;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

export function SwipeCard({ recipe, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  const { ref: cardRef } = useTrackpadSwipe({ x, enabled: isTop, onSwipe });

  const theme = getCuisineTheme(recipe.cuisine);

  const totalMacroCals =
    recipe.protein * 4 + recipe.carbs * 4 + recipe.fat * 9 || 1;
  const proteinPct = ((recipe.protein * 4) / totalMacroCals) * 100;
  const carbsPct = ((recipe.carbs * 4) / totalMacroCals) * 100;
  const fatPct = ((recipe.fat * 9) / totalMacroCals) * 100;

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
      ref={cardRef}
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
      <div className="rounded-3xl overflow-hidden h-full flex flex-col md:flex-row cursor-grab shadow-xl">
        {/* Swipe overlays */}
        <motion.div
          className="absolute inset-0 bg-emerald-500/20 rounded-3xl z-10 flex items-center justify-center pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <div className="bg-emerald-500 text-white px-8 py-3 rounded-xl text-3xl font-bold rotate-[-15deg]">
            ADD
          </div>
        </motion.div>
        <motion.div
          className="absolute inset-0 bg-red-500/20 rounded-3xl z-10 flex items-center justify-center pointer-events-none"
          style={{ opacity: skipOpacity }}
        >
          <div className="bg-red-500 text-white px-8 py-3 rounded-xl text-3xl font-bold rotate-[15deg]">
            SKIP
          </div>
        </motion.div>

        {/* Hero zone with gradient */}
        <div
          className="relative flex-shrink-0 h-[200px] md:h-full md:w-[280px] flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
          }}
        >
          {/* Difficulty badge */}
          <span className="absolute top-4 right-4 bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">
            {recipe.difficulty}
          </span>

          {/* Emoji circle */}
          <div className="bg-white/20 backdrop-blur-sm rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center text-5xl md:text-6xl">
            {theme.emoji}
          </div>

          {/* Title overlay at bottom of hero */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-5 pb-4 pt-10">
            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
              {recipe.title}
            </h2>
          </div>
        </div>

        {/* Content zone */}
        <div className="bg-white flex flex-col flex-1 px-5 pt-4 pb-5 md:overflow-y-auto md:py-5 md:px-6">
          {/* Description */}
          <p className="text-sm text-gray-500 line-clamp-2 md:line-clamp-none leading-relaxed">
            {recipe.description}
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {recipe.prep_time + recipe.cook_time} min
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5">
              <Flame className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {recipe.calories} cal
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {formatCurrency(recipe.cost_per_serving)}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5">
              <ListChecks className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {recipe.instructions.length} steps
              </span>
            </div>
          </div>

          {/* Macro bar */}
          <div className="mt-4">
            <div className="flex rounded-full h-2.5 overflow-hidden bg-gray-100">
              <div
                className="bg-emerald-400 transition-all"
                style={{ width: `${proteinPct}%` }}
              />
              <div
                className="bg-amber-400 transition-all"
                style={{ width: `${carbsPct}%` }}
              />
              <div
                className="bg-rose-400 transition-all"
                style={{ width: `${fatPct}%` }}
              />
            </div>
            <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />
                P: {recipe.protein}g
              </span>
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />
                C: {recipe.carbs}g
              </span>
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-rose-400 mr-1" />
                F: {recipe.fat}g
              </span>
            </div>
          </div>

          {/* Ingredients preview - desktop only */}
          {recipe.ingredients.length > 0 && (
            <div className="hidden md:block mt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Ingredients ({recipe.ingredients.length})
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {recipe.ingredients.map((ing, i) => (
                  <span key={i} className="text-xs text-gray-600 truncate">
                    <span className="text-gray-400">
                      {ing.amount}
                      {ing.unit ? ` ${ing.unit}` : ""}
                    </span>{" "}
                    {ing.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cuisine tag at bottom */}
          <div className="mt-auto pt-3 md:mt-4">
            <span
              className={`${theme.accentBg} ${theme.accentText} text-xs font-semibold px-3 py-1 rounded-full`}
            >
              {recipe.cuisine}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
