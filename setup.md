# DealFlow360 — Full Project Specification

This document is the working spec for building DealFlow360 end to end. It should be read **alongside the original problem statement PDF** (attached separately) — the PDF is the source of truth for business rules; this document translates that into the actual screens, data, and build order based on the approved wireframe.

Foundation status: backend (Node/Express/Prisma modular monolith), frontend (React/Vite/Tailwind/shadcn), and a minimal auth-only database schema are already scaffolded and working. This spec covers everything from here to a demo-ready product.

---

## 1. Tech Stack (already locked in)

**Backend:** Node.js, Express, JavaScript (not TypeScript), PostgreSQL + Prisma, RabbitMQ, Redis, JWT + bcrypt, Google OAuth (optional), Brevo (optional), modular monolith architecture.

**Frontend:** React + Vite (JavaScript), React Router, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form + Zod, Axios, Recharts, Lucide React, Sonner.

**Infra:** Docker Compose only (Postgres, Redis, RabbitMQ, backend, frontend). No Kubernetes.

---

## 2. Screen-by-Screen Specification (from approved wireframe)

Each screen below shares a common top nav bar (Dashboard / Quotations / Approvals / Fulfillment / Customers / Products / Subscriptions / Invoices / Deal Health / Admin) with the current section highlighted. Two user tracks exist: **internal (sales rep / manager / finance / ops / admin)** and **customer (portal)** — kept on visibly separate layouts, never the same screen relabeled.

