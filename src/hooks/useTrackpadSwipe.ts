"use client";

import { useEffect, useRef } from "react";
import { animate } from "framer-motion";
import type { MotionValue } from "framer-motion";

interface UseTrackpadSwipeOptions {
  x: MotionValue<number>;
  enabled: boolean;
  onSwipe: (direction: "left" | "right") => void;
  threshold?: number;
  sensitivity?: number;
  debounceMs?: number;
}

export function useTrackpadSwipe({
  x,
  enabled,
  onSwipe,
  threshold = 100,
  sensitivity = 1.5,
  debounceMs = 150,
}: UseTrackpadSwipeOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const accumulatedDelta = useRef(0);
  const isGesturing = useRef(false);
  const gestureEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    function handleGestureEnd() {
      const delta = accumulatedDelta.current;
      if (Math.abs(delta) > threshold) {
        onSwipe(delta > 0 ? "right" : "left");
      } else {
        animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
      }
      accumulatedDelta.current = 0;
      isGesturing.current = false;
    }

    function handleWheel(e: WheelEvent) {
      if (!isGesturing.current) {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        isGesturing.current = true;
      }

      e.preventDefault();

      accumulatedDelta.current += -e.deltaX * sensitivity;
      x.set(accumulatedDelta.current);

      if (gestureEndTimer.current) {
        clearTimeout(gestureEndTimer.current);
      }
      gestureEndTimer.current = setTimeout(handleGestureEnd, debounceMs);
    }

    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (gestureEndTimer.current) {
        clearTimeout(gestureEndTimer.current);
      }
      accumulatedDelta.current = 0;
      isGesturing.current = false;
    };
  }, [enabled, x, onSwipe, threshold, sensitivity, debounceMs]);

  return { ref };
}
