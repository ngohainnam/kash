# KASH — Developer Architecture Guide

A deep-dive into how the app is structured, how every file connects to every other file, and the complete logical flow of each feature.

---

## Table of Contents

1. [Technology Overview](#technology-overview)
2. [Repository Layout](#repository-layout)
3. [Request Lifecycle & Auth](#request-lifecycle--auth)
4. [Database Schema](#database-schema)
5. [Shared Types — The "Glue"](#shared-types--the-glue)
6. [Feature Flows](#feature-flows)
   - [CSV Upload](#1-csv-upload-flow)
   - [Files Page](#2-files-page-flow)
   - [Transaction Notes](#3-transaction-notes-flow)
   - [Dashboard](#4-dashboard-flow)
   - [Visualize](#5-visualize-flow)
   - [Budget Tracking](#6-budget-tracking-flow)
   - [AI Chat](#7-ai-chat-flow)
7. [Categorization Engine](#categorization-engine)
8. [Component Map](#component-map)
9. [API Route Reference](#api-route-reference)
10. [Data Flow Diagram](#data-flow-diagram)
11. [Adding New Features](#adding-new-features)

---

## Technology Overview

| Concern | Tool |
|---|---|
| Framework | Next.js App Router (all pages are React Server or Client Components) |
| Language | TypeScript (strict) |
| Auth | Clerk — handles sign-in, sign-up, session tokens, and `userId` extraction |
| Database | PostgreSQL via Prisma ORM |
| AI | Google Gemini (`gemini-2.5-flash`) via `@google/genai` |
| Styling | Tailwind CSS v4 + shadcn/ui components + custom CSS variables |
| CSV Parsing | PapaParse (runs server-side inside the upload API route) |
| Charts | Recharts (`MonthlyBarChart`, `SpendingPieChart`) |

---

## Repository Layout

```
kash/
¦
+-- middleware.ts                  # Clerk route protection (runs on EVERY request)
¦
+-- app/
¦   +-- layout.tsx                 # Root layout — wraps ALL pages
¦   +-- page.tsx                   # Landing page (public)
¦   +-- globals.css                # CSS custom properties (design tokens)
¦   ¦
¦   +-- dashboard/page.tsx         # Protected — aggregated financial overview
¦   +-- files/page.tsx             # Protected — upload & manage CSV files
¦   +-- visualize/page.tsx         # Protected — charts & spending breakdown
¦   +-- budget/page.tsx            # Protected — set & track category budgets
¦   +-- chats/page.tsx             # Protected — AI chat interface
¦   ¦
¦   +-- sign-in/[[...sign-in]]/    # Clerk-managed sign-in page
¦   +-- sign-up/[[...sign-up]]/    # Clerk-managed sign-up page
¦   ¦
¦   +-- api/
¦       +-- upload/route.ts        # POST  — parse CSV, save to DB
¦       +-- files/route.ts         # GET   — list user's files
¦       +-- files/[id]/route.ts    # DELETE — remove a file (cascades notes)
¦       +-- analyze/route.ts       # POST  — AI savings tips & anomaly detection
¦       +-- chat/route.ts          # POST  — Gemini AI conversational chat
¦       +-- notes/route.ts         # GET / POST — read & upsert transaction notes
¦       +-- notes/[id]/route.ts    # DELETE — remove a single note
¦       +-- budgets/route.ts       # GET / POST — read & upsert budgets
¦
+-- components/
¦   +-- NavBar.tsx                 # Top nav — rendered in layout.tsx for every page
¦   +-- ChatBar.tsx                # (currently used internally, was bottom bar)
¦   +-- UploadBox.tsx              # Drag-and-drop CSV uploader widget
¦   +-- StatementCard.tsx          # Collapsible card for one uploaded file
¦   +-- TransactionTable.tsx       # Table of transactions with inline note editing
¦   +-- Summary.tsx                # Income / Expense / Net stat cards
¦   +-- charts/
¦       +-- MonthlyBarChart.tsx    # Recharts bar chart (income vs expense by month)
¦       +-- SpendingPieChart.tsx   # Recharts pie chart (spending by category)
¦
+-- lib/
¦   +-- prisma.ts                  # Singleton PrismaClient (safe for Next.js HMR)
¦   +-- categorize.ts              # Pure function: Transaction[] ? Transaction[] with categories
¦   +-- utils.ts                   # shadcn/ui cn() helper
¦
+-- prisma/
    +-- schema.prisma              # Database models: CsvFile, TransactionNote, Budget
```

---

## Request Lifecycle & Auth

Every request — page load or API call — passes through `middleware.ts` first.

```
Browser request
      ¦
      ?
middleware.ts  (Clerk middleware)
      ¦
      +-- /files or /chats?  --? auth.protect() ? redirect to /sign-in if not authenticated
      ¦
      +-- everything else  --? pass through (public routes: /, /dashboard, /visualize, /budget)
```

> **Note:** `/dashboard`, `/visualize`, and `/budget` are NOT in the protected matcher, but their API calls (`/api/files`, `/api/budgets`) all call `auth()` and return 401 if the user is not signed in. Unauthenticated users will see empty states.

Inside every API route:

```typescript
const { userId } = await auth();          // from @clerk/nextjs/server
if (!userId) return 401;
// userId is safe to use for all DB queries
```

---

## Database Schema

Three models in `prisma/schema.prisma`:

### `CsvFile`
Stores one uploaded CSV per record.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `userId` | String | Clerk user ID |
| `fileName` | String | Original filename |
| `uploadedAt` | DateTime | Auto-set on create |
| `transactions` | String | **JSON blob** of `Transaction[]` |

> Transactions are stored as a serialised JSON string, not normalised rows. This keeps the schema simple and avoids a large join table.

### `TransactionNote`
Stores a user's note on a specific transaction by its position index within a file.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `userId` | String | Clerk user ID |
| `fileId` | String | FK ? `CsvFile.id` (cascades on delete) |
| `txIndex` | Int | 0-based index of the transaction in the file's array |
| `note` | String | The note text |

Unique constraint: `(userId, fileId, txIndex)` — one note per transaction slot per user.

### `Budget`
Stores a monthly spending limit per category.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `userId` | String | Clerk user ID |
| `category` | String | e.g. `"Food"`, `"Transport"` |
| `monthlyLimit` | Float | Spending cap in dollars |
| `month` | String | `"YYYY-MM"` format, e.g. `"2026-04"` |

Unique constraint: `(userId, category, month)` — one limit per category per month per user.

---

## Shared Types — The "Glue"

The TypeScript interfaces exported from API route files act as the shared contract between client pages and the server. This means you only define the type once.

```
app/api/upload/route.ts  ?  exports  Transaction
app/api/files/route.ts   ?  exports  CsvFileRecord
app/api/analyze/route.ts ?  exports  AnalysisResult
app/api/budgets/route.ts ?  exports  BudgetRecord
lib/categorize.ts        ?  exports  Category
```

Pages import these directly:

```typescript
// app/files/page.tsx
import type { Transaction }    from "@/app/api/upload/route";
import type { CsvFileRecord }  from "@/app/api/files/route";

// app/dashboard/page.tsx
import type { AnalysisResult } from "@/app/api/analyze/route";

// app/budget/page.tsx
import type { BudgetRecord }   from "@/app/api/budgets/route";
import type { Category }       from "@/lib/categorize";
```

**If you rename or change a type in an API route, the TypeScript compiler will immediately flag all pages that use it.**

---

## Feature Flows

### 1. CSV Upload Flow

```
User drops/selects a CSV file
          ¦
          ?
components/UploadBox.tsx
  - Animates a fake progress bar (UX only)
  - POSTs FormData { file } to /api/upload
          ¦
          ?
app/api/upload/route.ts
  - Calls auth() — 401 if not signed in
  - Reads file bytes, runs PapaParse with { header: true }
  - Validates required columns: Date, Description, Amount
  - Strips currency symbols, skips malformed rows
  - Calls prisma.csvFile.create({ userId, fileName, transactions: JSON.stringify(...) })
  - Returns { transactions: Transaction[], fileId: string }
          ¦
          ?
UploadBox.tsx receives response
  - Calls props.onUpload(transactions, fileId)
          ¦
          ?
app/files/page.tsx (handleUpload)
  - Calls fetchFiles() to refresh the file list from /api/files
  - Sets expandedId = fileId (auto-opens the new file's card)
```

---

### 2. Files Page Flow

```
app/files/page.tsx mounts
          ¦
          ?
  fetchFiles() ? GET /api/files
          ¦
          ?
app/api/files/route.ts
  - auth() check
  - prisma.csvFile.findMany({ where: { userId }, orderBy: uploadedAt desc })
  - Parses JSON transactions for each file
  - Returns { files: CsvFileRecord[] }
          ¦
          ?
files/page.tsx renders list of <StatementCard> components
          ¦
          ?
components/StatementCard.tsx (per file)
  - Computes income / expense / net from file.transactions
  - Expand/collapse toggle shows <TransactionTable>
  - Delete button ? DELETE /api/files/[id]
          ¦
          ?
components/TransactionTable.tsx
  - Receives transactions[] + fileId
  - On mount, fetches GET /api/notes?fileId=xxx
  - Renders each row; note icon opens inline textarea
  - Save ? POST /api/notes { fileId, txIndex, note }
  - Empty note ? server deletes it; non-empty ? upserts it
```

---

### 3. Transaction Notes Flow

```
User clicks the note icon on a transaction row
          ¦
          ?
TransactionTable.tsx
  - setEditingIndex(i), setDraftNote(existing note or "")
  - Renders textarea with save / cancel buttons
          ¦
  User saves
          ¦
          ?
POST /api/notes  { fileId, txIndex, note }
          ¦
app/api/notes/route.ts
  - auth() check
  - If note is empty:
      prisma.transactionNote.deleteMany({ where: { userId, fileId, txIndex } })
      ? returns { deleted: true }
  - If note has content:
      prisma.transactionNote.upsert(...)
      ? returns { note: TransactionNote }
          ¦
          ?
TransactionTable.tsx
  - Updates local notes state map
  - Closes the edit textarea
```

---

### 4. Dashboard Flow

```
app/dashboard/page.tsx mounts
          ¦
          ?
fetchFiles() ? GET /api/files
          ¦
  All files loaded ? runs client-side:
  - categorizeTransactions(allTxs)   ? lib/categorize.ts
  - Computes totalIncome, totalExpenses, netBalance
  - detectAnomalies(txs)             ? local helper, flags 3× category mean
  - buildCategoryTotals(txs)         ? top 6 expense categories
  - Renders KPI cards + category bars + anomaly list
          ¦
  "Run AI Analysis" button clicked
          ¦
          ?
POST /api/analyze  { fileIds? }
          ¦
app/api/analyze/route.ts
  - auth() check
  - Loads files from DB, categorizes transactions
  - Builds a spending summary prompt
  - Calls Gemini: "respond in valid JSON only"
  - Parses JSON ? AnalysisResult { savings: string[], anomalies: [...] }
  - Returns result
          ¦
          ?
dashboard/page.tsx
  - Renders AI savings tips list
  - Renders AI-detected anomaly cards
```

---

### 5. Visualize Flow

```
app/visualize/page.tsx mounts
          ¦
          ?
fetchFiles() ? GET /api/files
  - Defaults selectedId to first file
          ¦
User selects a file from dropdown
          ¦
  Client-side data transformation:
  - categorizeTransactions(selectedFile.transactions)
  - buildCategoryData(txs)  ? [{ name, value }]   for pie chart
  - buildMonthlyData(txs)   ? [{ month, income, expense }]  for bar chart
          ¦
          ?
components/charts/SpendingPieChart.tsx
  - Recharts PieChart, one slice per spending category
  - Colour-coded, custom tooltip

components/charts/MonthlyBarChart.tsx
  - Recharts BarChart, grouped bars per month
  - Green = income, Red = expense
          ¦
  "Export PDF" button
  - Uses window.print() with print-specific CSS to save as PDF
```

---

### 6. Budget Tracking Flow

```
app/budget/page.tsx mounts
          ¦
          ?
fetchAll():
  - GET /api/budgets  ? BudgetRecord[]
  - GET /api/files    ? CsvFileRecord[]
  Both run in parallel via Promise.all()
          ¦
  Client-side:
  - User selects month (default = current month, "YYYY-MM")
  - For each budget, finds matching actual spend from transactions:
      categorizeTransactions(allTxs)
      ? filter by category + month substring match
  - Computes spent / limit / percentage for each row
  - Renders progress bars: green (<80%), amber (80–100%), red (>100%)
          ¦
User adds a new budget
          ¦
"Add Budget" form submits
          ¦
          ?
POST /api/budgets  { category, monthlyLimit, month }
          ¦
app/api/budgets/route.ts
  - auth() check
  - prisma.budget.upsert(
      where: { userId_category_month },
      create: { ... },
      update: { monthlyLimit }
    )
  - Returns updated BudgetRecord
          ¦
budget/page.tsx
  - Adds new record to local state (no full refetch needed)
```

---

### 7. AI Chat Flow

```
User types a message in chats/page.tsx
  (or arrives from ChatBar via /chats?q=...)
          ¦
          ?
chats/page.tsx sendMessage()
  - Appends user message to local messages[]
  - Determines fileIds (selected file or undefined = all files)
          ¦
          ?
POST /api/chat  { messages: ChatMessage[], fileIds? }
          ¦
app/api/chat/route.ts
  - auth() check
  - Loads files from DB (scoped to fileIds if provided)
  - Merges all transactions into one array
  - Calls buildSystemPrompt(transactions, fileNames):
      ? Computes income / expense summary
      ? Builds category breakdown
      ? Lists top 10 expenses
      ? Appends full transaction list (capped at 300 rows)
  - Builds Gemini conversation history from prior messages
  - Calls ai.models.generateContent({ systemInstruction, contents })
  - Returns { text: string }
          ¦
          ?
chats/page.tsx
  - Appends AI message to messages[]
  - Auto-scrolls to bottom
```

**ChatBar shortcut path:**

```
NavBar does NOT render ChatBar — it was removed from layout.
ChatBar (if used standalone) ? router.push(`/chats?q=...`)
chats/page.tsx reads params.get("q") on mount ? calls sendMessage() immediately
```

---

## Categorization Engine

`lib/categorize.ts` is a **pure function** — no I/O, no state. It takes transactions and returns the same array with a `category` field added.

```typescript
categorizeTransactions(transactions: Transaction[]): Transaction[]
```

**How it works:**

1. Each transaction's `description` is normalised: lowercased, symbols stripped, spaces collapsed.
2. The normalised string is tested against a dictionary of keyword arrays (`RULES`), one per category.
3. The **first matching category wins** (order matters — `Income` is checked before `Food`, etc.).
4. If no keyword matches, category is set to `"Other"`.

**Category list:** `Income`, `Food`, `Transport`, `Bills`, `Entertainment`, `Shopping`, `Health`, `Education`, `Travel`, `Subscriptions`, `Transfers`, `Other`.

**Where it's used:**

| File | Purpose |
|---|---|
| `app/api/analyze/route.ts` | Before sending data to Gemini for AI analysis |
| `app/dashboard/page.tsx` | Client-side, before building category totals and anomaly detection |
| `app/visualize/page.tsx` | Client-side, before building chart data |
| `app/budget/page.tsx` | Client-side, before computing actual spend vs budget limits |

> **Note:** Categorization does NOT happen in the upload route. Raw transactions are stored without categories. Categorization is applied fresh each time data is consumed — this means you can update the rules in `categorize.ts` and all existing data will be re-categorized automatically.

---

## Component Map

```
layout.tsx
  +-- <Navbar />                            ? always rendered, every page
        +-- Clerk: UserButton / SignInButton / SignUpButton

files/page.tsx
  +-- <UploadBox onUpload={handleUpload} />
  ¦     +-- POST /api/upload
  +-- <StatementCard /> (one per file)
        +-- <TransactionTable transactions fileId />
              +-- GET /api/notes?fileId=...
              +-- POST /api/notes

dashboard/page.tsx
  +-- (all inline JSX, no sub-components)
        +-- GET /api/files
        +-- POST /api/analyze
        +-- categorizeTransactions() from lib/categorize.ts

visualize/page.tsx
  +-- <MonthlyBarChart data />
  +-- <SpendingPieChart data />
        +-- GET /api/files
        +-- categorizeTransactions() from lib/categorize.ts

budget/page.tsx
  +-- (inline JSX)
        +-- GET /api/budgets
        +-- GET /api/files
        +-- POST /api/budgets
        +-- DELETE /api/budgets/[id]
        +-- categorizeTransactions() from lib/categorize.ts

chats/page.tsx
  +-- (inline JSX)
        +-- GET /api/files
        +-- POST /api/chat
```

---

## API Route Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/upload` | ? | Parse CSV, store `CsvFile` record |
| `GET` | `/api/files` | ? | List all `CsvFile` records for user |
| `DELETE` | `/api/files/[id]` | ? | Delete a file (cascades `TransactionNote`) |
| `POST` | `/api/analyze` | ? | Gemini AI tips + anomaly detection |
| `POST` | `/api/chat` | ? | Gemini AI conversational chat |
| `GET` | `/api/notes` | ? | Get all notes for a `fileId` |
| `POST` | `/api/notes` | ? | Upsert or delete a note |
| `DELETE` | `/api/notes/[id]` | ? | Delete note by ID |
| `GET` | `/api/budgets` | ? | Get all budgets for user |
| `POST` | `/api/budgets` | ? | Upsert a budget entry |

Every route:
- Calls `auth()` from `@clerk/nextjs/server`
- Returns `401` if `userId` is null
- Uses `prisma` singleton from `lib/prisma.ts`

---

## Data Flow Diagram

```
                        +-----------------------------+
                        ¦          Browser             ¦
                        ¦                              ¦
                        ¦  /         (landing)         ¦
                        ¦  /files    (upload + view)   ¦
                        ¦  /dashboard                  ¦
                        ¦  /visualize                  ¦
                        ¦  /budget                     ¦
                        ¦  /chats                      ¦
                        +-----------------------------+
                                    ¦ HTTP
                                    ?
                        +-----------------------------+
                        ¦       middleware.ts          ¦
                        ¦   Clerk auth gate            ¦
                        +-----------------------------+
                                    ¦
                                    ?
                   +------------------------------------+
                   ¦          Next.js API Routes         ¦
                   ¦                                     ¦
                   ¦  /api/upload  /api/files            ¦
                   ¦  /api/chat    /api/analyze          ¦
                   ¦  /api/notes   /api/budgets          ¦
                   +------------------------------------+
                        ¦                  ¦
                        ?                  ?
            +------------------+   +-----------------+
            ¦   PostgreSQL DB  ¦   ¦  Google Gemini  ¦
            ¦   (via Prisma)   ¦   ¦  gemini-2.5-    ¦
            ¦                  ¦   ¦  flash          ¦
            ¦  CsvFile         ¦   +-----------------+
            ¦  TransactionNote ¦
            ¦  Budget          ¦
            +------------------+
```

---

## Adding New Features

### Adding a new API route

1. Create `app/api/<name>/route.ts`
2. Always start with:
   ```typescript
   const { userId } = await auth();
   if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   ```
3. Export any shared interfaces from the same file so pages can import them directly.

### Adding a new DB model

1. Add the model to `prisma/schema.prisma`
2. Run `npx prisma db push` (dev) or create a migration (`npx prisma migrate dev`)
3. Run `npx prisma generate` to regenerate the client types
4. Restart the TS server in VS Code if you see stale type errors

### Adding a new page

1. Create `app/<page-name>/page.tsx`
2. Add the route to the `NAV` array in `components/NavBar.tsx`
3. If the page requires auth, add it to `isProtected` in `middleware.ts`

### Adding a new spending category

1. Add the category name to the `Category` type union in `lib/categorize.ts`
2. Add keyword rules to the `RULES` object in the same file
3. Add it to `ALL_CATEGORIES` in `app/budget/page.tsx` so users can set a budget for it
4. No DB changes needed — categorization is computed at runtime
