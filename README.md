# DukaanAI 🏪
> **Small Shops. Smarter Decisions.**  
> *An AI-Powered Retail Management Web Application for Small Indian Retailers & Kirana Stores*

[![BCA Project Competition 2026](https://img.shields.io/badge/Competition-BCA_Project_2026-8B5CF6?style=for-the-badge)](file:///c:/Users/nihaa/OneDrive/Desktop/Workshop-/index.html)
[![Zero Build Required](https://img.shields.io/badge/Stack-HTML5_%7C_CSS3_%7C_Vanilla_JS-34D399?style=for-the-badge)](file:///c:/Users/nihaa/OneDrive/Desktop/Workshop-/index.html)
[![Theme: Dark Futuristic SaaS](https://img.shields.io/badge/Theme-Futuristic_Dark_SaaS-10172A?style=for-the-badge)](file:///c:/Users/nihaa/OneDrive/Desktop/Workshop-/index.html)

---

## 📌 Problem Statement & Solution

* **The Problem:** Many small Indian retailers rely on paper notebooks (*khata*), mental calculations, or complex spreadsheets to manage sales, inventory, expenses, and customer credit. This causes frequent stockouts of fast-moving items, undetected dead inventory locking up capital, and inaccurate calculations of true operational profitability.
* **The Solution:** **DukaanAI** is a self-contained, zero-setup web application that unifies inventory tracking, multi-item counter POS billing, expense management, and data-driven business intelligence into an intuitive, dark-mode SaaS dashboard designed specifically for local shopkeepers.

---

## ⚡ Quick Start (Instant Demo)

**Zero installation, zero build process, and zero API credentials required.**

1. Open **[`index.html`](file:///c:/Users/nihaa/OneDrive/Desktop/Workshop-/index.html)** directly in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
2. The application loads immediately with a **comprehensive massive 505-commodity Indian Kirana and supermarket dataset across 12 FMCG categories across 12 FMCG categories (Dairy, Grains, Oils, Spices, Snacks, Beverages, Personal Care, Cleaning, Puja, Stationery, etc.)** (Amul Milk, Basmati Rice, Fortune Oil, Britannia Bread, Tata Tea, Surf Excel, etc.).
3. All dashboard metrics, line/bar charts, stock alerts, and AI business recommendations are live and interactive from the first second.

---

## 🏆 3-Minute Judges Demonstration Script

Follow this step-by-step walkthrough to showcase the core features during a competition presentation:

```
Step 1: Dashboard Overview (45s)
  • Point out the 4 KPI cards: Today's Sales (+% trend vs yesterday), Est. Gross Profit, Active Stock, and Low Stock Alerts.
  • Highlight the 7-day sales line chart (interactive tooltips, gradient fill) and the Inventory Health panel.
  • Show the "Products Requiring Immediate Attention" table with the 1-click restock button.

Step 2: Inventory Management (45s)
  • Click "Inventory" on the sidebar.
  • Type "Milk" or "RICE001" in the search box to demonstrate real-time instant filtering.
  • Filter by category (e.g. "Dairy" or "Grains") and sort by "Quantity (Lowest First)".
  • Click "+Qty" on any low-stock item to demonstrate the modal restock workflow.

Step 3: Point-of-Sale Billing & Thermal Receipt (45s)
  • Click "Sales & Billing" on the sidebar.
  • Click on a few product cards (e.g., Britannia Bread, Parle-G Biscuits) to add them to the bill.
  • Adjust quantities using "+" and "-" buttons. Show how stock limit boundaries prevent overselling.
  • Select a payment mode: "📱 UPI / QR".
  • Click "⚡ Confirm Sale & Print Bill" — the thermal retail invoice preview pops up immediately.
  • Note that inventory quantities decreased atomically across the system.

Step 4: AI Insights & Ask DukaanAI (45s)
  • Click "AI Insights" on the sidebar.
  • Review the algorithmic recommendation cards: Out-of-Stock warnings, Slow-Moving Stock detector, Star Products, and Low Margin warnings.
  • In the "Ask DukaanAI" query bar, click the preset chip: "🚨 What should I reorder?".
  • Watch the rule-based AI engine analyze actual live inventory and return an actionable restock plan!
```

---

## 🌟 Comprehensive Feature Matrix

### 1. 📊 Business Overview Dashboard
* **Today's Sales KPI:** Real-time revenue from transactions created today, with comparative percentage trend vs. yesterday.
* **Estimated Gross Profit KPI:** Calculated strictly as $\text{Sales Revenue} - \text{Cost of Goods Sold (COGS)}$.
* **Products in Stock KPI:** Active product count with total aggregate shelf units.
* **Low Stock Alerts KPI:** High-visibility amber/red alert badge indicating items needing reorder.
* **Sales Overview Visualization:** 7-day sales line chart with gradient area fill (powered by Chart.js with responsive SVG fallback).
* **Top Selling Products:** Horizontal bar chart ranking products by units sold.
* **Inventory Health Panel:** Visual distribution of Healthy, Low Stock, and Depleted products, plus inventory valuation at Cost vs. Retail price.
* **Quick Actions:** Instant shortcuts for Add Product, Record Sale, Add Expense, and AI Insights.

### 2. 📦 Inventory Management
* **Full CRUD Operations:** Add, edit, delete, and restock products with dedicated modals.
* **Input Validation:** Required product names, unique SKU verification, non-negative numbers for prices, and whole numbers for quantities.
* **Catalog Fields:** `id`, `name`, `sku`, `category`, `purchasePrice`, `sellingPrice`, `quantity`, `reorderLevel`.
* **Stock Badging:** Dynamic badges for *Healthy*, *Low Stock* ($\text{quantity} \le \text{reorderLevel}$), and *Out of Stock* ($\text{quantity} = 0$).
* **Real-time Search & Filter:** Instant search by name or SKU; filter by 9 categories; sort by name, quantity, and price.

### 3. 🛒 Sales & Point-of-Sale (POS) Counter
* **Multi-Item Counter Billing:** Add multiple unique product lines to a single invoice.
* **Stock Boundary Protection:** Prevents recording sales exceeding available stock quantity.
* **Price Snapshot Guarantee:** Stores `sellingPriceAtSale` and `purchaseCostAtSale` at time of sale so future product catalog price adjustments never distort historical accounting.
* **Atomic System Update:** Decrements inventory and creates transaction records together as one logical operation.
* **Payment Modes:** Supports Cash, UPI / QR, and Khata (Due).
* **Printable Thermal Receipt:** Generates an authentic retail tax invoice with print stylesheet (`@media print`) and store branding.
* **Sale Cancellation & Reversals:** Option to cancel completed invoices with automatic inventory restoration.

### 4. 💰 Expense Tracking & Net Profitability
* **Categorized Operating Expenses:** Rent, Electricity, Transport, Packaging, Maintenance, Other.
* **Period Filtering:** Today, Last 7 Days, This Month, All Time.
* **Financial Calculations:**
  $$\text{Total Sales Revenue} = \sum (\text{item.quantity} \times \text{item.sellingPriceAtSale})$$
  $$\text{Cost of Goods Sold (COGS)} = \sum (\text{item.quantity} \times \text{item.purchaseCostAtSale})$$
  $$\text{Gross Profit} = \text{Total Sales Revenue} - \text{COGS}$$
  $$\text{Estimated Operating Profit} = \text{Gross Profit} - \text{Total Operating Expenses}$$
  *(Unsold stock is treated as a capital asset, not an operational expense).*

### 5. 🧠 DukaanAI Business Intelligence
* **Rule-Based Algorithmic Heuristics:** Transparent business rules with no fake AI or black-box hallucination.
* **Automated Signals:**
  * 🚨 **Stockout Warnings:** Detects items with 0 stock and prompts emergency distributor reorders.
  * ⚠️ **Reorder Triggers:** Flags items below minimum threshold with remaining unit counts.
  * ⏳ **Slow-Moving Stock Detector:** Identifies products with inventory that have 0 sales in the period; suggests bundling or discounts.
  * ⭐ **Star Products:** Highlights best-selling items by revenue contribution and sales velocity.
  * 💡 **Margin Optimization:** Flags items with gross margins $< 12\%$ for price adjustments or distributor renegotiations.
  * 📊 **Expense Ratio Alerts:** Alerts if operating costs exceed $25\%$ of gross revenue.
* **"Ask DukaanAI" Interactive Copilot:** Natural language query bar with instant answering for questions regarding restocks, highest margin items, financial summaries, and cost leaks.

### 6. ⚙️ Store Settings & Data Operations
* **Store Identity:** Editable Shop Name, Owner/Proprietor, Phone Number, Store Address, and Receipt Tagline.
* **1-Click CSV Exports:**
  * `DukaanAI_inventory_[date].csv` (Full product catalog)
  * `DukaanAI_sales_[date].csv` (Complete transaction history)
  * `DukaanAI_expenses_[date].csv` (Categorized operational expenses)
* **Demo Data Reset:** 1-click reset button with confirmation modal to restore the pristine 7-day Kirana dataset at any time.

---

## 🎨 Design System Specifications

| Element | Specification |
| :--- | :--- |
| **Theme** | Dark Futuristic SaaS Aesthetic |
| **Background Base** | `#0B1020` |
| **Sidebar Navigation** | `#10172A` (Desktop fixed 260px, Mobile collapsible drawer) |
| **Surface Cards** | `#151E33` / Hover: `#1D2942` / Border: `#273449` |
| **Primary Accent** | `#8B5CF6` (Violet) / Light: `#A78BFA` / Dark: `#6D28D9` |
| **Status Colors** | Success: `#34D399` \| Warning: `#FBBF24` \| Danger: `#FB7185` \| Info: `#38BDF8` |
| **Typography** | Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto |
| **Accessibility** | High contrast text, visible focus rings, ARIA labels, ESC key modal dismiss |

---

## 📂 Project Architecture

```
Workshop-/
├── index.html       # Complete Single-Page Application (HTML5, CSS3, Vanilla JS)
├── README.md        # Comprehensive documentation & competition guide
└── .git/            # Version control repository
```

### 🔒 Prototype Architecture & Production Roadmap
* **Client-Side Prototype:** The application utilizes the browser's `localStorage` API for fast, zero-dependency offline persistence.
* **Production Deployment Roadmap:** For a multi-user, multi-store production deployment:
  1. **Backend:** Node.js (Express/Fastify) or Go REST/GraphQL API.
  2. **Database:** PostgreSQL with relational integrity, transactions, and foreign keys.
  3. **Authentication:** JWT / OAuth 2.0 with role-based access control (Cashier, Store Manager, Owner).
  4. **Cloud Infrastructure:** Hosted on GCP Cloud Run / AWS ECS with automated daily database backups.
  5. **Hardware Integration:** ESC/POS thermal printer driver via WebUSB / Bluetooth for physical receipts.

---

## 👨‍💻 Developer Profile
* **Project Type:** College Level Software Project Competition
* **Target Audience:** Indian Kirana & Small Retailers
* **License:** MIT License