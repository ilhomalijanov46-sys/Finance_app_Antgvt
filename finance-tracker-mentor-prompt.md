# Personal Finance Tracker — Autonomous PRD & Technical Specification

> **Target Executor:** Antigravity (Autonomous Fullstack AI Agent)  
> **Mode:** Full Autonomous Execution (Zero Human Hand-holding, Complete End-to-End Delivery)  
> **Output:** Production-ready, fully functional Web Application with Apple/macOS Aesthetics, Supabase + Mock fallback, Dark/Light mode, i18n (RU/EN/UZ), and interactive animations.

---

## 1. Autonomous Execution Protocol for Antigravity

Antigravity must execute this specification **completely autonomously from start to finish**.

### Operational Directives:
1. **Zero Waiting Barriers:** Do not pause to ask the user "May I create this file?" or "Please type 'next step'". Proceed sequentially through all phases until the entire project is built, verified, and ready to run.
2. **Complete Code Delivery:** Never use placeholders, `// TODO`, or truncated code blocks. All components, services, types, and translation dictionaries must be fully implemented.
3. **Dual-Mode Backend Resilience (Supabase + Demo Fallback):**
   - Implement a robust Supabase client supporting **Cookie-based auth persistence** (not `localStorage`).
   - If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not configured in `.env`, the application must **automatically fall back to an internal Demo/Mock State Provider** (persisted in browser storage with realistic initial seed data) so the app works seamlessly out-of-the-box.
   - When real Supabase credentials are provided, it smoothly routes all calls to Supabase PostgreSQL with RLS.
4. **Autonomous Self-Correction:**
   - Execute project scaffolding, dependency installation, and code writing.
   - Run typecheck and build validation (`npm run build`).
   - If any TypeScript, lint, or Vite build errors occur, autonomously inspect, diagnose, and fix them until the build passes with 0 errors.

---

## 2. Product Requirements Document (PRD)

### 2.1. Product Vision
**Personal Finance Tracker** is an ultra-fast, aesthetically refined personal finance management application designed in the style of modern macOS and Apple interfaces (similar to Mercury, Stripe, and Ramp). It enables individuals to track income, expenses, budgets, financial goals, recurring commitments, and analytics with zero cognitive friction.

### 2.2. Core Features & Capabilities

1. **Authentication & Multi-User Isolation:**
   - Sign Up, Sign In, and Sign Out.
   - Session persistence via secure Cookies.
   - Profile management (name, email, avatar, preferred currency, theme, language).
   - Demo mode login for instant testing without registration.

2. **Dashboard & Verdict Metric:**
   - **Hero Metric:** Current Net Balance displayed in massive Apple-like typography answering the user's primary question *"Am I doing okay financially?"*.
   - **KPI Summary Cards:** Monthly Income, Monthly Expense, Savings Rate, Active Goals Progress.
   - **Quick Action Bar:** Quick Add Expense, Quick Add Income, Quick Transfer to Goal.
   - **Recent Transactions & Upcoming Due Dates:** Visual feed of last 5-10 operations.
   - **Data Storytelling Widget:** Natural language summary (e.g., *"Dining expenses increased by 12% compared to last month"*).

3. **Income Management (`/incomes`):**
   - Types: Salary, Advance, Bonus, Freelance/Side-gig, Sale of items, Gift, Investments, Other.
   - Fields: Amount, Category/Type, Source/Client, Date, Notes/Comment.
   - Actions: Create, Edit, Delete, Filter by period/category, Search, Export (CSV/JSON).

4. **Expense Management (`/expenses`):**
   - Default Categories: Groceries, Dining & Cafes, Transport, Taxi, Internet, Mobile Phone, Utilities, Rent, Loans & Credits, Subscriptions, Entertainment, Clothing, Pharmacy & Health, Home, Travel, Pets, Miscellaneous.
   - Fields: Amount, Category, Date, Payment Method (Card, Cash, Transfer), Notes/Comment.
   - Actions: Create, Edit, Delete, Date Range filtering, Category filtering, Quick search.

