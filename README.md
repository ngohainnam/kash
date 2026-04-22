<div align="center">

# KASH

### AI-Powered Personal Finance Dashboard

**Know exactly where every dollar goes.**

KASH turns your bank CSV export into instant, actionable insights � spending breakdowns, income tracking, budget tracking, and an AI assistant that answers plain-English questions about your money.

</div>

---

## What is KASH?

Most people export their bank statements and do nothing with them. KASH changes that.

Upload a CSV, and within seconds you get a full picture of your finances: total income, total expenses, net balance, and every transaction neatly categorised. Set monthly budgets per category, add personal notes to transactions, visualise your spending with charts, and ask the built-in AI anything � *"How much did I spend on food last month?"* or *"What's my biggest expense category?"* � and get a clear, human answer in seconds.

Your data is secured behind authentication and stored in your own database.

---

## Features

### Smart CSV Import
Drag and drop any bank statement CSV. KASH automatically detects the `Date`, `Description`, and `Amount` columns, strips currency symbols, skips invalid rows, and loads your transactions instantly.

### Live Analytics & Dashboard
The moment your file loads, KASH calculates:
- **Total Income** � sum of all positive transactions
- **Total Expenses** � sum of all outgoings
- **Net Balance** � your actual bottom line for the period

### Visualisations
Interactive charts give you a richer view of your spending:
- **Monthly Bar Chart** � income vs expenses side-by-side across months
- **Spending Pie Chart** � breakdown of expenses by category

### Automatic Categorisation
Every transaction is tagged automatically � Groceries, Dining, Entertainment, Utilities, Shopping, Transport, Healthcare, Travel, and more. Refunds are flagged as Income. The rules live in [`lib/categorize.ts`](lib/categorize.ts) and are easy to extend.

### Budget Tracking
Set monthly spending limits per category. KASH compares your actual spend against your budget and shows you where you're over or under � so you stay in control before the month ends.

### Transaction Notes
Add personal notes to individual transactions for context � e.g. *"work lunch reimbursed"* or *"annual subscription"*. Notes are stored per-user and persist across sessions.

### AI Chat (Gemini-powered)
Ask the AI anything about your transactions in natural language. It has full context of your statement � dates, amounts, categories, top expenses � and responds with clear, concise answers. Powered by Google Gemini.

### Authentication
Secure sign-in and sign-up powered by [Clerk](https://clerk.com). Each user's files, notes, and budgets are fully isolated.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Clerk |
| Database | PostgreSQL + Prisma ORM |
| CSV Parsing | PapaParse |
| AI | Google Gemini (`@google/genai`) |
| Charts | Recharts |
| Icons | Lucide React |
| Font | Geist (via `next/font`) |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/ngohainnam/kash.git
cd kash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Google Gemini AI
GEMINI_API_KEY=your_google_gemini_api_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database (PostgreSQL)
DATABASE_URL=your_postgresql_connection_string
```

- **Gemini API key** � [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Clerk keys** � [Clerk Dashboard](https://dashboard.clerk.com)
- **Database** � any PostgreSQL provider (e.g. [Neon](https://neon.tech), Supabase, Railway)

### 3. Set up the database

```bash
npx prisma db push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use KASH

### Step 1 � Sign in
Create an account or sign in via the sign-in page. All your data (files, budgets, notes) is tied to your account.

### Step 2 � Upload your bank statement
1. Navigate to the **Files** page from the navbar.
2. Drag and drop your CSV file onto the upload area, or click to browse.
3. KASH accepts any CSV with at least three columns: **Date**, **Description**, and **Amount**.

> **Tip:** Most banks let you export a CSV from the transaction history section of their online banking portal.

### Step 3 � Review your transactions
After upload, your transactions appear in a table:
- Amounts are colour-coded � **green** for income, **red** for expenses.
- Each row is automatically tagged with a spending category.
- Click any row to add or edit a personal note.

The summary cards at the top show your **total income**, **total expenses**, and **net balance** at a glance.

### Step 4 � Explore the Dashboard & Visualisations
- **Dashboard** � overview of your financial health across all uploaded files.
- **Visualise** � bar and pie charts breaking down your spending by month and category.

### Step 5 � Set Budgets
1. Navigate to the **Budget** page.
2. Set a monthly spending limit for any category.
3. KASH compares your actual spend against your limits in real time.

### Step 6 � Ask the AI
1. Type a question in the chat bar or navigate to the **Chats** page.
2. The AI has full context of your uploaded transactions and will answer in plain English.

**Example questions:**
- *"What did I spend the most on this month?"*
- *"How much did I earn vs spend?"*
- *"List all my subscriptions."*
- *"What's my average weekly grocery spend?"*
- *"Did I have any unusual large expenses?"*

---

## Project Structure

```
kash/
+-- app/
�   +-- api/
�   �   +-- upload/route.ts         # CSV parsing & storage
�   �   +-- files/route.ts          # List / delete uploaded files
�   �   +-- analyze/route.ts        # Transaction analysis endpoint
�   �   +-- chat/route.ts           # Gemini AI chat endpoint
�   �   +-- notes/route.ts          # Transaction notes CRUD
�   �   +-- budgets/route.ts        # Budget upsert / retrieval
�   +-- dashboard/page.tsx          # Financial overview dashboard
�   +-- files/page.tsx              # File upload & transaction table
�   +-- visualize/page.tsx          # Charts & spending visualisations
�   +-- budget/page.tsx             # Budget management page
�   +-- chats/page.tsx              # AI chat interface
�   +-- sign-in/                    # Clerk sign-in page
�   +-- sign-up/                    # Clerk sign-up page
�   +-- page.tsx                    # Landing / home page
�   +-- layout.tsx                  # Root layout (Navbar + ChatBar)
�   +-- globals.css                 # Global styles & design tokens
+-- components/
�   +-- NavBar.tsx                  # Top navigation bar
�   +-- ChatBar.tsx                 # Persistent bottom chat input
�   +-- UploadBox.tsx               # Drag-and-drop CSV uploader
�   +-- TransactionTable.tsx        # Transaction list with notes
�   +-- StatementCard.tsx           # Uploaded file card
�   +-- Summary.tsx                 # Income / Expense / Net cards
�   +-- charts/
�       +-- MonthlyBarChart.tsx     # Monthly income vs expenses chart
�       +-- SpendingPieChart.tsx    # Category spending pie chart
+-- lib/
�   +-- categorize.ts               # Rule-based transaction categorisation
�   +-- prisma.ts                   # Prisma client singleton
�   +-- utils.ts                    # Shared utilities
+-- prisma/
�   +-- schema.prisma               # Database schema
+-- .env.local                      # Your API keys (not committed)
```

---

## Supported CSV Formats

KASH looks for columns named **Date**, **Description** (or **Narration** / **Memo**), and **Amount**. The parser is case-insensitive and handles:

- Dollar signs and commas in amounts (`$1,234.56`)
- Parentheses for negatives (`(134.50)`)
- Various date formats (`2024-04-01`, `01/04/2024`, `Apr 1, 2024`)

If your bank uses different column names, you can adjust the header mapping in [`app/api/upload/route.ts`](app/api/upload/route.ts).

---

## License

MIT � free to use, modify, and deploy.

## Deploy on Vercel

The easiest way to deploy KASH is with the [Vercel Platform](https://vercel.com/new). Make sure to add all environment variables from `.env.local` to your Vercel project settings.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
