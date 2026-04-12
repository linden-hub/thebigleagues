export const dynamic = "force-dynamic";

import { SwipeDeck } from "@/components/swipe/SwipeDeck";

export default function DiscoverPage() {
  return (
    <div className="flex flex-col items-center py-4 pb-20 md:pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Discover</h1>
      <p className="text-sm text-gray-500 mb-6">
        Swipe right to add to your meal plan
      </p>
      <SwipeDeck />
    </div>
  );
}
