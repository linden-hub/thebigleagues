# PlateMate

**AI-powered meal prep, simplified.**

## What is PlateMate?

PlateMate eliminates meal prep decision fatigue. It uses a conversational AI to learn your dietary needs, budget, and cooking preferences, then serves you a personalized stream of recipes you can swipe through — Tinder-style. Right-swipe the ones you like, and PlateMate builds your weekly meal plan and shopping list automatically.

## Who it's for

Anyone who wants to eat well but hates the planning — busy professionals, students, families, and anyone tired of staring into the fridge wondering what to make.

## Key Features

- **Conversational AI onboarding** — A guided chat captures your dietary restrictions, cuisine preferences, cooking skill level, household size, budget, available equipment, and more
- **Swipe-based recipe discovery** — Browse personalized recipes in a Tinder-style card feed with macros, cost per serving, prep time, and difficulty at a glance
- **Automatic meal planning** — Right-swipe a recipe and it's slotted into your weekly plan. View and manage meals across a 7-day calendar
- **Smart shopping lists** — One-click generation consolidates ingredients across all planned meals, combines duplicates, adjusts for household size, and organizes by grocery store section
- **Learns from you** — Swipe history feeds back into recipe generation so recommendations improve over time
- **Macro and budget tracking** — Every recipe includes calories, protein, carbs, fat, and cost per serving. The meal plan view aggregates totals for the week

## How It Works

1. **Sign up** — Create an account with email and password
2. **Chat with AI** — Have a natural conversation that builds your food profile
3. **Swipe recipes** — Browse a personalized feed and swipe right on meals you want to cook
4. **Plan and shop** — View your weekly meal plan and generate a consolidated shopping list

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Auth & Database | Supabase (PostgreSQL + Row Level Security) |
| AI | Google Gemini 2.5 Pro |
| Hosting | Vercel |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#          SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using PlateMate.
