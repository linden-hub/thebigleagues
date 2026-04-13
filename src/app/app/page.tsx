export const dynamic = "force-dynamic";

import { SwipeDeck } from "@/components/swipe/SwipeDeck";

export default function DiscoverPage() {
  return (
    <div className="flex flex-col items-center pt-2 pb-20 md:pb-4 px-4">
      <SwipeDeck />
    </div>
  );
}
