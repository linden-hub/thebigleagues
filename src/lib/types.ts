export interface Profile {
  id: string;
  display_name: string | null;
  dietary_restrictions: string[];
  cuisine_preferences: string[];
  cooking_skill: "beginner" | "intermediate" | "advanced";
  household_size: number;
  weekly_budget: number;
  available_equipment: string[];
  max_prep_time: number;
  location: string | null;
  preferred_stores: string[];
  additional_notes: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cuisine: string;
  difficulty: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cost_per_serving: number;
  batch_id: string;
  created_at: string;
}

export interface Swipe {
  id: string;
  user_id: string;
  recipe_id: string;
  direction: "left" | "right";
  created_at: string;
}

export interface MealPlanItem {
  id: string;
  user_id: string;
  recipe_id: string;
  recipe?: Recipe;
  week_start: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  day_of_week: number;
  created_at: string;
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  week_start: string;
  ingredient_name: string;
  amount: string;
  price?: number;
  category: string;
  checked: boolean;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface OnboardingMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface GeneratedRecipe {
  title: string;
  description: string;
  cuisine: string;
  difficulty: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cost_per_serving: number;
}
