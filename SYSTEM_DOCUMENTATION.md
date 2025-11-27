# LeadTime Lense - Complete System Documentation

## Table of Contents

1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Database Schema](#database-schema)
5. [Core Workflows](#core-workflows)
6. [Feature Deep Dives](#feature-deep-dives)
7. [Page Reference](#page-reference)
8. [Frontend Architecture](#frontend-architecture)
9. [API Patterns](#api-patterns)
10. [Edge Functions](#edge-functions)
11. [Database Initialization](#database-initialization)
12. [Development Notes](#development-notes)

---

## Application Overview

**LeadTime Lense** is a comprehensive inventory management and procurement system designed for organizations that need to:

- Manage warehouse inventory and stock levels
- Handle procurement from multiple vendors
- Process invoices and perform three-way matching
- Track material claims by field teams
- Manage construction/installation projects with Bill of Materials (BOM)

The system supports **5 distinct user roles** with role-based access control (RBAC), ensuring each user type sees only the features relevant to their responsibilities.

### Business Flow Summary

```
Purchaser creates PO → Vendor ships materials → Warehouse receives stock
→ Finance processes invoice → Three-way match verification
→ Onsite team claims materials from warehouse → Warehouse admin approves
→ Materials deployed to project sites
```

---

## Technology Stack

### Frontend

| Technology                | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| **React 18**              | UI Framework                                     |
| **TypeScript**            | Type safety                                      |
| **Vite**                  | Build tool and dev server                        |
| **React Router v6**       | Client-side routing                              |
| **TanStack Query v5**     | Server state management, caching, mutations      |
| **React Hook Form + Zod** | Form handling and validation                     |
| **Tailwind CSS**          | Utility-first styling                            |
| **Shadcn/UI**             | Component library (Cards, Tables, Dialogs, etc.) |
| **Recharts**              | Data visualization                               |
| **date-fns**              | Date formatting                                  |
| **react-dropzone**        | File uploads                                     |

### Backend

| Technology              | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| **Supabase**            | PostgreSQL database, Auth, Storage, Edge Functions |
| **PostgreSQL**          | Primary database with RLS policies                 |
| **Supabase Storage**    | File storage for invoices, photos                  |
| **Deno Edge Functions** | Serverless backend logic (email notifications)     |

### Key Architectural Principles

1. **Database-Centric Integrity**: Business logic enforced via PostgreSQL constraints/triggers
2. **Optimistic UI**: TanStack Query `onMutate` for instant feedback
3. **No useEffect for data fetching**: All data via TanStack Query hooks
4. **Strict separation of concerns**: Frontend handles UI state only; business logic in database

---

## User Roles & Permissions

### Role Definitions

| Role              | Description                                  | Home Route                  |
| ----------------- | -------------------------------------------- | --------------------------- |
| `ceo_admin`       | Full system access (Administrator)           | `/`                         |
| `purchaser`       | Creates purchase orders, manages vendors     | `/`                         |
| `finance_admin`   | Processes invoices, payment approvals        | `/`                         |
| `warehouse_admin` | Receives goods, approves material claims     | `/warehouse/pending-claims` |
| `onsite_team`     | Claims materials from warehouse for projects | `/onsite/projects`          |

### Permission Matrix

| Feature              | CEO Admin | Purchaser | Finance | Warehouse | Onsite |
| -------------------- | :-------: | :-------: | :-----: | :-------: | :----: |
| Dashboard            |    ✅     |    ✅     |   ✅    |    ✅     |   ✅   |
| View Purchase Orders |    ✅     |    ✅     |   ✅    |    ❌     |   ❌   |
| Create/Edit PO       |    ✅     |    ✅     |   ❌    |    ❌     |   ❌   |
| Place Order          |    ✅     |    ✅     |   ❌    |    ❌     |   ❌   |
| Receive Items        |    ✅     |    ✅     |   ❌    |    ✅     |   ❌   |
| View Vendors         |    ✅     |    ✅     |   ✅    |    ❌     |   ❌   |
| Create/Edit Vendor   |    ✅     |    ✅     |   ❌    |    ❌     |   ❌   |
| View Invoices        |    ✅     |    ❌     |   ✅    |    ❌     |   ❌   |
| Upload Invoice       |    ✅     |    ❌     |   ✅    |    ❌     |   ❌   |
| Three-Way Match      |    ✅     |    ❌     |   ✅    |    ❌     |   ❌   |
| Approve Claims       |    ✅     |    ❌     |   ❌    |    ✅     |   ❌   |
| Create Claims        |    ✅     |    ❌     |   ❌    |    ❌     |   ✅   |
| View Projects        |    ✅     |    ✅     |   ✅    |    ❌     |   ✅   |
| Stock Adjustments    |    ✅     |    ❌     |   ❌    |    ✅     |   ❌   |
| Audit Log            |    ✅     |    ❌     |   ❌    |    ❌     |   ❌   |
| Settings             |    ✅     |    ❌     |   ❌    |    ❌     |   ❌   |

### Row Level Security (RLS) Policies

LeadTime Lense uses Supabase RLS to enforce security at the database engine level.

#### 1. Purchase Orders (`purchase_orders`)

| Role            | Access Level                                    |
| --------------- | ----------------------------------------------- |
| Purchaser/Admin | **FULL ACCESS** (CRUD)                          |
| Finance         | **READ ONLY** (Cannot edit items or quantities) |
| Warehouse       | **DENY** (Access data via Blind View)           |
| Onsite          | **DENY**                                        |

#### 2. Financial Data (`vendor_invoices` & `finance-docs` bucket)

| Role             | Access Level                                            |
| ---------------- | ------------------------------------------------------- |
| Finance/Admin    | **FULL ACCESS**                                         |
| Purchaser        | **DENY** (Strict Separation of Duties to prevent fraud) |
| Warehouse/Onsite | **DENY**                                                |

#### 3. The "Blind Receiving" Pattern

**Problem**: Warehouse staff need to see what to receive, but should not see how much it costs (to prevent theft/bias).

**Solution**: Warehouse roles do NOT have access to `purchase_order_items`. Instead, they query a secure view:

```sql
CREATE VIEW warehouse_po_items AS
SELECT
  id,
  po_id,
  product_id,
  quantity_ordered,
  quantity_received
  -- unit_cost is EXCLUDED
FROM purchase_order_items;
```

### Role Context Implementation

```typescript
// Access current role and permissions via useRole() hook
const {
  currentRole, // Active role (may be preview)
  canAccessPurchasing,
  canAccessFinance,
  canAccessWarehouse,
  canAccessOnsite,
  isAdmin,
} = useRole();
```

---

## Database Schema

### Core Tables

#### `inventory_transactions` - The Audit Ledger

**Purpose**: Immutable record of every stock movement. Acts as the single source of truth for history.

| Column          | Type        | Description                                       |
| --------------- | ----------- | ------------------------------------------------- |
| `id`            | UUID        | Primary key                                       |
| `product_id`    | UUID        | FK to inventory_items                             |
| `change_amount` | INT         | Positive (in) or Negative (out)                   |
| `type`          | ENUM        | purchase_receive, sales_order, adjustment, return |
| `reference_id`  | UUID        | Polymorphic ID (PO ID, Claim ID, or Project ID)   |
| `snapshot_cost` | DECIMAL     | Cost at time of movement (FIFO/LIFO support)      |
| `created_at`    | TIMESTAMPTZ | Audit timestamp                                   |

**Trigger Logic**: An `AFTER INSERT` trigger on this table automatically updates `inventory_items.in_stock`.

> ⚠️ **Developer Note**: Never update `inventory_items` directly. Always insert a transaction.

#### `inventory_items` - Product/SKU Catalog

| Column               | Type    | Description                    |
| -------------------- | ------- | ------------------------------ |
| `id`                 | UUID    | Primary key                    |
| `product_name`       | TEXT    | Display name                   |
| `sku`                | VARCHAR | Unique SKU code                |
| `in_stock`           | INT     | Current stock quantity         |
| `allocated`          | INT     | Reserved for projects          |
| `safety_stock`       | INT     | Minimum threshold (default 25) |
| `unit_cost`          | DECIMAL | Cost per unit                  |
| `consumed_30d`       | INT     | 30-day consumption             |
| `on_order_local_14d` | INT     | Incoming within 14 days        |
| `projected_stock`    | INT     | Calculated future stock        |

#### `vendors` - Supplier Directory

| Column          | Type | Description             |
| --------------- | ---- | ----------------------- |
| `id`            | UUID | Primary key             |
| `name`          | TEXT | Vendor name             |
| `contact_email` | TEXT | Email (validated regex) |
| `payment_terms` | TEXT | Net30, Net60, etc.      |
| `currency`      | TEXT | USD, EUR, etc.          |
| `tax_id`        | TEXT | Tax identification      |

#### `purchase_orders` - Procurement Orders

| Column              | Type    | Description                                  |
| ------------------- | ------- | -------------------------------------------- |
| `id`                | UUID    | Primary key                                  |
| `po_number`         | SERIAL  | Auto-incremented PO#                         |
| `vendor_id`         | UUID    | FK to vendors                                |
| `status`            | ENUM    | draft, ordered, partial, received, cancelled |
| `total_amount`      | DECIMAL | Calculated total                             |
| `expected_delivery` | DATE    | Expected arrival                             |

#### `purchase_order_items` - PO Line Items

| Column              | Type    | Description                    |
| ------------------- | ------- | ------------------------------ |
| `id`                | UUID    | Primary key                    |
| `po_id`             | UUID    | FK to purchase_orders          |
| `product_id`        | UUID    | FK to inventory_items          |
| `quantity_ordered`  | INT     | Ordered quantity               |
| `quantity_received` | INT     | Received so far                |
| `unit_cost`         | DECIMAL | Snapshot of cost at order time |

#### `vendor_invoices` - Invoice Records

| Column           | Type    | Description                           |
| ---------------- | ------- | ------------------------------------- |
| `id`             | UUID    | Primary key                           |
| `po_id`          | UUID    | FK to purchase_orders                 |
| `invoice_number` | TEXT    | Vendor invoice #                      |
| `invoice_total`  | DECIMAL | Billed amount                         |
| `invoice_date`   | DATE    | Invoice date                          |
| `file_path`      | TEXT    | Storage path for PDF                  |
| `status`         | ENUM    | pending, approved, variance, rejected |

#### `projects` - Construction/Installation Projects

| Column        | Type | Description                |
| ------------- | ---- | -------------------------- |
| `id`          | UUID | Primary key                |
| `name`        | TEXT | Project name               |
| `location`    | TEXT | Site address               |
| `status`      | ENUM | active, completed, on_hold |
| `template_id` | UUID | FK to project_templates    |

#### `project_materials` - Bill of Materials (BOM)

| Column              | Type | Description           |
| ------------------- | ---- | --------------------- |
| `id`                | UUID | Primary key           |
| `project_id`        | UUID | FK to projects        |
| `product_id`        | UUID | FK to inventory_items |
| `phase`             | ENUM | P1, P2a, P2b          |
| `required_quantity` | INT  | Needed for project    |
| `claimed_quantity`  | INT  | Already claimed       |

#### `claims` - Material Claims from Onsite Team

| Column           | Type    | Description                                 |
| ---------------- | ------- | ------------------------------------------- |
| `id`             | UUID    | Primary key                                 |
| `claim_number`   | VARCHAR | Auto-generated claim #                      |
| `project_id`     | UUID    | FK to projects                              |
| `onsite_user_id` | TEXT    | Requester ID                                |
| `status`         | ENUM    | pending, approved, partial_approved, denied |
| `claim_type`     | ENUM    | standard, emergency                         |
| `photo_url`      | TEXT    | Required photo proof                        |

#### `returns` - Material Returns

| Column          | Type    | Description                 |
| --------------- | ------- | --------------------------- |
| `id`            | UUID    | Primary key                 |
| `return_number` | VARCHAR | Auto-generated return #     |
| `project_id`    | UUID    | FK to projects              |
| `claim_id`      | UUID    | Original claim (optional)   |
| `status`        | ENUM    | pending, approved, rejected |
| `reason`        | TEXT    | Return reason               |
| `photo_url`     | TEXT    | Photo proof                 |

#### `stock_adjustments` - Manual Stock Changes

| Column              | Type    | Description           |
| ------------------- | ------- | --------------------- |
| `id`                | UUID    | Primary key           |
| `adjustment_number` | VARCHAR | Auto-generated        |
| `product_id`        | UUID    | FK to inventory_items |
| `quantity_change`   | INT     | +/- quantity          |
| `reason`            | TEXT    | Adjustment reason     |
| `previous_stock`    | INT     | Before adjustment     |
| `new_stock`         | INT     | After adjustment      |

---

## Core Workflows

### Workflow 1: Purchase Order Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   DRAFT     │───▶│   ORDERED   │───▶│   PARTIAL   │───▶│  RECEIVED   │
│             │    │             │    │             │    │             │
│ Create PO   │    │ Place Order │    │ Partial     │    │ All items   │
│ Add Items   │    │ Email sent  │    │ receipt     │    │ received    │
│ Edit items  │    │ Read-only   │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Steps:**

1. **Create Draft PO** (`/purchase-orders`)

   - Select vendor from dropdown
   - Set expected delivery date
   - PO number auto-generated by database

2. **Add Line Items** (`/purchase-orders/:id`)

   - Search products from inventory
   - Enter quantity and unit cost
   - Total calculated in real-time

3. **Place Order** (Button on PO Detail)

   - Status changes to `ordered`
   - UI becomes read-only
   - Triggers Edge Function to send email to vendor

4. **Receive Items** (Receive Items Modal)
   - Enter quantities received per item
   - Validates against ordered quantity
   - Updates `inventory_items.in_stock` via database RPC
   - Status auto-updates to `partial` or `received`

### Workflow 2: Three-Way Match (Invoice Processing)

```
┌─────────────────────────────────────────────────────────────────┐
│                    THREE-WAY MATCH                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   AUTHORIZED    │  RECEIPT VALUE  │         BILLED              │
│   (PO Total)    │  (Received $)   │    (Invoice Total)          │
├─────────────────┼─────────────────┼─────────────────────────────┤
│    $1,000.00    │    $1,000.00    │       $1,000.00             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
              Receipt = Invoice?     Receipt ≠ Invoice?
                   │                 │
              ┌────▼────┐      ┌─────▼─────┐
              │ MATCHED │      │ VARIANCE  │
              │ (Green) │      │  (Red)    │
              └────┬────┘      └─────┬─────┘
                   │                 │
           Approve Payment    Request Credit Note
```

**Steps:**

1. **Upload Invoice** (Financials Tab)

   - Upload PDF to Supabase Storage
   - Enter invoice number, total, date
   - Record created in `vendor_invoices`

2. **Three-Way Match Calculation**

   - **Authorized**: Sum of (qty_ordered × unit_cost)
   - **Receipt Value**: Sum of (qty_received × unit_cost)
   - **Billed**: Invoice total

3. **Match Decision** ($0.05 tolerance)
   - **MATCHED**: Approve for payment → status = `approved`
   - **VARIANCE**: Request credit note → status = `variance`

### Workflow 3: Material Claims (Onsite → Warehouse)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
│  ONSITE     │    │  WAREHOUSE  │    │   INVENTORY     │
│  TEAM       │    │  ADMIN      │    │                 │
└──────┬──────┘    └──────┬──────┘    └────────┬────────┘
       │                  │                    │
       │ Create Claim     │                    │
       │ (with photo)     │                    │
       ├─────────────────▶│                    │
       │                  │ Review Claim       │
       │                  │ (check stock)      │
       │                  │                    │
       │                  │ Approve/Deny       │
       │                  ├───────────────────▶│
       │                  │                    │ Update stock
       │                  │                    │ (allocated, in_stock)
       │◀─────────────────│                    │
       │ Notification     │                    │
       │                  │                    │
```

**Steps:**

1. **Onsite Team Creates Claim** (`/onsite/projects/:id`)

   - Select project and materials needed
   - Take required photo proof
   - Choose standard or emergency claim

2. **Warehouse Reviews** (`/warehouse/pending-claims`)

   - See pending claims with details
   - Check stock availability
   - Approve full, partial, or deny

3. **Stock Updated**

   - `in_stock` decremented
   - `allocated` adjusted
   - `project_materials.claimed_quantity` updated

4. **Material Returns** (optional)
   - Onsite can return unused materials
   - Warehouse approves return
   - Stock restored

### Workflow 4: Project Management

```
Template                    Project                     Execution
┌────────────┐         ┌────────────────┐         ┌────────────────┐
│ Standard   │         │ New Building   │         │ Claim P1       │
│ Template   │────────▶│ Project        │────────▶│ Materials      │
│            │ Assign  │                │         │                │
│ - P1 items │         │ - P1 items     │         │ Claim P2a      │
│ - P2a items│         │ - P2a items    │────────▶│ Materials      │
│ - P2b items│         │ - P2b items    │         │                │
└────────────┘         └────────────────┘         │ Claim P2b      │
                                                  │ Materials      │
                                                  └────────────────┘
```

**Steps:**

1. **Create Template** (`/project-templates`)

   - Define standard BOM phases (P1, P2a, P2b)
   - Add products with quantities per phase

2. **Assign to Project** (`/projects/:id`)

   - Select template when creating project
   - Materials auto-populated to `project_materials`

3. **Track Progress**
   - Dashboard shows phase completion
   - Claimed vs Required quantities

---

## Feature Deep Dives

### Three-Way Matching Algorithm

The system performs an automated financial audit using the following logic:

| Step | Calculation                       | Formula                             |
| ---- | --------------------------------- | ----------------------------------- |
| 1    | **Calculate Obligation (PO)**     | `∑(QtyOrdered × UnitCost)`          |
| 2    | **Calculate Liability (Receipt)** | `∑(QtyReceived × UnitCost)`         |
| 3    | **Compare to Bill (Invoice)**     | User manually enters Total from PDF |

**Visual Indicators:**

| Status          | Condition                                                | Action                                                                              |
| --------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 🟢 **MATCHED**  | Invoice Total == Receipt Value (within ±$0.05 tolerance) | "Approve for Payment" button appears                                                |
| 🔴 **VARIANCE** | Values differ > $0.05                                    | "Request Credit Note" button appears. Shows exact delta (e.g., `Variance: -$50.00`) |
| ⚠️ **PENDING**  | Invoice uploaded but items not yet received              | Waiting for receiving                                                               |

### Optimistic Receiving

To ensure warehouse operations are fast (zero latency):

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. User clicks "Confirm Receipt" for 50 items                      │
│                          ↓                                          │
│  2. Frontend (React Query): Immediately updates UI cache            │
│     to show 50 received                                             │
│                          ↓                                          │
│  3. Background: Sends RPC call `receive_po_items`                   │
│                          ↓                                          │
│  4. Database:                                                       │
│     ├─ Updates `purchase_order_items`                               │
│     ├─ Inserts `inventory_transaction`                              │
│     ├─ Trigger updates `inventory_items.in_stock`                   │
│     └─ Auto-calculates if PO Status should flip                     │
│        (ordered → partial or received)                              │
│                          ↓                                          │
│  5. Settlement: If DB fails, UI rolls back to previous state        │
│     and shows error toast                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Page Reference

### Main Application (CEO/Purchaser/Finance)

| Route                  | Page                | Purpose                                       |
| ---------------------- | ------------------- | --------------------------------------------- |
| `/`                    | Index (Dashboard)   | Executive KPIs, alerts, charts                |
| `/purchase-orders`     | PurchaseOrders      | List all POs, create new                      |
| `/purchase-orders/:id` | PurchaseOrderDetail | PO details, line items, receiving, financials |
| `/products`            | Products            | Inventory catalog with stock levels           |
| `/vendors`             | Vendors             | Supplier directory                            |
| `/vendors/:id`         | VendorProfile       | Vendor details, linked products               |
| `/invoices`            | Invoices            | All invoices across POs                       |
| `/projects`            | Projects            | Construction projects list                    |
| `/projects/:id`        | ProjectDetail       | Project BOM, phase tracking                   |
| `/project-templates`   | ProjectTemplates    | Standard BOM templates                        |
| `/audit-log`           | AuditLog            | System activity history                       |
| `/settings`            | Settings            | Application settings                          |

### Warehouse Layout

| Route                          | Page                      | Purpose                      |
| ------------------------------ | ------------------------- | ---------------------------- |
| `/warehouse/dashboard`         | Index                     | Warehouse-specific dashboard |
| `/warehouse/pending-claims`    | WarehousePendingClaims    | Claims awaiting approval     |
| `/warehouse/pending-returns`   | WarehousePendingReturns   | Returns awaiting processing  |
| `/warehouse/stock-adjustments` | WarehouseStockAdjustments | Manual stock corrections     |
| `/warehouse/claim-history`     | WarehouseClaimHistory     | Historical claims            |

### Onsite Layout

| Route                  | Page             | Purpose                    |
| ---------------------- | ---------------- | -------------------------- |
| `/onsite/dashboard`    | Index            | Onsite team dashboard      |
| `/onsite/projects`     | OnsiteMyProjects | Assigned projects          |
| `/onsite/projects/:id` | OnsiteProjectBOM | Project BOM, create claims |

---

## Frontend Architecture

### State Management

```typescript
// All data fetching via TanStack Query
const {
  data: vendors,
  isLoading,
  error,
} = useQuery({
  queryKey: ["vendors"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .order("name");
    if (error) throw error;
    return data;
  },
});

// Mutations with optimistic updates
const mutation = useMutation({
  mutationFn: async (payload) => {
    /* ... */
  },
  onMutate: async (payload) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["vendors"] });
    // Snapshot previous state
    const previous = queryClient.getQueryData(["vendors"]);
    // Optimistically update
    queryClient.setQueryData(["vendors"], (old) => [...old, payload]);
    return { previous };
  },
  onError: (err, _, context) => {
    // Rollback on error
    queryClient.setQueryData(["vendors"], context.previous);
  },
  onSettled: () => {
    // Always refetch for consistency
    queryClient.invalidateQueries({ queryKey: ["vendors"] });
  },
});
```

### Component Structure

```
src/
├── components/
│   ├── ui/                    # Shadcn components
│   ├── navigation/            # Sidebar, TopHeader, UserProfileMenu
│   ├── layout/                # MainLayout, WarehouseLayout, OnsiteLayout
│   ├── dashboard/             # KPI cards, charts, widgets
│   ├── procurement/           # VendorList, CreatePO, InvoiceUpload
│   ├── modals/                # ReceiveItemsModal, EditVendorModal
│   └── shared/                # Reusable components
├── pages/                     # Route components
├── contexts/                  # RoleContext
├── hooks/                     # Custom hooks
├── lib/                       # Supabase client, API utilities
│   └── supabase.ts            # Client + TypeScript types
└── constants/                 # Routes, config
```

### Role-Based Rendering

```typescript
// Conditional UI based on permissions
const { canAccessFinance, canAccessPurchasing } = useRole();

return (
  <Tabs>
    <TabsList>
      <TabsTrigger value="items">Line Items</TabsTrigger>
      {canAccessFinance && (
        <TabsTrigger value="financials">Financials</TabsTrigger>
      )}
    </TabsList>

    {/* Only purchasers can edit draft POs */}
    {po.status === "draft" && canAccessPurchasing && (
      <Button onClick={handlePlaceOrder}>Place Order</Button>
    )}
  </Tabs>
);
```

---

## API Patterns

### Supabase Client Queries

```typescript
// Simple select
const { data, error } = await supabase
  .from("purchase_orders")
  .select("*")
  .eq("status", "ordered");

// Join related tables
const { data, error } = await supabase
  .from("purchase_orders")
  .select(
    `
    *,
    vendor:vendors(*),
    purchase_order_items(
      *,
      product:inventory_items(*)
    )
  `
  )
  .eq("id", poId)
  .single();

// Insert
const { data, error } = await supabase
  .from("purchase_orders")
  .insert({ vendor_id, expected_delivery })
  .select()
  .single();

// Update
const { error } = await supabase
  .from("purchase_orders")
  .update({ status: "ordered" })
  .eq("id", poId);
```

### RPC Functions (Database Procedures)

```typescript
// Receiving items - updates stock and PO status atomically
const { data, error } = await supabase.rpc("receive_po_items", {
  p_po_id: poId,
  items: [
    { item_id: "uuid-1", qty: 10 },
    { item_id: "uuid-2", qty: 5 },
  ],
});
```

### File Storage

```typescript
// Upload invoice PDF
const filePath = `invoices/${poId}/${Date.now()}_${file.name}`;
const { error } = await supabase.storage
  .from("finance-docs")
  .upload(filePath, file);

// Get signed URL for download
const { data } = await supabase.storage
  .from("finance-docs")
  .createSignedUrl(filePath, 60); // 60 second expiry
```

---

## Edge Functions

### `send-po-email` - Vendor Notification

**Trigger**: Purchase Order status changes to `ordered`

**Flow**:

1. Webhook receives update payload
2. Validates this is a status change TO 'ordered'
3. Fetches PO and vendor details
4. Sends email via Resend API (or logs if no API key)

```typescript
// supabase/functions/send-po-email/index.ts
serve(async (req) => {
  const payload = await req.json();

  // Only fire when status changes TO 'ordered'
  if (
    payload.record.status !== "ordered" ||
    payload.old_record.status === "ordered"
  ) {
    return new Response("No action");
  }

  // Fetch PO with vendor
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("*, vendor:vendors(*)")
    .eq("id", payload.record.id)
    .single();

  // Send email or log
  if (!RESEND_API_KEY) {
    console.log(`[MOCK] Email to ${po.vendor.contact_email}`);
  } else {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "orders@yourcompany.com",
        to: po.vendor.contact_email,
        subject: `New Purchase Order #${po.po_number}`,
        html: `<p>PO #${po.po_number} has been placed for $${po.total_amount}.</p>`,
      }),
    });
  }
});
```

---

## Key Business Rules

| Rule                          | Description                                                        |
| ----------------------------- | ------------------------------------------------------------------ |
| **PO Numbers**                | Auto-generated SERIAL integers - never send from frontend          |
| **Status Transitions**        | `draft → ordered → partial → received` (or `cancelled` from draft) |
| **Stock Updates**             | Only via database RPC - never direct table updates                 |
| **Three-Way Match Tolerance** | $0.05 for Receipt vs Invoice comparison                            |
| **Claims Require Photo**      | Cannot submit claim without `photo_url`                            |
| **Emergency Claims**          | Require `emergency_reason` field                                   |
| **Email Validation**          | Database constraint `^.+@.+\..+$` on vendor emails                 |

---

## Database Initialization

Since the system relies on heavy SQL logic (Triggers, RPCs, RLS), you cannot just run the frontend.

### Step 1: Initial Migration

Run the master schema script located in `/supabase/migrations/01_schema.sql`.

This creates:

- **Enums**: `po_status`, `transaction_type`, `invoice_status`
- **Tables**: `vendors`, `inventory_items`, `purchase_orders`, etc.
- **Triggers**: `tr_update_stock`
- **RPC Functions**: `receive_po_items`, `set_claim`

### Step 2: Seed Data

Run `/supabase/seed.sql` to generate:

- 10 Vendors
- 50 Inventory Items
- Dummy Users

> ⚠️ **Note**: You must manually assign roles via RPC.

### Step 3: Assigning Roles (Dev Mode)

To test RBAC locally, use the SQL function:

```sql
-- Make user a Purchaser
SELECT set_claim('USER_UUID', 'role', '"inventory_manager"');

-- Make user Finance
SELECT set_claim('USER_UUID', 'role', '"finance_admin"');

-- Make user Warehouse Admin
SELECT set_claim('USER_UUID', 'role', '"warehouse_admin"');

-- Make user Onsite Team
SELECT set_claim('USER_UUID', 'role', '"onsite_team"');
```

---

## Development Notes

### Role Switching (Dev Only)

The application includes a role switcher in the user profile menu for testing different role views. In production, roles would be determined by authentication via JWT claims.

### Environment Variables

```env
# Required
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (for email notifications)
RESEND_API_KEY=your-resend-api-key
```

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev  # Starts on http://localhost:8080

# Build for production
npm run build
```

### Testing Different Roles

1. Open the application
2. Click on your profile avatar (top-right)
3. Select "Switch View" dropdown
4. Choose any of the 5 roles to test their permissions

---

_Last Updated: November 2024_
