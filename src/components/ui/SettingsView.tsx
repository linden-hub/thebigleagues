"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, LogOut, RotateCcw } from "lucide-react";
import type { Profile } from "@/lib/types";

export function SettingsView() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data as Profile | null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        dietary_restrictions: profile.dietary_restrictions,
        cuisine_preferences: profile.cuisine_preferences,
        cooking_skill: profile.cooking_skill,
        household_size: profile.household_size,
        weekly_budget: profile.weekly_budget,
        available_equipment: profile.available_equipment,
        max_prep_time: profile.max_prep_time,
        location: profile.location,
        preferred_stores: profile.preferred_stores,
        additional_notes: profile.additional_notes,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function updateArrayField(field: keyof Profile, value: string) {
    if (!profile) return;
    setProfile({
      ...profile,
      [field]: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Info */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <Input
              label="Display name"
              value={profile.display_name || ""}
              onChange={(e) =>
                setProfile({ ...profile, display_name: e.target.value })
              }
            />
            <Input
              label="Location (city or zip)"
              value={profile.location || ""}
              onChange={(e) =>
                setProfile({ ...profile, location: e.target.value })
              }
              placeholder="e.g. 94105 or San Francisco, CA"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cooking skill
              </label>
              <select
                value={profile.cooking_skill}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    cooking_skill: e.target.value as Profile["cooking_skill"],
                  })
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <Input
              label="Household size"
              type="number"
              min={1}
              value={profile.household_size}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  household_size: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
        </Card>

        {/* Diet & Preferences */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Diet & Preferences
          </h2>
          <div className="space-y-4">
            <Input
              label="Dietary restrictions (comma-separated)"
              value={profile.dietary_restrictions.join(", ")}
              onChange={(e) =>
                updateArrayField("dietary_restrictions", e.target.value)
              }
              placeholder="e.g. gluten-free, dairy-free"
            />
            <Input
              label="Cuisine preferences (comma-separated)"
              value={profile.cuisine_preferences.join(", ")}
              onChange={(e) =>
                updateArrayField("cuisine_preferences", e.target.value)
              }
              placeholder="e.g. Italian, Mexican, Thai"
            />
            <Input
              label="Available equipment (comma-separated)"
              value={profile.available_equipment.join(", ")}
              onChange={(e) =>
                updateArrayField("available_equipment", e.target.value)
              }
              placeholder="e.g. oven, slow cooker, instant pot"
            />
          </div>
        </Card>

        {/* Budget & Time */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Budget & Time</h2>
          <div className="space-y-4">
            <Input
              label="Weekly grocery budget ($)"
              type="number"
              min={0}
              value={profile.weekly_budget}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  weekly_budget: parseFloat(e.target.value) || 0,
                })
              }
            />
            <Input
              label="Max prep time per recipe (minutes)"
              type="number"
              min={5}
              value={profile.max_prep_time}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  max_prep_time: parseInt(e.target.value) || 30,
                })
              }
            />
            <Input
              label="Preferred grocery stores (comma-separated)"
              value={profile.preferred_stores.join(", ")}
              onChange={(e) =>
                updateArrayField("preferred_stores", e.target.value)
              }
              placeholder="e.g. Costco, Trader Joe's, Walmart"
            />
          </div>
        </Card>

        {/* Additional notes */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            value={profile.additional_notes || ""}
            onChange={(e) =>
              setProfile({ ...profile, additional_notes: e.target.value })
            }
            placeholder="Anything else you'd like us to consider when picking recipes..."
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[80px] resize-y"
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saved ? "Saved!" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/onboarding")}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Redo onboarding
          </Button>
        </div>
      </form>

      {/* Logout */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <Button variant="danger" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" />
          Log out
        </Button>
      </div>
    </div>
  );
}
