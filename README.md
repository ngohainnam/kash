<div align="center">

# 💸 KASH

### AI-Powered Personal Finance Dashboard

**Know exactly where every dollar goes.**

KASH turns your bank CSV export into instant, actionable insights — spending breakdowns, income tracking, and an AI assistant that answers plain-English questions about your money. No accounts. No cloud. No lock-in.

</div>

---

## What is KASH?

Most people export their bank statements and do nothing with them. KASH changes that.

Upload a CSV, and within seconds you get a full picture of your finances: total income, total expenses, net balance, and every transaction neatly categorised. Then ask the built-in AI anything — *"How much did I spend on food last month?"* or *"What's my biggest expense category?"* — and get a clear, human answer in seconds.

Everything runs in your browser and on your own server. Your financial data never leaves your control.

---

## Features

### 📂 Smart CSV Import
Drag and drop any bank statement CSV. KASH automatically detects the `Date`, `Description`, and `Amount` columns, strips currency symbols, skips invalid rows, and loads your transactions instantly.

### 📊 Live Analytics
The moment your file loads, KASH calculates:
- **Total Income** — sum of all positive transactions
- **Total Expenses** — sum of all outgoings
- **Net Balance** — your actual bottom line for the period

### 🏷️ Automatic Categorisation
Every transaction is tagged automatically — Groceries, Dining, Entertainment, Utilities, Shopping, Transport, Healthcare, Travel, and more. Refunds are flagged as Income. The rules live in [`lib/categorize.ts`](lib/categorize.ts) and are easy to extend.

### 🤖 AI Chat (Gemini-powered)
Ask the AI anything about your transactions in natural language. It has full context of your statement — dates, amounts, categories, top expenses — and responds with clear, concise answers. Powered by Google Gemini.

### 🔒 Private by Default
- No sign-up required to explore the app
- CSV parsing happens server-side in your own Next.js instance
- Nothing is stored permanently unless you configure a database

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| CSV Parsing | PapaParse |
| AI | Google Gemini (`@google/genai`) |
| Icons | Lucide React |
| Font | Geist (via `next/font`) |

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd bankcheck
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

To get a Gemini API key, visit [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use KASH

### Step 1 — Upload your bank statement
1. Navigate to the **Files** page from the top navbar (or click **Upload Statement** on the home page).
2. Drag and drop your CSV file onto the upload area, or click to browse.
3. KASH accepts any CSV with at least three columns: **Date**, **Description**, and **Amount**.

> **Tip:** Most banks let you export a CSV from the transaction history section of their online banking portal.

### Step 2 — Review your transactions
After upload, your transactions appear in a table:
- Dates and descriptions are shown as-is from your file.
- Amounts are colour-coded — **green** for income, **red** for expenses.
- Each row is automatically tagged with a spending category.

The summary cards at the top show your **total income**, **total expenses**, and **net balance** at a glance.

### Step 3 — Ask the AI
1. Type a question in the chat bar at the bottom of the screen — or navigate to the **Chats** page.
2. The AI has full context of your uploaded transactions and will answer in plain English.

**Example questions you can ask:**
- *"What did I spend the most on this month?"*
- *"How much did I earn vs spend?"*
- *"List all my subscriptions."*
- *"What's my average weekly grocery spend?"*
- *"Did I have any unusual large expenses?"*

---

## Project Structure

```
bankcheck/
├── app/
│   ├── api/
│   │   ├── upload/route.ts     # CSV parsing endpoint
│   │   └── chat/route.ts       # Gemini AI chat endpoint
│   ├── files/page.tsx          # File upload & transaction table
│   ├── chats/page.tsx          # AI chat interface
│   ├── page.tsx                # Landing / home page
│   ├── layout.tsx              # Root layout (Navbar + ChatBar)
│   └── globals.css             # Global styles & KASH design tokens
├── components/
│   ├── Sidebar.tsx             # Top navbar
│   ├── ChatBar.tsx             # Persistent bottom chat input
│   ├── UploadBox.tsx           # Drag-and-drop CSV uploader
│   ├── TransactionTable.tsx    # shadcn Table-based transaction list
│   └── Summary.tsx             # Income / Expense / Net cards
├── lib/
│   ├── categorize.ts           # Rule-based transaction categorisation
│   └── utils.ts                # Shared utilities
└── .env.local                  # Your API keys (not committed)
```

---

## Supported CSV Formats

KASH looks for columns named **Date**, **Description** (or **Narration** / **Memo**), and **Amount**. The parser is case-insensitive and handles:

- Dollar signs and commas in amounts (`$1,234.56`)
- Parentheses for negatives (`(134.50)`)
- Various date formats (`2024-04-01`, `01/04/2024`, `Apr 1, 2024`)

If your bank uses different column names, you can adjust the header mapping in `app/api/upload/route.ts`.

---

## License

MIT — free to use, modify, and deploy.


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
