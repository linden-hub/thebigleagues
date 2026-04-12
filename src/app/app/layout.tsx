"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, SwatchBook, CalendarDays, ShoppingCart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "Discover", icon: SwatchBook },
  { href: "/app/plan", label: "Meal Plan", icon: CalendarDays },
  { href: "/app/shopping-list", label: "Shopping", icon: ShoppingCart },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav - desktop */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-gray-900">PrepDeck</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
                  isActive ? "text-emerald-600" : "text-gray-400"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