5. **Budget Planning (`/budgets`):**
   - Category limits (e.g., Groceries — 3,000,000 UZS / $300 per month).
   - Dynamic progress indicators (Safe < 75%, Warning 75-99%, Overbudget >= 100%).
   - Calculation of "Daily Safe Spend" remaining for each category.

6. **Financial Goals (`/goals`):**
   - Target savings goals with title, target amount, current amount, deadline, and icon/color.
   - Quick deposit modal ("Add funds to goal" which automatically links to balance).
   - Progress bar with percentage and estimated completion date.

7. **Interactive Calendar (`/calendar`):**
   - Month & Week views displaying daily cash flow (income vs expense).
   - Highlighting recurring subscriptions and scheduled payments on specific days.

8. **Analytics & Statistics (`/statistics`):**
   - Monthly Income vs Expense comparison (Area/Bar charts with gradient fills).
   - Category breakdown (Donut chart with interactive hover slices).
   - Average daily/monthly spend, highest spending category detection.
   - Time period selector (This month, Last month, Last 3 months, This year, Custom).

9. **Profile & Customization (`/profile`):**
   - Dark & Light mode toggle with smooth theme transition.
   - Tri-lingual support: Russian (RU), English (EN), Uzbek (UZ).
   - Currency selection (UZS, USD, EUR, RUB) with localized number formatting.

---

## 3. Visual Identity & Design System

### 3.1. Aesthetics & Design Tokens
- **Style:** macOS / Apple Design System — minimal, high-density, rounded corners (`rounded-2xl`, `rounded-xl`), subtle borders (`border-slate-200/80 dark:border-zinc-800`), glassmorphism (`backdrop-blur-md bg-white/80 dark:bg-zinc-900/80`).
- **Color Palette:**
  - *Base:* Slate / Zinc monochrome neutrals (`bg-slate-50` / `bg-zinc-950`, `text-slate-900` / `text-zinc-100`).
  - *Primary Accent:* Apple Blue (`#0071e3` / `rgb(37 99 235)` / `blue-600`).
  - *Positive/Income:* Soft Emerald (`emerald-500` / `emerald-600`).
  - *Negative/Expense:* Soft Rose/Crimson (`rose-500` / `rose-600`).
  - *Warning:* Amber (`amber-500`).
- **Typography:** Inter / SF Pro style sans-serif with tight letter spacing (`tracking-tight`).
- **Micro-Interactions (Framer Motion):**
  - Animated number counters for balances and KPI values (`0 -> 12,450,000`).
  - Smooth page transitions and modal popups (`spring` damping).
  - Hover elevation with subtle border glows.
  - Skeleton loading states replacing spinners.

---

## 4. Technical Architecture & Tech Stack

```
Frontend:
├── React 18+ (Vite)
├── TypeScript
├── Tailwind CSS + Tailwind Merge + clsx
├── Lucide React (Icons)
├── Framer Motion (Animations)
├── Recharts (Responsive Charts)
├── TanStack React Query (Server State & Caching)
├── React Hook Form + Zod (Form validation)
├── react-i18next + i18next-browser-languagedetector (RU, EN, UZ)
└── React Router v6 (Declarative Routing)

Backend & Persistence:
├── Supabase (PostgreSQL, Auth, RLS, Storage)
├── Custom Cookie Storage Adapter for Supabase Auth
└── Built-in Demo/Mock State Provider (IndexedDB/LocalStorage fallback)
```

### 4.1. Project Directory Layout