1. **Login / Signup** — email/password fields, log in and sign up actions, link to forgot password. Same screen serves both internal users and customers logging into their respective areas (redirect by role after auth).
2. **Sales Dashboard / Home** — KPI-style widgets (active quotations, pending approvals, at-risk deals), a recent-activity feed (quote created, discount requested, payment received), quick actions (new quotation, view at-risk).
3. **Quotations List** — tabbed/column view by status (Draft, Pending Approval, Approved, Rejected, Confirmed), each entry showing customer, amount, rep, age. "New Quotation" action. Selecting a row opens Quotation Detail.
4. **Quotation Detail (Builder)** — customer + rep header, editable line items (product, quantity, unit price, discount %), running total and live margin indicator, a highlighted banner when a line breaks its category discount ceiling, and actions to save draft / submit for approval. This is where the upsell/cross-sell panel lives alongside the cart.
5. **Fulfillment Detail** — for a specific quotation/order: recommended warehouse split (warehouse, quantity, distance/cost), a highlighted note when backorder exists, "Accept Suggested Split" and "Manual Override" actions.
6. **Fulfillment List** — all orders needing fulfillment action, with status column (Pending Split / Partially Fulfilled / Fulfilled), filterable.
7. **Approval Detail** — shows the quotation's blended risk score, a horizontal stepper (Submitted → Manager Review → Finance Review → Approved), reviewer comments, and Approve / Return for Revision / Reject actions with a required reason field.
8. **Approvals List** — queue of quotations awaiting the current user's decision, filterable by status (Pending / Approved / Rejected), showing customer, rep, risk score, age.
9. **Subscriptions List** — recurring plans per customer, status badges (Active / Paused / Cancelled), next billing date, plan type (monthly/quarterly/yearly).
10. **Billing Detail** — for one order: one-time lines and recurring lines shown in separate sections, upcoming billing schedule for recurring lines, "Modify Subscription" / "Cancel Subscription" actions (with automatic credit-note note when applicable).
11. **Customer Portal Negotiation Screen** — customer-facing, separate layout. Shows quote status (Sent / Under Negotiation / Confirmed), line-level comment/change-request field, a counter-discount field, "Submit Request" and "Confirm Quotation" buttons. Confirming with terms over threshold silently re-enters the Approval flow (screen 7).
12. **Invoices List** — all invoices with status badges (Draft / Sent / Paid / Overdue), customer, amount, due date.
13. **Invoice Detail** — line items, a payment-status stepper (Created → Sent → Paid), "Record Payment" / "Send Reminder" actions.
14. **Deal Health & Anomaly Dashboard** — stalled-deal list (inactive beyond N days), discount-anomaly alerts (rep's discount vs their historical average), delivery-slippage indicators, "Escalate" / "Nudge" actions that open the related quotation.
15. **Admin / Reporting Dashboard (optional/stretch)** — cross-sales-team reporting, filters by period/team/status/product, export buttons (PDF/XLS).
16. **Product Catalog** — list of products with tier/category/price/type (goods/service/subscription), "Add Product" and "Manage Price Lists" actions.
17. **Product Detail Page** — full product form: name, category, tier-based pricing, subscription toggle + recurring interval, quantity on hand, variant attributes.
18. **Discount Tiers & Approval Chain Config** — two config tables side by side: customer tier → max discount (Bronze/Silver/Gold), and category → max discount (Hardware/Services/etc); below that, the approval-chain rule table mapping risk ranges to required approver level (no approval / Sales Manager / Sales Manager then Finance), with a "Save Configuration" action.

---

## 3. Build Phases

Each phase is a **separate task** for the IDE. Do not start a phase until the previous one is confirmed working. Each phase should end with a short demo-able result (a screen you can click through, or an API you can hit with a real request) — not just files created.

### Phase 1 — Admin configuration foundation
Screens 16, 17, 18. Build backend CRUD for Products, Price Lists, Customer Tiers, Discount Rules (tier ceiling + category ceiling), and Approval Rules (risk range → approver level). Build the matching frontend admin screens. **Why first:** every downstream module (quotations, discounts, approvals) reads this config — nothing else can be tested realistically without it.

### Phase 2 — Auth + Sales Dashboard shell
Screens 1, 2. Real login/signup wired to the existing JWT/RBAC backend, role-based redirect after login, and the dashboard shell with widgets wired to real (even if sparse) data — no hardcoded numbers.

### Phase 3 — Quotation Builder core
Screens 3, 4. Customer + product selection, line items with quantity/discount, live total and margin calculation. No risk/approval logic yet — just a correct, working quote builder and list.

### Phase 4 — Discount/Risk Engine + Approval flow
Screens 7, 8 (+ risk logic inside screen 4). Implement the blended risk score calculation (per-line ceiling check against Phase 1's config, summed across the order), wire it to auto-create an approval request when thresholds are exceeded, and build the approval queue/detail screens with real approve/reject/return actions and an audit trail.

### Phase 5 — Upsell/Cross-sell panel
Inside screen 4. Ranked suggestion list (based on simple co-purchase or category-affinity rules is fine for a hackathon), margin-delta display, Add/Dismiss actions updating the live quote total.

### Phase 6 — Fulfillment
Screens 5, 6. Warehouse stock model, split-recommendation logic (simple cost/distance-weighted split is enough), accept/override actions, backorder flag when stock is short.

### Phase 7 — Subscriptions + Billing
Screens 9, 10. Recurring plan model, mixed one-time/recurring line display on the same order, a basic proration calculation for quantity changes, cancel/modify actions.

### Phase 8 — Customer Portal
Screen 11, on its own restricted layout/auth guard. Quote view, comment/change-request, counter-discount, confirm action — confirming with terms over threshold must silently route back into Phase 4's approval flow with no manual re-trigger needed.

### Phase 9 — Invoices + Payments
Screens 12, 13. Invoice generation from a confirmed order, payment recording, status stepper.

### Phase 10 — Deal Health Dashboard + polish
Screen 14 (+ 15 if time allows). Stalled-deal and discount-anomaly detection, escalate/nudge actions. Finish this phase by running the organizers' 8-step "Quick Test Flow" end to end and fixing whatever breaks.

---

## 4. Rules that apply to every phase

- No hardcoded or faked business logic anywhere that's supposed to be computed (discount limits, risk score, warehouse split, proration) — the organizers explicitly check for this.
- The customer portal (screen 11) must remain a genuinely separate, restricted view.
- Redis is cache/rate-limit/coordination only — Postgres is the source of truth for inventory, quotations, orders, payments, invoices, subscriptions, approvals.
- Every phase should be verifiable by clicking through the UI or hitting the API directly — not just "code exists."