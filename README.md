# 🚀 DealFlow360: Enterprise Deal Desk & Quotation Platform

DealFlow360 is a comprehensive, enterprise-grade Deal Desk and Quotation Management application. It empowers B2B sales teams to build complex quotes, calculate dynamic pricing and risk, manage multi-tier approvals, and streamline fulfillment—all from a single pane of glass.

## ✨ Key Features

*   📝 **Dynamic Quotation Builder**: Create quotes with real-time margin calculations, tier-based discounts, and automatic cross-sell/up-sell suggestions.
*   🛡️ **Smart Risk Engine**: Automated calculation of risk scores based on margins and discounts, triggering conditional multi-tier approval workflows.
*   ⚖️ **Customer Portal & Negotiations**: Dedicated customer-facing portal to review, accept, or counter-offer quotations.
*   📦 **Cross-Warehouse Inventory**: Deep integration with inventory for smart stock allocation and reservations across multiple distribution centers.
*   🧾 **Automated Billing & Invoicing**: Automated transition from confirmed deals to active subscriptions or one-time invoices with localized tax calculations (e.g., GST).
*   📊 **Sales Analytics & Deal Health**: Dashboards to track pipeline value, conversion rates, and the health status of active negotiations.

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React 18 + Vite
*   **Routing**: React Router DOM (v6)
*   **State Management**: React Query (TanStack Query) + Context API
*   **Styling**: Tailwind CSS + Lucide React Icons
*   **Forms & Validation**: React Hook Form + Zod

### Backend
*   **Runtime**: Node.js + Express
*   **Architecture**: Domain-Driven Design (Service-Controller-Repository Pattern)
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Security**: JSON Web Tokens (JWT) & bcrypt

## 📂 Project Structure

```text
├── Backend/
│   ├── prisma/             # Database schema & Seeders (schema.prisma, seed.js)
│   └── src/
│       ├── middleware/     # Auth and error handling middlewares
│       ├── modules/        # Domain-driven modules (quotations, inventory, billing, etc.)
│       ├── routes/         # Central API router (index.js)
│       └── server.js       # Entry point
└── Frontend/
    ├── src/
    │   ├── components/     # Reusable UI components & layouts
    │   ├── context/        # Global state (AuthContext)
    │   ├── hooks/          # Custom React queries
    │   ├── lib/            # Axios API config & Role utilities
    │   ├── pages/          # Role-based dashboards (Sales, Admin, Ops, Customer)
    │   └── routes/         # Protected routing logic (AppRoutes.jsx)
    └── index.html
```

## 🏗️ Domain Modules (Backend)

The backend has been heavily refactored into strict, decentralized domain modules to avoid monolithic antipatterns. Each module follows a layered `Controller → Service → Repository` architecture:

*   **Core Sales**: `quotations`, `approvals`, `negotiations`, `upsell`, `dealhealth`
*   **Catalog & Pricing**: `products`, `pricing`, `discounts`
*   **Operations**: `inventory`, `warehouses`, `fulfillment`
*   **Finance**: `billing`, `invoices`, `payments`, `subscriptions`
*   **Identity**: `users`, `customers`, `auth`

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Docker & Docker Compose (for PostgreSQL & Redis)

### 1. Database Setup
Start the local PostgreSQL container using Docker:
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd Backend
npm install

# Setup environment variables (.env)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dealflow360?schema=public"
# JWT_SECRET="your_jwt_secret"
# PORT=5000

# Push the schema and seed the database with mock catalog/users
npx prisma db push
node prisma/seed.js

# Start the backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd Frontend
npm install

# Setup environment variables (.env)
# VITE_API_BASE_URL="http://localhost:5000/api/v1"

# Start the frontend dev server
npm run dev
```

## 👥 Role-Based Access Control (RBAC)
The platform features distinct portals tailored for specific organizational roles:
*   **Sales Representative**: Deal creation, quotation builder, and negotiation handling.
*   **Sales Manager**: Deal pipeline overview and Tier-1 approvals.
*   **Finance/Ops**: Tax verification, invoicing, and fulfillment orchestration.
*   **Customer**: Read-only quote viewing, approval workflows, and counter-offers.
*   **Admin**: System governance, product/warehouse configurations, and user management.

## 📄 License
This project is proprietary and confidential. Unauthorized copying, distribution, or modifications are strictly prohibited.