```
personal-finance-tracker/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── vercel.json
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── i18n/
    │   ├── i18n.ts
    │   └── locales/
    │       ├── ru.json
    │       ├── en.json
    │       └── uz.json
    ├── types/
    │   └── index.ts
    ├── context/
    │   ├── AuthContext.tsx
    │   ├── ThemeContext.tsx
    │   └── DataContext.tsx
    ├── services/
    │   ├── supabase.ts
    │   ├── cookieStorage.ts
    │   ├── mockData.ts
    │   ├── incomeService.ts
    │   ├── expenseService.ts
    │   ├── budgetService.ts
    │   ├── goalService.ts
    │   └── profileService.ts
    ├── hooks/
    │   ├── useFinances.ts
    │   ├── useTheme.ts
    │   └── useCurrency.ts
    ├── utils/
    │   ├── formatters.ts
    │   ├── cn.ts
    │   └── analytics.ts
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── Card.tsx
    │   │   ├── Dialog.tsx
    │   │   ├── Skeleton.tsx
    │   │   ├── Toast.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Progress.tsx
    │   │   ├── Tabs.tsx
    │   │   └── AnimatedCounter.tsx
    │   ├── layout/
    │   │   ├── MainLayout.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   ├── LanguageSwitcher.tsx
    │   │   └── ThemeToggle.tsx
    │   ├── common/
    │   │   ├── EntityCard.tsx
    │   │   ├── StatCard.tsx
    │   │   ├── EmptyState.tsx
    │   │   └── ConfirmDialog.tsx
    │   └── forms/
    │       ├── IncomeForm.tsx
    │       ├── ExpenseForm.tsx
    │       ├── BudgetForm.tsx
    │       └── GoalForm.tsx
    └── pages/
        ├── Login.tsx
        ├── Register.tsx
        ├── Dashboard.tsx
        ├── Incomes.tsx
        ├── Expenses.tsx
        ├── Budgets.tsx
        ├── Goals.tsx
        ├── Calendar.tsx
        ├── Statistics.tsx
        └── Profile.tsx
```

---

## 5. Supabase PostgreSQL Schema & SQL DDL

The database must be created with complete RLS (Row Level Security) and triggers.

```sql
-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'USD',
  locale TEXT DEFAULT 'ru',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Incomes Table
CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  source TEXT,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  payment_method TEXT DEFAULT 'card',
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  limit_amount NUMERIC(14, 2) NOT NULL CHECK (limit_amount > 0),
  period TEXT DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- 6. Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_amount NUMERIC(14, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE,
  color TEXT DEFAULT '#0071e3',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own incomes" ON public.incomes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- 8. Auto-create Profile on Auth User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## 6. Cookie-based Storage Adapter Specification

The Supabase client must use a cookie-based storage adapter to satisfy security requirements and ensure session stability across page refreshes.

```typescript
// src/services/cookieStorage.ts
export const cookieStorage = {
  getItem: (key: string): string | null => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [k, v] = cookie.trim().split('=');
      if (k === key) {
        return decodeURIComponent(v);
      }
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
  },
  removeItem: (key: string): void => {
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
  }
};
```

---

## 7. Polymorphic Component Specification: `EntityCard`

`EntityCard` is a unified UI component sharing the same macOS "chassis" (glass border, subtle shadow, rounded corners, hover elevation) while rendering variant-specific content.

- **Props:**
  - `variant`: `'income'` | `'expense'` | `'budget'` | `'goal'` | `'stat'`
  - `title`: string
  - `amount`: number
  - `subtitle`?: string
  - `category`?: string
  - `date`?: string
  - `progress`?: { current: number; max: number } (for budgets and goals)
  - `trend`?: { percentage: number; isPositive: boolean } (for stats)
  - `onEdit`?: () => void
  - `onDelete`?: () => void
  - `onAction`?: () => void

---

## 8. Step-by-Step Autonomous Execution Plan

When Antigravity processes this prompt, it should execute the following phases in order:

### Phase 1: Project Setup & Package Scaffolding
1. Initialize Vite project with React & TypeScript:
   ```bash
   npm create vite@latest . -- --template react-ts
   ```
2. Install production dependencies:
   ```bash
   npm install lucide-react framer-motion recharts react-i18next i18next i18next-browser-languagedetector @tanstack/react-query react-router-dom @supabase/supabase-js clsx tailwind-merge react-hook-form zod @hookform/resolvers canvas-confetti
   npm install -D @types/canvas-confetti tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
3. Configure `tailwind.config.js`, `tsconfig.json`, `vite.config.ts` (with `@/` path aliases).

