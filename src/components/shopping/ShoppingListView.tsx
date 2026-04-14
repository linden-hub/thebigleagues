"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ShoppingCart,
  RefreshCw,
  Loader2,
  Check,
  MapPin,
  X,
} from "lucide-react";
import type { ShoppingListItem, Profile } from "@/lib/types";

const CATEGORY_ORDER = [
  "produce",
  "protein",
  "dairy",
  "pantry",
  "frozen",
  "other",
];
const CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  protein: "Protein & Meat",
  dairy: "Dairy & Eggs",
  pantry: "Pantry",
  frozen: "Frozen",
  other: "Other",
};

export function ShoppingListView() {
  const supabase = createClient();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const weekStart = getWeekStart();

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: listItems }, { data: profileData }] = await Promise.all([
      supabase
        .from("shopping_list_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .order("category", { ascending: true }),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);

    setItems((listItems as ShoppingListItem[]) || []);
    setProfile(profileData as Profile | null);
    setLoading(false);
  }, [supabase, weekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function generateList() {
    setGenerating(true);
    try {
      const response = await fetch("/api/shopping-list/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Failed to generate shopping list");
        return;
      }
      const { items: newItems } = await response.json();
      setItems(newItems);
    } catch (error) {
      console.error("Failed to generate shopping list:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function toggleItem(itemId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
    const item = items.find((i) => i.id === itemId);
    if (item) {
      await supabase
        .from("shopping_list_items")
        .update({ checked: !item.checked })
        .eq("id", itemId);
    }
  }

  async function deleteItem(itemId: string) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    await supabase.from("shopping_list_items").delete().eq("id", itemId);
  }

  // Group by category
  const grouped = CATEGORY_ORDER.reduce(
    (acc, category) => {
      const categoryItems = items.filter((i) => i.category === category);
      if (categoryItems.length > 0) {
        acc[category] = categoryItems;
      }
      return acc;
    },
    {} as Record<string, ShoppingListItem[]>
  );

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="pb-20 md:pb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
          <p className="text-sm text-gray-500">
            Week of{" "}
            {new Date(weekStart + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        {/* <Button onClick={generateList} loading={generating} size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          {items.length > 0 ? "Regenerate" : "Generate"} */}
        {/* </Button> */}
      </div>

      {/* Preferred stores */}
      {profile?.preferred_stores && profile.preferred_stores.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <MapPin className="h-4 w-4" />
          <span>
            Your stores:{" "}
            {profile.preferred_stores.join(", ")}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <ShoppingCart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No shopping list yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Add meals to your plan, then generate your shopping list
          </p>
          <Button onClick={generateList} loading={generating}>
            Send ingredients to shopping list
          </Button>
        </Card>
      ) : (
        <>
          {/* Progress */}
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Shopping progress</span>
              <span className="font-medium text-gray-900">
                {checkedCount} / {items.length} items
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{
                  width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%`,
                }}
              />
            </div>
          </Card>

          {/* Items by category */}
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {CATEGORY_LABELS[category] || category}
                </h3>
                <Card className="divide-y divide-gray-100">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            item.checked
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-gray-300"
                          )}
                        >
                          {item.checked && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "text-sm transition-colors",
                              item.checked
                                ? "text-gray-400 line-through"
                                : "text-gray-900"
                            )}
                          >
                            {item.ingredient_name}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-xs flex-shrink-0",
                            item.checked ? "text-gray-300" : "text-gray-500"
                          )}
                        >
                          {item.amount}
                        </span>
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.price && (
                          <span
                            className={cn(
                              "text-sm font-medium",
                              item.checked ? "text-gray-300" : "text-gray-900"
                            )}
                          >
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
