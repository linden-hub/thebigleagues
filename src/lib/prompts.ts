import type { Profile } from "./types";

export const ONBOARDING_SYSTEM_PROMPT = `You are PlateMate's friendly meal prep assistant helping a new user set up their profile. Your goal is to learn about their dietary needs, preferences, and constraints through natural conversation.

RULES:
- Be warm, concise, and conversational
- Ask 1-2 questions at a time — never overwhelm with a wall of questions
- Guide the conversation through these topics (in a natural order):
  1. Dietary restrictions and food allergies
  2. Cuisine preferences (what types of food they enjoy)
  3. Cooking skill level (beginner, intermediate, or advanced)
  4. Household size (how many people they're cooking for)
  5. Weekly grocery budget
  6. Available kitchen equipment (oven, slow cooker, instant pot, air fryer, etc.)
  7. Maximum time they're willing to spend on meal prep per recipe
  8. Their location (city or zip code) and preferred grocery stores
- After covering all topics, ask: "Is there anything else you'd like me to consider when picking recipes for you?"
- If the user says no (or indicates they're done), respond with ONLY a JSON block in this exact format — no other text before or after it:

\`\`\`json
{
  "dietary_restrictions": ["string"],
  "cuisine_preferences": ["string"],
  "cooking_skill": "beginner|intermediate|advanced",
  "household_size": 1,
  "weekly_budget": 100,
  "available_equipment": ["string"],
  "max_prep_time": 30,
  "location": "string",
  "preferred_stores": ["string"],
  "additional_notes": "string or null"
}
\`\`\`

Start by introducing yourself briefly and asking your first question.`;

export function buildRecipeGenerationPrompt(
  profile: Profile,
  swipeHistory?: { liked: string[]; disliked: string[] }
): string {
  const historySection = swipeHistory
    ? `
PAST PREFERENCES (learn from these):
- Recipes they LIKED: ${swipeHistory.liked.join(", ") || "None yet"}
- Recipes they SKIPPED: ${swipeHistory.disliked.join(", ") || "None yet"}
Generate recipes that align more with their liked recipes and avoid patterns from skipped ones.`
    : "";

  return `Generate exactly 10 unique meal prep recipes personalized for this user.

USER PROFILE:
- Dietary restrictions: ${profile.dietary_restrictions.join(", ") || "None"}
- Cuisine preferences: ${profile.cuisine_preferences.join(", ") || "Open to anything"}
- Cooking skill: ${profile.cooking_skill}
- Household size: ${profile.household_size}
- Weekly grocery budget: $${profile.weekly_budget}
- Available equipment: ${profile.available_equipment.join(", ") || "Standard kitchen"}
- Max prep time per recipe: ${profile.max_prep_time} minutes
- Location: ${profile.location || "US"}
- Preferred stores: ${profile.preferred_stores.join(", ") || "Any"}
- Additional notes: ${profile.additional_notes || "None"}
${historySection}

REQUIREMENTS:
- All recipes MUST be meal-prep friendly (store well, reheat well)
- STRICTLY respect all dietary restrictions and allergies
- Stay within the weekly budget for ${profile.household_size} people
- Keep prep time under ${profile.max_prep_time} minutes
- Include variety in cuisines, proteins, and cooking methods
- Match the cooking skill level (${profile.cooking_skill})
- Provide realistic macro estimates per serving
- Provide realistic cost estimates per serving based on average US grocery prices

Return a JSON array of exactly 10 recipes with this schema:
[
  {
    "title": "string",
    "description": "One sentence description",
    "cuisine": "string",
    "difficulty": "easy|medium|hard",
    "prep_time": number (minutes),
    "cook_time": number (minutes),
    "servings": number,
    "ingredients": [
      {"name": "string", "amount": "string", "unit": "string", "category": "produce|dairy|protein|pantry|frozen|other"}
    ],
    "instructions": ["Step 1...", "Step 2..."],
    "calories": number (per serving),
    "protein": number (grams per serving),
    "carbs": number (grams per serving),
    "fat": number (grams per serving),
    "cost_per_serving": number (USD)
  }
]`;
}

export function buildShoppingListPrompt(
  recipesJson: string,
  householdSize: number
): string {
  return `Given these meal prep recipes for the week, generate a consolidated shopping list.

RECIPES:
${recipesJson}

HOUSEHOLD SIZE: ${householdSize}

RULES:
- Combine duplicate ingredients across recipes (e.g., if 2 recipes need chicken breast, sum the amounts)
- Adjust quantities for household size of ${householdSize}
- Categorize every item into one of: produce, dairy, protein, pantry, frozen, other
- Use common grocery store units (lbs, oz, count, etc.)
- Estimate realistic US grocery prices for each ingredient (typical grocery store prices)

Return a JSON array:
[
  {
    "ingredient_name": "string",
    "amount": "string (e.g., '2 lbs', '1 dozen', '16 oz')",
    "category": "produce|dairy|protein|pantry|frozen|other",
    "price": number (estimated price in USD for the amount specified, e.g., 3.99)
  }
]`;
}