### Phase 2: Core Infrastructure & Storage
1. Implement Cookie Storage adapter (`src/services/cookieStorage.ts`).
2. Implement Supabase client with Fallback detection (`src/services/supabase.ts`).
3. Implement realistic Seed Data & Local Mock Provider (`src/services/mockData.ts`).
4. Setup `i18n` with full localization bundles in RU, EN, and UZ (`src/i18n/locales/*.json`).

### Phase 3: UI Kit Primitives & Design System
1. Build base UI components: `Button`, `Input`, `Select`, `Card`, `Dialog`, `Skeleton`, `Toast`, `Badge`, `Progress`, `Tabs`, `AnimatedCounter`.
2. Build polymorphic `EntityCard` and `StatCard`.
3. Create global layout: `Sidebar` (collapsible, responsive), `Header` (with user menu, search, notification popover), `ThemeToggle`, and `LanguageSwitcher`.

### Phase 4: Data Layer & Context Providers
1. Build `AuthContext`: Sign In, Sign Up, Sign Out, Demo Sign In, Profile Sync.
2. Build `DataContext`: Incomes, Expenses, Budgets, Goals, Active Filters with optimistic TanStack Query mutations.
3. Build `ThemeContext` with dark/light class toggling and system preference detection.

### Phase 5: Pages & Business Logic
1. **Auth Pages:** `Login.tsx` and `Register.tsx` with Apple-style centered cards and "Instant Demo Access" button.
2. **Dashboard (`Dashboard.tsx`):**
   - Large Verdict Balance with animated counters.
   - Monthly Incomes, Expenses, and Savings Rate cards.
   - Mini Cash Flow chart (Recharts AreaChart with blue & emerald gradients).
   - Quick Add Modal buttons.
   - Recent Transactions list with category badges.
3. **Incomes Page (`Incomes.tsx`):** Category filter, date range, Add/Edit modal, tabular & card view, total summary.
4. **Expenses Page (`Expenses.tsx`):** Category filter, payment method filter, Add/Edit modal, daily breakdown.
5. **Budgets Page (`Budgets.tsx`):** Category limit cards with live progress bars, remaining budget alerts, daily recommended spending.
6. **Goals Page (`Goals.tsx`):** Goal cards with target amount, current savings, progress circle/bar, deadline countdown, and instant "Deposit" modal with celebratory confetti on completion.
7. **Calendar Page (`Calendar.tsx`):** Monthly grid highlighting daily income/expense sums and scheduled payments.
8. **Statistics Page (`Statistics.tsx`):**
   - Income vs Expense monthly dynamic bar chart.
   - Expense by category Donut chart.
   - Top spending categories table.
   - Natural language storytelling insights.
9. **Profile Page (`Profile.tsx`):** Name, avatar, preferred currency (USD, UZS, EUR, RUB), theme and language settings, export/import data (JSON/CSV).

### Phase 6: Verification, Type Check & Build
1. Run `npm run build` to verify zero TypeScript or bundle errors.
2. Verify dark/light mode contrast across all pages.
3. Verify responsive layout on mobile, tablet, and desktop breakpoints.
4. Generate `.env.example` and `vercel.json` for seamless 1-click cloud deployment.

---

## 9. Acceptance Criteria (Definition of Done)

- [x] Application compiles cleanly with `npm run build` (0 TypeScript / lint errors).
- [x] Works seamlessly in Demo/Mock Mode if Supabase environment variables are missing.
- [x] Connects to Supabase PostgreSQL when `.env` credentials are supplied.
- [x] Auth sessions are securely stored in Cookies (no plain localStorage tokens).
- [x] All 8 authenticated pages (Dashboard, Incomes, Expenses, Budgets, Goals, Calendar, Statistics, Profile) are fully functional.
- [x] All 3 languages (RU, EN, UZ) are complete with 100% key coverage.
- [x] Dark/Light theme switching works instantaneously without page reloads.
- [x] All charts render smoothly with tooltips, custom colors, and responsive containers.
- [x] All forms have strict Zod validation with friendly localized error messages.

