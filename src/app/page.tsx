import Link from "next/link";
import {
  ChefHat,
  MessageSquare,
  SwatchBook,
  ShoppingCart,
  Zap,
  DollarSign,
  Heart,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-emerald-600" />
          <span className="text-xl font-bold text-gray-900">PlateMate</span>
        </div>
        <Link href="/onboarding">
          <Button>Get Started</Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            AI-powered meal prep planning
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
            Meal prep on
            <span className="text-emerald-600"> autopilot</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Swipe through personalized recipes tailored to your diet, budget,
            and taste. Build your weekly meal plan in minutes and get a smart
            shopping list — no more decision fatigue.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/onboarding">
              <Button size="lg">Start meal prepping</Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" size="lg">
                See how it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Three steps to stress-free meals
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            From setup to shopping list in under 5 minutes
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              icon={<MessageSquare className="h-6 w-6" />}
              title="Tell us about you"
              description="Chat with our AI about your diet, budget, cooking skills, and preferences. It takes just a couple minutes."
            />
            <StepCard
              step={2}
              icon={<SwatchBook className="h-6 w-6" />}
              title="Swipe on recipes"
              description="Browse personalized recipes in a card feed. Swipe right to add to your week, left to skip. It learns what you like."
            />
            <StepCard
              step={3}
              icon={<ShoppingCart className="h-6 w-6" />}
              title="Get your shopping list"
              description="Your weekly meal plan auto-generates a consolidated shopping list organized by store section. Just shop and prep."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need to prep like a pro
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Heart className="h-5 w-5 text-emerald-600" />}
              title="Personalized"
              description="Recipes match your dietary needs, skill level, and taste preferences"
            />
            <FeatureCard
              icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
              title="Budget-friendly"
              description="Stay within your grocery budget with cost-estimated recipes"
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5 text-emerald-600" />}
              title="Macro tracking"
              description="Every recipe includes calories, protein, carbs, and fat per serving"
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5 text-emerald-600" />}
              title="Time-saving"
              description="Go from zero to a full week of meals in under 5 minutes"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 bg-emerald-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to simplify your meal prep?
          </h2>
          <p className="text-emerald-100 mb-8">
            Join PlateMate for free and start building your weekly meal plan
            today.
          </p>
          <Link href="/onboarding">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50"
            >
              Get started for free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 bg-gray-900 text-gray-400 text-sm text-center">
        <p>&copy; {new Date().getFullYear()} PlateMate. Built for the love of good food.</p>
      </footer>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
        {icon}
      </div>
      <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
        Step {step}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
