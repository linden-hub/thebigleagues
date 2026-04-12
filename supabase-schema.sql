-- PrepDeck Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  dietary_restrictions text[] default '{}',
  cuisine_preferences text[] default '{}',
  cooking_skill text default 'beginner' check (cooking_skill in ('beginner', 'intermediate', 'advanced')),
  household_size int default 1,
  weekly_budget decimal default 100,
  available_equipment text[] default '{}',
  max_prep_time int default 60,
  location text,
  preferred_stores text[] default '{}',
  additional_notes text,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Recipes table
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  cuisine text,
  difficulty text,
  prep_time int,
  cook_time int,
  servings int,
  ingredients jsonb default '[]',
  instructions text[] default '{}',
  calories int,
  protein int,
  carbs int,
  fat int,
  cost_per_serving decimal,
  batch_id uuid,
  created_at timestamptz default now()
);

-- Swipes table
create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  direction text not null check (direction in ('left', 'right')),
  created_at timestamptz default now()
);

-- Meal plan items
create table public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  week_start date not null,
  meal_type text default 'dinner' check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 6),
  created_at timestamptz default now()
);

-- Shopping list items
create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_start date not null,
  ingredient_name text not null,
  amount text,
  category text default 'other' check (category in ('produce', 'dairy', 'protein', 'pantry', 'frozen', 'other')),
  checked boolean default false,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_recipes_user_id on public.recipes(user_id);
create index idx_recipes_batch_id on public.recipes(batch_id);
create index idx_swipes_user_id on public.swipes(user_id);
create index idx_swipes_recipe_id on public.swipes(recipe_id);
create index idx_meal_plan_user_week on public.meal_plan_items(user_id, week_start);
create index idx_shopping_list_user_week on public.shopping_list_items(user_id, week_start);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.swipes enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.shopping_list_items enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own recipes" on public.recipes for select using (auth.uid() = user_id);
create policy "Users can insert own recipes" on public.recipes for insert with check (auth.uid() = user_id);
create policy "Users can delete own recipes" on public.recipes for delete using (auth.uid() = user_id);

create policy "Users can view own swipes" on public.swipes for select using (auth.uid() = user_id);
create policy "Users can insert own swipes" on public.swipes for insert with check (auth.uid() = user_id);

create policy "Users can view own meal plan" on public.meal_plan_items for select using (auth.uid() = user_id);
create policy "Users can insert own meal plan" on public.meal_plan_items for insert with check (auth.uid() = user_id);
create policy "Users can update own meal plan" on public.meal_plan_items for update using (auth.uid() = user_id);
create policy "Users can delete own meal plan" on public.meal_plan_items for delete using (auth.uid() = user_id);

create policy "Users can view own shopping list" on public.shopping_list_items for select using (auth.uid() = user_id);
create policy "Users can insert own shopping list" on public.shopping_list_items for insert with check (auth.uid() = user_id);
create policy "Users can update own shopping list" on public.shopping_list_items for update using (auth.uid() = user_id);
create policy "Users can delete own shopping list" on public.shopping_list_items for delete using (auth.uid() = user_id);

-- Trigger: auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function: auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();
