<div align="center">

# 🚀 DealFlow360

### Next-Generation Deal Desk · CPQ · Sales Operations Engine

<br/>

![DealFlow360 Banner](odoo/22.jpeg)

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-RT-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)

<br/>

*A comprehensive, end-to-end enterprise sales platform that bridges **deal generation**, **executive governance**, **customer negotiation**, **multi-warehouse fulfillment**, and **hybrid billing** — all in one seamless experience.*

</div>

---

<br/>

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Deal Lifecycle](#-deal-lifecycle)
- [System Architecture](#-system-architecture)
- [Database Design (ER Diagram)](#-database-design--er-diagram)
- [Application Workflow](#-application-workflow-flowchart)
- [Tech Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Frontend Pages](#-frontend-pages--screens)
- [UI Showcase](#-ui-showcase--inspiration)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Default Credentials](#-default-test-credentials)
- [License](#-license)

---

<br/>

## 🌟 Overview

**DealFlow360** is a full-stack web application purpose-built for complex B2B sales operations. It covers the **entire deal lifecycle** — from the moment a Sales Rep generates a quotation, through multi-tier executive approval governance, customer-facing negotiation portals, intelligent multi-warehouse fulfillment, all the way to hybrid invoicing and recurring subscription billing.

The platform draws deep inspiration from enterprise-grade ERP systems like **Odoo**, while leveraging a modern **React + Node.js** architecture for blazing-fast user experiences.

<div align="center">

![Dashboard](odoo/10.jpeg)

*Executive Sales Dashboard with real-time KPIs, pipeline analytics, and deal velocity tracking*

</div>

---

<br/>

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🧾 Intelligent CPQ Engine
- Smart product bundling with upsell/cross-sell suggestions
- Real-time margin impact calculations
- Multi-version quotation tracking with diff views
- Variant-aware product configuration
- Category & tier-based dynamic pricing

</td>
<td width="50%">

### 🛡️ Automated Risk & Governance
- Dynamic risk scoring formula (0–100 scale)
- Customer tier + category blended discount ceilings
- Auto-routing to approval queues (Manager → VP → Finance)
- Configurable `ApprovalRule` thresholds
- Full audit trail logging via `AuditLog`

</td>
</tr>
<tr>
<td>

### 🌐 Customer Negotiation Portal
- Secure, shareable quotation links
- Counter-offer & discount proposal submissions
- **Line-item level commenting** for specific product queries
- Accept / Decline / Negotiate workflow
- PDF download of official commercial proposals

</td>
<td>

### 🚚 Multi-Warehouse Fulfillment
- AI-optimized warehouse split across inventory hubs
- SLA-based delivery tiers (Same-Day → Economy)
- Real-time backorder detection & consolidation
- Simulate shipment dispatch & instant delivery (test mode)
- Expedite ETA with one-click actions

</td>
</tr>
<tr>
<td>

### 💳 Hybrid Billing & Subscriptions
- One-time hardware + recurring SaaS on the same order
- Automatic invoice generation on delivery
- Proration for mid-cycle upgrades/downgrades
- Credit note generation on cancellations
- Payment tracking with multiple payment methods

</td>
<td>

### 📊 Deal Health & Analytics
- Stalled deal detection (inactive > 7 days)
- Discount anomaly radar with risk badges
- Delivery promise slippage tracking
- One-click nudge & executive escalation
- PDF/Excel export for executive reporting

</td>
</tr>
</table>

---

<br/>

## 🔄 Deal Lifecycle

The complete journey of a deal through DealFlow360 follows an 8-stage lifecycle:

<div align="center">

![Deal Lifecycle](docs/images/deal_lifecycle.png)

</div>

| Stage | Description | Key Actions |
|:---:|:---|:---|
| **1. Prospect** | Lead/customer is identified and added to the CRM | Create customer profile, assign tier |
| **2. Quote** | Sales Rep builds a quotation using the CPQ engine | Add products, configure pricing, apply discounts |
| **3. Risk Review** | Automated risk engine scores the deal (0–100) | Category ceilings, tier limits, margin analysis |
| **4. Approval** | Routed to appropriate approver based on risk score | Manager/VP/Finance reviews and approves/rejects |
| **5. Negotiate** | Customer receives proposal on the portal | Accept, counter-propose, or decline |
| **6. Convert** | Confirmed quotation converts into an active Order | Order items snapshot, inventory reservation |
| **7. Fulfill** | Multi-warehouse fulfillment plan is generated | Warehouse splits, SLA selection, dispatch |
| **8. Bill** | Invoice generated, payment collected | One-time + subscription billing cycles |

---

<br/>

## 🏗 System Architecture

DealFlow360 uses a **domain-driven micro-architecture** with clear service boundaries:

<div align="center">

![System Architecture](docs/images/system_architecture.png)

</div>

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐    │
│  │  React 18    │  │ Customer Portal  │  │  Admin Dashboard  │    │
│  │  (Vite 5.4)  │  │   (Public View)  │  │  (Role-Based)     │    │
│  └──────┬───────┘  └───────┬──────────┘  └────────┬──────────┘    │
│         └──────────────────┼──────────────────────┘               │
│                            │ Axios + React Query                  │
├────────────────────────────┼──────────────────────────────────────┤
│                     API GATEWAY LAYER                            │
│  ┌─────────────────────────┼─────────────────────────────────┐   │
│  │          Express.js REST API (Port 5001)                  │   │
│  │   JWT Auth │ CORS │ Rate Limiting │ Error Handler         │   │
│  │                Socket.io (Real-time Events)               │   │
│  └─────────────────────────┼─────────────────────────────────┘   │
├────────────────────────────┼──────────────────────────────────────┤
│                     SERVICE LAYER (24 Modules)                   │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Quotations │ │   Risk   │ │Approvals │ │   Fulfillment    │  │
│  │  Service   │ │  Engine  │ │ Workflow │ │     Engine       │  │
│  └────────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  Invoice   │ │Subscript.│ │  Deal    │ │  Notifications   │  │
│  │  Billing   │ │ Manager  │ │  Health  │ │  (Email/Socket)  │  │
│  └────────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   PostgreSQL 16  ←→  Prisma ORM  ←→  Docker Compose     │   │
│  │   21 Tables  │  6 Enums  │  Full Relational Integrity    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

<br/>

## 🗄 Database Design / ER Diagram

The database uses **PostgreSQL** with **Prisma ORM** and consists of **21 tables** organized into 5 bounded contexts:

<div align="center">

![Database ER Diagram](docs/images/database_er_diagram.png)

*Complete Entity-Relationship diagram showing all tables, primary keys, foreign keys, and relationships*

</div>

### Database Tables & Relationships

#### 🔐 Identity & Configuration

| Table | Primary Key | Key Columns | Relationships |
|:---|:---:|:---|:---|
| **User** | `id` (UUID) | email, name, role (enum) | → QuotationVersion (creator), → AuditLog (actor) |
| **CustomerTier** | `id` (UUID) | name (unique), description | → ProductPricing, → DiscountRule |
| **ApprovalRule** | `id` (UUID) | minRiskScore, maxRiskScore, requiredApproverLevel | Standalone config |

#### 📦 Products & Pricing

| Table | Primary Key | Key Columns | Relationships |
|:---|:---:|:---|:---|
| **Product** | `id` (UUID) | name, category, isSubscription, variantAttributes | → ProductPricing, → Inventory |
| **ProductPricing** | `id` (UUID) | price (Decimal 12,2) | FK → Product, FK → CustomerTier |
| **DiscountRule** | `id` (UUID) | appliedTo (TIER/CATEGORY), maxDiscountPercentage | FK → CustomerTier |

#### 🧾 Quotation & Negotiation

| Table | Primary Key | Key Columns | Relationships |
|:---|:---:|:---|:---|
| **Quotation** | `id` (UUID) | quotationNumber (unique), status (enum: 9 states) | FK → QuotationVersion (active), → Order |
| **QuotationVersion** | `id` (UUID) | versionNumber, totalAmount, totalDiscount, riskScore | FK → Quotation, FK → User |
| **QuotationItem** | `id` (UUID) | quantity, unitPrice, discountPercentage | FK → QuotationVersion, FK → Product |
| **ApprovalRequest** | `id` (UUID) | assignedRole, status (PENDING/APPROVED/REJECTED/RETURNED) | FK → QuotationVersion |
| **NegotiationMessage** | `id` (UUID) | content, proposedDiscount, senderRole | FK → QuotationVersion |

#### 🚚 Inventory & Fulfillment

| Table | Primary Key | Key Columns | Relationships |
|:---|:---:|:---|:---|
| **Warehouse** | `id` (UUID) | code (unique), name, location | → Inventory, → FulfillmentItem |
| **Inventory** | `id` (UUID) | availableQuantity, reservedQuantity | FK → Warehouse, FK → Product (composite unique) |
| **FulfillmentPlan** | `id` (UUID) | optimizationMode (enum), totalCost, shipmentCount | FK → Order (1:1) |
| **FulfillmentItem** | `id` (UUID) | quantity, status (PENDING/SHIPPED/DELIVERED/BACKORDER) | FK → FulfillmentPlan, FK → Warehouse |

#### 💰 Orders, Invoices & Subscriptions

| Table | Primary Key | Key Columns | Relationships |
|:---|:---:|:---|:---|
| **Order** | `id` (UUID) | orderNumber (unique), status (enum), totalAmount | FK → Quotation (1:1), → OrderItem, → Invoice, → Subscription |
| **OrderItem** | `id` (UUID) | snapshotName, snapshotUnitPrice, snapshotDiscount | FK → Order |
| **Invoice** | `id` (UUID) | invoiceNumber (unique), status (enum), totalAmount, taxAmount | FK → Order, → Payment |
| **Payment** | `id` (UUID) | amount, paymentMethod, reference | FK → Invoice |
| **Subscription** | `id` (UUID) | interval (MONTHLY/QUARTERLY/YEARLY), nextBillingDate | FK → Order |

#### 📝 Audit & Events

| Table | Primary Key | Key Columns | Relationships |
|:---|:---:|:---|:---|
| **AuditLog** | `id` (UUID) | entityType, action, oldData (JSON), newData (JSON) | FK → User (actor) |
| **OutboxEvent** | `id` (UUID) | eventType, aggregateType, payload (JSON), status | Standalone (event sourcing) |

### Mermaid ER Diagram

```mermaid
erDiagram
    User ||--o{ QuotationVersion : "creates"
    User ||--o{ AuditLog : "performs"
    
    CustomerTier ||--o{ ProductPricing : "defines pricing"
    CustomerTier ||--o{ DiscountRule : "governs discounts"
    
    Product ||--o{ ProductPricing : "has prices"
    Product ||--o{ Inventory : "stocked in"
    
    Quotation ||--o| QuotationVersion : "active version"
    Quotation ||--o{ QuotationVersion : "all versions"
    Quotation ||--o| Order : "converts to"
    
    QuotationVersion ||--o{ QuotationItem : "contains"
    QuotationVersion ||--o{ ApprovalRequest : "requires"
    QuotationVersion ||--o{ NegotiationMessage : "has messages"
    
    Order ||--o{ OrderItem : "contains"
    Order ||--o| FulfillmentPlan : "has plan"
    Order ||--o{ Invoice : "billed via"
    Order ||--o{ Subscription : "recurring"
    
    Warehouse ||--o{ Inventory : "stores"
    Warehouse ||--o{ FulfillmentItem : "dispatches"
    
    FulfillmentPlan ||--o{ FulfillmentItem : "splits into"
    Invoice ||--o{ Payment : "receives"

    User {
        uuid id PK
        string email UK
        string name
        enum role
        boolean isActive
    }
    
    Product {
        uuid id PK
        string name
        string category
        boolean isSubscription
        json variantAttributes
    }
    
    Quotation {
        uuid id PK
        string quotationNumber UK
        string customerId
        string salesRepId
        enum status
        uuid activeVersionId FK
    }
    
    QuotationVersion {
        uuid id PK
        uuid quotationId FK
        int versionNumber
        decimal totalAmount
        decimal totalDiscount
        int riskScore
        uuid createdById FK
    }
    
    Order {
        uuid id PK
        string orderNumber UK
        uuid quotationId FK
        string customerId
        enum status
        decimal totalAmount
    }
    
    Invoice {
        uuid id PK
        string invoiceNumber UK
        uuid orderId FK
        enum status
        decimal totalAmount
        decimal taxAmount
    }
    
    Warehouse {
        uuid id PK
        string code UK
        string name
        string location
    }
    
    FulfillmentPlan {
        uuid id PK
        uuid orderId FK
        enum optimizationMode
        decimal totalCost
        int shipmentCount
    }
    
    Subscription {
        uuid id PK
        uuid orderId FK
        string interval
        enum status
        datetime nextBillingDate
    }
```

---

<br/>

## 📈 Application Workflow (Flowchart)

<div align="center">

![Workflow Flowchart](docs/images/workflow_flowchart.png)

*Complete deal lifecycle from quotation creation to payment collection*

</div>

### Detailed Workflow Sequence

```mermaid
sequenceDiagram
    actor SR as 👤 Sales Rep
    participant CPQ as 🧾 CPQ Engine
    participant RE as 🛡️ Risk Engine
    participant AQ as 📋 Approval Queue
    actor MGR as 👔 Manager/VP
    participant CP as 🌐 Customer Portal
    actor CUST as 🏢 Customer
    participant FE as 🚚 Fulfillment Engine
    participant BL as 💳 Billing System

    Note over SR,BL: PHASE 1 — QUOTATION CREATION
    SR->>CPQ: Create Draft Quotation
    CPQ->>CPQ: Add products, configure pricing
    CPQ->>RE: Submit for Risk Assessment
    RE->>RE: Calculate risk score (tier + category + discount)
    
    Note over SR,BL: PHASE 2 — GOVERNANCE & APPROVAL
    alt Risk Score 0-40 (Low)
        RE-->>CPQ: Auto-Approved ✅
    else Risk Score 41-70 (Medium)
        RE->>AQ: Route to Sales Manager
        AQ->>MGR: Notify for review
        MGR-->>AQ: Approve / Reject / Return
    else Risk Score 71-100 (High)
        RE->>AQ: Route to VP + Finance
        AQ->>MGR: Escalated review required
        MGR-->>AQ: Approve / Reject / Return
    end
    
    Note over SR,BL: PHASE 3 — CUSTOMER NEGOTIATION
    SR->>CP: Publish quote to Customer Portal
    CP->>CUST: Email notification with secure link
    
    alt Customer Accepts
        CUST-->>CP: ✅ Confirm quotation
    else Customer Counter-Proposes
        CUST->>CP: Submit counter-discount + notes
        CP->>CPQ: Create new version (v2, v3...)
        CPQ->>RE: Re-evaluate risk score
        Note right of RE: Loop back to approval if needed
    else Customer Declines
        CUST-->>CP: ❌ Decline proposal
    end
    
    Note over SR,BL: PHASE 4 — ORDER & FULFILLMENT
    CP->>FE: Convert confirmed quote → Order
    FE->>FE: Generate FulfillmentPlan
    FE->>FE: Split across warehouses by inventory
    FE->>FE: Assign SLA tier (Same-Day/Express/Standard)
    FE-->>SR: Dispatch shipments
    
    Note over SR,BL: PHASE 5 — BILLING & SUBSCRIPTION
    FE->>BL: On delivery → Generate Invoice
    BL->>CUST: Send invoice for payment
    CUST-->>BL: Record payment
    
    alt Has Subscription Items
        BL->>BL: Create recurring Subscription
        BL->>BL: Schedule next billing date
    end
```

---

<br/>

## 🛠 Technology Stack

<table align="center">
<tr>
<td align="center"><strong>Layer</strong></td>
<td align="center"><strong>Technology</strong></td>
<td align="center"><strong>Purpose</strong></td>
</tr>
<tr><td>Frontend Framework</td><td>React 18.3</td><td>Component-based UI</td></tr>
<tr><td>Build Tool</td><td>Vite 5.4</td><td>Lightning-fast HMR & bundling</td></tr>
<tr><td>Styling</td><td>Tailwind CSS 3.4</td><td>Utility-first CSS framework</td></tr>
<tr><td>State & Data</td><td>TanStack React Query 5</td><td>Server state management & caching</td></tr>
<tr><td>Forms</td><td>React Hook Form + Zod</td><td>Type-safe form validation</td></tr>
<tr><td>Routing</td><td>React Router 6</td><td>Client-side navigation</td></tr>
<tr><td>Charts</td><td>Recharts 2</td><td>Data visualization & analytics</td></tr>
<tr><td>Icons</td><td>Lucide React</td><td>Beautiful, consistent iconography</td></tr>
<tr><td>PDF Generation</td><td>jsPDF + html2canvas</td><td>Commercial proposal PDF exports</td></tr>
<tr><td>Excel Export</td><td>SheetJS (xlsx)</td><td>Report data exports</td></tr>
<tr><td>Backend Runtime</td><td>Node.js 18+</td><td>JavaScript server runtime</td></tr>
<tr><td>API Framework</td><td>Express.js</td><td>REST API with middleware pipeline</td></tr>
<tr><td>ORM</td><td>Prisma</td><td>Type-safe database access layer</td></tr>
<tr><td>Database</td><td>PostgreSQL 16</td><td>Relational data persistence</td></tr>
<tr><td>Real-time</td><td>Socket.io</td><td>WebSocket events for live updates</td></tr>
<tr><td>Auth</td><td>JWT + bcrypt</td><td>Token-based authentication</td></tr>
<tr><td>Containerization</td><td>Docker Compose</td><td>Database container orchestration</td></tr>
<tr><td>HTTP Client</td><td>Axios</td><td>API communication from frontend</td></tr>
<tr><td>Toasts</td><td>Sonner</td><td>Beautiful notification system</td></tr>
</table>

---

<br/>

## 📁 Project Structure

```
DealFlow360/
├── 📂 Backend/
│   ├── 📂 prisma/
│   │   ├── schema.prisma          # 21 tables, 6 enums, full relational schema
│   │   ├── seed.js                # Development seed data
│   │   └── seed-large.js          # Large-scale test data seeder
│   ├── 📂 src/
│   │   ├── 📂 modules/            # 24 domain-driven service modules
│   │   │   ├── 📂 auth/           # JWT signup/login, Google OAuth, role normalization
│   │   │   ├── 📂 quotations/     # CPQ: create, version, risk evaluate, send, confirm
│   │   │   ├── 📂 approvals/      # Multi-tier governance approval workflow
│   │   │   ├── 📂 negotiations/   # Customer counter-offers & messaging
│   │   │   ├── 📂 risk/           # Dynamic risk engine (tier + category formula)
│   │   │   ├── 📂 fulfillment/    # Multi-warehouse split, SLA routing, dispatch
│   │   │   ├── 📂 invoices/       # Invoice generation, credit notes, tax calculation
│   │   │   ├── 📂 payments/       # Payment recording & reconciliation
│   │   │   ├── 📂 subscriptions/  # Recurring billing, proration, cancellation
│   │   │   ├── 📂 inventory/      # Warehouse stock levels, reservation, availability
│   │   │   ├── 📂 products/       # Product catalog, variants, categories
│   │   │   ├── 📂 pricing/        # Tier-based dynamic pricing rules
│   │   │   ├── 📂 discounts/      # Discount ceiling configuration
│   │   │   ├── 📂 customers/      # Customer CRUD + tier assignment
│   │   │   ├── 📂 dealhealth/     # Stalled deals, anomalies, slippage, nudge/escalate
│   │   │   ├── 📂 analytics/      # Dashboard KPIs, pipeline metrics
│   │   │   ├── 📂 dashboard/      # Executive summary aggregations
│   │   │   ├── 📂 notifications/  # Email (Brevo), socket, event dispatch
│   │   │   ├── 📂 upsell/         # Cross-sell & upsell suggestion engine
│   │   │   ├── 📂 billing/        # Hybrid billing orchestration
│   │   │   ├── 📂 warehouses/     # Warehouse CRUD management
│   │   │   ├── 📂 users/          # User management & roles
│   │   │   ├── 📂 admin/          # Admin configuration endpoints
│   │   │   └── 📂 customer/       # Customer-facing portal API
│   │   ├── 📂 utils/              # Response helpers, error classes, token utils
│   │   └── server.js              # Express app entry point
│   ├── docker-compose.yml         # PostgreSQL container definition
│   └── package.json
│
├── 📂 Frontend/
│   ├── 📂 src/
│   │   ├── 📂 components/         # Shared UI components (Logo, StatusBadge, etc.)
│   │   ├── 📂 context/            # AuthContext (JWT state management)
│   │   ├── 📂 features/           # Feature-specific API clients & hooks
│   │   │   ├── fulfillment.api.js
│   │   │   └── ...
│   │   ├── 📂 layouts/            # AuthLayout, SalesLayout (sidebar + topbar)
│   │   ├── 📂 lib/                # Axios instance, role utilities
│   │   ├── 📂 pages/
│   │   │   ├── 📂 auth/           # Login.jsx, Signup.jsx (role-based onboarding)
│   │   │   ├── 📂 sales/          # 14 screens (see Frontend Pages section)
│   │   │   ├── 📂 customer/       # CustomerQuotationView, CustomerInvoices
│   │   │   ├── 📂 admin/          # Admin configuration panels
│   │   │   └── 📂 common/         # Shared page components
│   │   ├── 📂 routes/             # AppRoutes.jsx (protected + public routes)
│   │   └── 📂 utils/              # PDF generator, formatters
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
├── 📂 docs/
│   └── 📂 images/                 # Generated diagrams & visual assets
│       ├── database_er_diagram.png
│       ├── workflow_flowchart.png
│       ├── system_architecture.png
│       └── deal_lifecycle.png
│
├── 📂 odoo/                       # UI inspiration & reference screenshots
├── run_dealflow360.bat             # One-click startup script (Windows)
├── DealFlow360.pdf                 # Original problem statement
└── README.md                      # ← You are here
```

---

<br/>

## 📡 API Reference

Base URL: `http://localhost:5001/api/v1`

### Authentication
| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/auth/signup` | Register new user (with role selection) |
| `POST` | `/auth/login` | Login with email + password |
| `GET` | `/auth/google` | Google OAuth redirect |
| `GET` | `/auth/me` | Get current authenticated user |

### Quotations & CPQ
| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/quotations` | List all quotations (filtered by role) |
| `GET` | `/quotations/:id` | Get quotation detail with versions, items, approvals |
| `POST` | `/quotations` | Create new draft quotation |
| `PUT` | `/quotations/:id` | Update quotation (add items, apply discounts) |
| `POST` | `/quotations/:id/submit` | Submit for risk evaluation + governance |
| `POST` | `/quotations/:id/send` | Publish to Customer Portal |
| `POST` | `/quotations/:id/confirm` | Confirm → Convert to Order |
| `POST` | `/quotations/:id/decline` | Decline quotation |
| `POST` | `/quotations/:id/negotiate` | Customer counter-proposal |

### Approvals
| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/approvals` | List pending approval requests |
| `POST` | `/approvals/:id/approve` | Approve a quotation version |
| `POST` | `/approvals/:id/reject` | Reject with comments |
| `POST` | `/approvals/:id/return` | Return for revision |

### Fulfillment & Inventory
| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/fulfillment` | List all fulfillment plans |
| `GET` | `/fulfillment/:orderId` | Get fulfillment plan for an order |
| `POST` | `/fulfillment/:orderId/accept` | Accept & dispatch shipment |
| `POST` | `/fulfillment/:orderId/deliver` | Mark as delivered (simulate) |
| `GET` | `/inventory/availability/:productId` | Check stock across warehouses |

### Invoices & Payments
| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/invoices` | List all invoices |
| `GET` | `/invoices/:id` | Get invoice detail with payments |
| `POST` | `/invoices/:id/pay` | Record a payment |
| `POST` | `/invoices/:id/quick-pay` | One-click full payment (test) |

### Subscriptions
| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/subscriptions` | List all subscriptions |
| `PUT` | `/subscriptions/:id` | Modify subscription (upgrade/downgrade) |
| `POST` | `/subscriptions/:id/cancel` | Cancel with proration |
| `POST` | `/subscriptions/:id/prorate` | Process proration adjustment |

### Deal Health & Analytics
| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/dealhealth` | Get deal health dashboard data |
| `POST` | `/dealhealth/nudge` | Send automated follow-up nudge |
| `POST` | `/dealhealth/escalate` | Escalate deal to VP/leadership |
| `POST` | `/dealhealth/expedite` | Expedite delayed fulfillment ETA |
| `GET` | `/dashboard` | Executive summary KPIs |
| `GET` | `/analytics/pipeline` | Pipeline velocity metrics |

### Customers & Products
| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/customers` | List customers with tier info |
| `GET` | `/customers/:id` | Customer detail + history |
| `POST` | `/customers` | Create new customer |
| `GET` | `/products` | Product catalog |
| `GET` | `/products/:id` | Product detail with pricing tiers |

---

<br/>

## 🖥 Frontend Pages & Screens

### Sales Workspace (14 Screens)

| Screen | File | Description |
|:---|:---|:---|
| 📊 Pipeline Dashboard | `Pipeline.jsx` | Visual deal pipeline with drag stages & KPIs |
| 📝 Quotation Builder | `QuotationBuilder.jsx` | CPQ interface for building quotations |
| 📋 Quotations List | `QuotationsList.jsx` | Searchable, filterable quotation table |
| 🔍 Quotation Detail | `QuotationDetail.jsx` | Full version history, margin breakdown, approval status |
| ✅ Approvals Queue | `Approvals.jsx` | Pending governance approvals with action buttons |
| 🚚 Fulfillment List | `FulfillmentList.jsx` | All orders with fulfillment status tracking |
| 📦 Warehouse Split | `WarehouseSplit.jsx` | Interactive warehouse allocation & SLA selection |
| 💰 Invoices List | `InvoicesList.jsx` | All invoices with payment status |
| 💳 Billing Hub | `BillingHub.jsx` | Unified billing dashboard |
| 🔄 Subscriptions | `SubscriptionsList.jsx` | Recurring subscription management |
| 🏥 Deal Health | `DealHealth.jsx` | Anomaly radar with nudge/escalate actions |
| 👥 Customers | `Customers.jsx` | CRM with tier assignments |
| 👤 Customer Detail | `CustomerDetail.jsx` | Individual customer profile & deal history |
| 📈 Reports | `Reports.jsx` | PDF/Excel export analytics |

### Customer Portal (2 Screens)

| Screen | File | Description |
|:---|:---|:---|
| 🌐 Quotation View | `CustomerQuotationView.jsx` | Public proposal view with accept/negotiate/decline |
| 🧾 Customer Invoices | `CustomerInvoices.jsx` | Customer-facing invoice & payment portal |

### Authentication (2 Screens)

| Screen | File | Description |
|:---|:---|:---|
| 🔑 Login | `Login.jsx` | Email/password + Google OAuth login |
| 📝 Signup | `Signup.jsx` | Role-based account creation |

---

<br/>

## 🎨 UI Showcase & Inspiration

Our interface draws deep inspiration from world-class enterprise ERP implementations, combining powerful functionality with stunning visual design:

<div align="center">

<table>
<tr>
<td><img src="odoo/2.jpeg" alt="UI 1" width="100%"/></td>
<td><img src="odoo/8.jpeg" alt="UI 2" width="100%"/></td>
</tr>
<tr>
<td><img src="odoo/15.jpeg" alt="UI 3" width="100%"/></td>
<td><img src="odoo/28.jpeg" alt="UI 4" width="100%"/></td>
</tr>
<tr>
<td><img src="odoo/34.jpeg" alt="UI 5" width="100%"/></td>
<td><img src="odoo/42.jpeg" alt="UI 6" width="100%"/></td>
</tr>
<tr>
<td><img src="odoo/45.jpeg" alt="UI 7" width="100%"/></td>
<td><img src="odoo/48.jpeg" alt="UI 8" width="100%"/></td>
</tr>
</table>

</div>

---

<br/>

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|:---|:---|
| Node.js | 18+ |
| Docker & Docker Compose | Latest |
| Git | Latest |
| npm | 9+ |

### ⚡ Quick Start (One-Click)

A startup batch script is provided at the project root:

```bash
# Windows — double-click or run:
.\run_dealflow360.bat
```

This automatically:
1. Spins up the PostgreSQL database container
2. Runs Prisma migrations
3. Seeds the database with test data
4. Starts the backend API server (port 5001)
5. Starts the frontend dev server (port 5173)

### 🔧 Manual Setup

**Step 1: Database**
```bash
cd Backend
docker-compose up -d
```

**Step 2: Backend**
```bash
cd Backend
npm install
npx prisma migrate dev --name init
npm run seed          # Seeds demo data (users, products, warehouses, customers)
npm run dev           # Starts Express server on port 5001
```

**Step 3: Frontend**
```bash
cd Frontend
npm install
npm run dev           # Starts Vite dev server on port 5173
```

**Step 4: Open in Browser**
```
http://localhost:5173
```

---

<br/>

## 🔑 Environment Variables

### Backend (`Backend/.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dealflow360?schema=public"
JWT_SECRET="your-secret-key-here"
PORT=5001
NODE_ENV=development
```

### Frontend (`Frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

---

<br/>

## 👤 Default Test Credentials

After seeding, the following accounts are available:

| Role | Email | Password |
|:---|:---|:---|
| Sales Representative | `sales@dealflow360.com` | `password123` |
| Sales Manager | `manager@dealflow360.com` | `password123` |
| Finance Controller | `finance@dealflow360.com` | `password123` |
| Operations | `ops@dealflow360.com` | `password123` |
| Customer | `customer@dealflow360.com` | `password123` |
| Admin | `admin@dealflow360.com` | `password123` |

> **Note:** You can also create new accounts via the Signup page with any role.

---

<br/>

## 🗂 Enum Reference

| Enum | Values |
|:---|:---|
| **Role** | `ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE`, `OPERATIONS`, `CUSTOMER` |
| **QuotationStatus** | `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `NEGOTIATION`, `SENT`, `CONFIRMED`, `CONVERTED`, `CANCELLED` |
| **ApprovalStatus** | `PENDING`, `APPROVED`, `REJECTED`, `RETURNED` |
| **OrderStatus** | `PROCESSING`, `PARTIAL_FULFILLMENT`, `FULFILLED`, `CANCELLED` |
| **FulfillmentStatus** | `PENDING`, `SHIPPED`, `DELIVERED`, `BACKORDER`, `CANCELLED` |
| **InvoiceStatus** | `DRAFT`, `SENT`, `PARTIAL`, `PAID`, `OVERDUE` |
| **SubscriptionStatus** | `ACTIVE`, `PAUSED`, `CANCELLED` |
| **FulfillmentMode** | `LOWEST_COST`, `MIN_SHIPMENTS`, `BALANCED` |
| **DiscountAppliedTo** | `TIER`, `CATEGORY` |

---

<br/>

## 📄 License

This project is developed as part of the **PCC 2026 Problem Statement** challenge. All rights reserved.

---

<div align="center">
  <br/>
  <strong>Built with ❤️ for DealFlow360</strong>
  <br/><br/>
  <sub>Enterprise-grade CPQ • Governance • Fulfillment • Billing — all in one.</sub>
</div>
