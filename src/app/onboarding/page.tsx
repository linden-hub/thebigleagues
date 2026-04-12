export const dynamic = "force-dynamic";

import { ChatWindow } from "@/components/onboarding/ChatWindow";
import { ChefHat } from "lucide-react";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <ChefHat className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-gray-900">PlateMate</span>
          <span className="text-gray-400 text-sm ml-2">
            Setting up your profile
          </span>
        </div>
      </header>
      <ChatWindow />
    </div>
  );
}
