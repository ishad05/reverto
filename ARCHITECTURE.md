## ReVerto – Architecture Overview

ReVerto is a two-sided **waste marketplace** where individuals and organizations can list, discover, and transact in waste materials (e-waste, plastics, metals, paper, organic, construction, textile, glass). It runs on a **three-tier stack**:

1. **Backend**: Frappe Framework (Python) – DocTypes, business logic, REST API, permissions, pub/sub.
2. **Frontend SPA**: React + Vite + TypeScript + Tailwind CSS 4 + shadcn-style UI – marketplace experience for buyers and sellers.
3. **Integration & Delivery**: Doppio-style SPA wired into Frappe's website system – routing, asset build, and HTML entry.

---

## High-Level Components

### Backend: Frappe App (`reverto/`)

**Location**: `reverto/` (inside `apps/reverto`)

Responsibilities:

- Model core marketplace entities as **DocTypes**.
- Enforce business rules, permissions, and state transitions.
- Expose whitelisted REST APIs consumed by the React SPA.
- Handle multi-tenant DB, authentication, background jobs, and real-time events via Frappe.

#### App config – `reverto/hooks.py`

- App metadata and Frappe integration switches.
- Website routing for the SPA:

  ```python
  website_route_rules = [
      {"from_route": "/reverto/<path:reverto>", "to_route": "reverto"},
  ]
  ```

  Maps `/reverto/...` URLs to `reverto/www/reverto.html`, allowing React Router to own client-side navigation.

- Fixtures: exports/imports `CO2 Factor` records via `bench migrate` / `bench export-fixtures`.

#### DocTypes

**`Product`** – `reverto/reverto/doctype/product/`

The core marketplace listing.

| Field | Type | Notes |
|---|---|---|
| `product_name` | Data | Required; human-friendly title |
| `category` | Select | Plastic, E-waste, Metal, Paper, Organic, Construction, Textile, Glass |
| `quantity` | Int | Available stock in kg |
| `price_per_quantity` | Currency | Price per kg; required |
| `status` | Select | Available (default), Pending, Sold |
| `product_image` | Attach Image | Used as `image_field` |
| `location_url` | Data | Google Maps / OSM URL; parsed to lat/lon on save |
| `latitude` | Float | Parsed from `location_url` |
| `longitude` | Float | Parsed from `location_url` |

Naming: `"autoname": "PN.####"` with `"naming_rule": "Random"`.

---

**`CO2 Factor`** – `reverto/reverto/doctype/co2_factor/`

Per-category CO₂ emission avoidance rates used for sustainability calculations.

| Field | Type | Notes |
|---|---|---|
| `category` | Select | Matches Product categories; unique |
| `factor_kg_co2_per_kg` | Float | kg CO₂ avoided per kg of this waste recycled |
| `source` | Data | Citation / reference |
| `notes` | Long Text | Assumptions, sub-category breakdown |

Seeded via Frappe fixtures. Missing categories fall back to `1.0 kg CO₂/kg` in `get_sustainability_stats()`.

---

**`Reverto Enquiry`** – `reverto/reverto/doctype/reverto_enquiry/`

A negotiation session between a buyer and a seller for a specific product.

| Field | Type | Notes |
|---|---|---|
| `product` | Link → Product | |
| `buyer` | Link → User | |
| `seller` | Link → User | |
| `quantity_kg` | Int | |
| `original_price_per_kg` | Currency | Seller's listed price at creation time |
| `agreed_price_per_kg` | Currency | Set when buyer accepts a price offer |
| `status` | Select | Open, Negotiating, Accepted, Rejected, Closed |

Naming: `ENQ.####`. Lifecycle: `Open → Negotiating → Accepted → Closed` (or `Rejected`). One Closed enquiry represents a completed transaction.

---

**`Reverto Message`** – `reverto/reverto/doctype/reverto_message/`

Chat messages within an enquiry, ordered by creation ASC.

| Field | Type | Notes |
|---|---|---|
| `enquiry` | Link → Reverto Enquiry | |
| `sender` | Link → User | |
| `message_text` | Long Text | |
| `message_type` | Select | message, price_offer, price_accepted, price_rejected, system |
| `proposed_price_per_kg` | Currency | Set on `price_offer` messages |
| `is_read` | Check | Default 0 |

---

**`Reverto Seller Profile`** – `reverto/reverto/doctype/reverto_seller_profile/`

Seller-specific profile data and aggregated ratings. Auto-created on first call to `get_my_profile()`.

| Field | Type | Notes |
|---|---|---|
| `seller` | Link → User | Unique |
| `enterprise_name` | Data | |
| `location` | Data | City / region |
| `profile_image` | Attach Image | |
| `about` | Long Text | |
| `avg_rating` | Float | Read-only; updated on each new rating |
| `rating_count` | Int | Read-only; updated on each new rating |

---

**`Reverto Rating`** – `reverto/reverto/doctype/reverto_rating/`

Post-transaction buyer rating of a seller. One per enquiry.

| Field | Type | Notes |
|---|---|---|
| `enquiry` | Link → Reverto Enquiry | |
| `buyer` | Link → User | |
| `seller` | Link → User | |
| `score` | Int | 1–5 |
| `comment` | Long Text | Optional |

On save, updates `avg_rating` and `rating_count` on the seller's `Reverto Seller Profile`.

---

#### API Modules (`reverto/api/`)

All SPA-facing logic lives here. Every function is decorated with `@frappe.whitelist()`.

**`auth.py`**
- `signup(full_name, email, phone, account_type, password)` – creates a new Frappe user; stores `account_type` (Buyer/Seller) in `user.bio`.
- `get_user_profile()` – returns the current session user's name, email, account type; empty dict for guests.

**`products.py`**
- `list_products(limit, category, search)` – guest-accessible marketplace browse; filters `status=Available`.
- `my_products()` – seller's own listings.
- `create_product(...)` – creates a new Product; auto-parses `location_url` to lat/lon (supports Google Maps, OSM, short URLs, bare decimal pairs).
- `update_product(name, ...)` – owner-only edit.
- `delete_product(name)` – owner-only delete.

**`profile.py`**
- `get_my_profile()` / `update_my_profile(...)` – full profile CRUD for the current user.
- `get_seller_public_profile(seller)` – guest-accessible seller profile view.
- `rate_seller(enquiry_id, score, comment)` – buyer-only, post-transaction rating; prevents duplicates.
- `get_my_rating_for_enquiry(enquiry_id)` – check if the current buyer already rated.

**`enquiry.py`** (core transactional module)
- `create_enquiry(product_id, quantity_kg)` – buyer initiates negotiation; reuses an existing open enquiry if one exists.
- `get_enquiry(enquiry_id)` – full enquiry + messages (access-controlled).
- `send_message(enquiry_id, message_text)` – plain chat message.
- `propose_price(enquiry_id, new_price_per_kg)` – seller proposes a new price (creates a `price_offer` message).
- `respond_to_price(enquiry_id, accepted)` – buyer accepts (sets `agreed_price_per_kg`, status → Accepted) or rejects (status → Negotiating).
- `confirm_payment(enquiry_id)` – finalises a deal (status → Closed); reduces product inventory; marks product Sold when qty reaches 0.
- `direct_purchase(product_id, quantity_kg)` – skip negotiation; creates a Closed enquiry immediately and reduces inventory.
- `get_my_orders()` – buyer's completed orders with total_paid (incl. 18% GST).
- `get_seller_orders()` – seller's completed sales with net_revenue and total_billed.
- `get_buyer_enquiries()` / `get_seller_enquiries()` – open/negotiating enquiry lists.
- `get_sustainability_stats()` – personal and community waste-diverted and CO₂-saved metrics.

---

### Frontend: React SPA (`frontend/`)

**Location**: `frontend/` (sibling to `reverto/` inside `apps/reverto`)

Key technologies:

- **React + TypeScript** – component model.
- **Vite** – dev server and bundler.
- **Tailwind CSS 4 + `@tailwindcss/vite`** – utility-first styling.
- **Radix UI + `components/ui/*`** – shadcn-style UI primitives.
- **`frappe-react-sdk`** – typed hooks and provider for talking to Frappe.
- **React Map GL + MapLibre + Supercluster** – interactive product map with clustering; no API key required (free OSM tiles).

#### Key files

**`frontend/src/main.tsx`**
- Wraps `App` with `FrappeProvider` (`url={window.location.origin}`).
- In dev: API calls go to Vite dev server → proxied to Frappe at port 8000.
- In production: API calls go directly to the Frappe origin.

**`frontend/src/App.tsx`**
- Top-level router and auth guard.
- Fetches `currentUser` and `account_type` on load; defaults sellers to `seller-dashboard`, buyers to marketplace home.
- Manages `currentPage` state: `home`, `login`, `signup`, `profile`, `seller-dashboard`.
- Wraps everything in `CartProvider`.
- Polls buyer enquiries every 15s for badge count.

**`frontend/src/context/CartContext.tsx`**
- Global cart state: items, per-item quantity, subtotal, 18% GST, grand total.
- Methods: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `openCart`, `closeCart`.

#### Component inventory

| Component | Purpose |
|---|---|
| `Navigation.tsx` | Sticky navbar; search, location label (OSM reverse-geocode), enquiry/orders badges, cart icon |
| `WasteCard.tsx` | Product card; quantity stepper, Buy Now / Enquire / View Details / Add to cart |
| `ProductDetailsModal.tsx` | Full product + seller info modal; quantity selector, CTA buttons |
| `ProductMap.tsx` | MapLibre map; category-colored markers, Supercluster clustering, popup with Buy/Enquire |
| `CategoryFilters.tsx` | Horizontal filter chips by waste category |
| `SustainabilityWidget.tsx` | Personal + community CO₂ saved and waste diverted; refreshes every 30s |
| `CartDrawer.tsx` | Cart slide-out; GST breakdown, batch `create_enquiry` on checkout |
| `PaymentModal.tsx` | Confirm payment for enquiry (`confirm_payment`) or direct purchase (`direct_purchase`) |
| `BuyerEnquiriesDrawer.tsx` | Buyer's open/negotiating enquiries; Pay Now for Accepted ones |
| `MyOrdersDrawer.tsx` | Buyer's completed orders with total paid and rate-seller link |
| `ChatWindow.tsx` | Real-time chat + price negotiation; listens on `enquiry_{id}` events; RateSellerWidget |
| `EnquiryModal.tsx` | Batch enquiry creation results after cart checkout |
| `SellerDashboard.tsx` | 3-tab dashboard: Listings (CRUD), Enquiries (chat), Orders (revenue) |
| `AddListingModal.tsx` | Create/edit listing form; client-side location URL parsing with backend fallback |
| `ProfilePage.tsx` | Editable user/seller profile; image upload; star rating display; logout |
| `auth/*` | LoginForm, SignupForm, AuthLayout, BrandingPanel |
| `ui/*` | Shadcn/ui primitives (Button, Input, Dialog, Sheet, Card, Badge, etc.) |

---

### SPA–Frappe Integration (Doppio-style)

- **Build output**: Vite emits assets to `/assets/reverto/frontend/`.
- **HTML entry point**: `yarn build` runs `vite build --base=/assets/reverto/frontend/ && yarn copy-html-entry`, which copies `reverto/public/frontend/index.html` → `reverto/www/reverto.html`.
- **Routing**: `hooks.py` maps `/reverto/<path:reverto>` → `reverto.html`; React Router handles client-side navigation within `/reverto/**`.

---

## Domain and Data Relationships

```
User (Frappe)
├── Reverto Seller Profile (0-to-1; auto-created for sellers)
├── Products (1-to-many; seller's listings)
├── Enquiries as buyer (1-to-many)
├── Enquiries as seller (1-to-many, via product ownership)
└── Ratings given as buyer (1-to-many)

Product
├── Category → CO2 Factor (lookup for sustainability calc)
└── Enquiries (1-to-many)

Reverto Enquiry
├── Reverto Messages (1-to-many; ordered creation ASC)
└── Reverto Rating (0-to-1; by buyer after Closed)

Message types: message | price_offer | price_accepted | price_rejected | system
```

---

## Key Flows

### 1. Seller creates a listing

1. Seller logs in (Frappe auth) → redirected to Seller Dashboard.
2. Clicks "Add listing" → `AddListingModal.tsx` form.
3. Optionally pastes a Google Maps / OSM URL; client-side parsing previews coordinates.
4. On submit: `reverto.api.products.create_product` – backend parses/resolves location URL, creates the `Product` record.

### 2. Buyer browses and filters

1. Buyer lands on `/reverto` → `App.tsx` fetches products via `reverto.api.products.list_products`.
2. Category filter chips narrow the result; search field applies keyword filtering.
3. Map view (`ProductMap.tsx`) shows clustered markers; click a marker for a popup with quick Buy/Enquire.
4. Clicking "View details" opens `ProductDetailsModal.tsx` with full seller info and CTAs.

### 3. Negotiation flow (enquiry path)

```
Buyer clicks "Enquire"
  → create_enquiry  (status: Open → Negotiating)
  → ChatWindow.tsx opens; both parties exchange messages
  → Seller proposes price  (propose_price; status stays Negotiating)
  → Buyer accepts         (respond_to_price; status: Accepted; agreed_price set)
  → Buyer confirms payment (confirm_payment; status: Closed; inventory reduced)
```

Real-time updates at every step via `frappe.publish_realtime(event="enquiry_{id}")`.
`ChatWindow.tsx` listens with `useFrappeEventListener`; 15s polling as fallback.

### 4. Direct purchase flow

```
Buyer clicks "Buy Now" on WasteCard or ProductDetailsModal
  → PaymentModal.tsx (shows price + 18% GST)
  → direct_purchase  (creates Closed enquiry immediately; inventory reduced)
```

### 5. Cart checkout (batch enquiry)

```
Buyer adds multiple products to cart
  → CartDrawer.tsx shows items, subtotal, GST, grand total
  → "Proceed to enquiry" → creates one enquiry per item via create_enquiry
  → EnquiryModal shows results; buyer opens ChatWindow per enquiry
```

### 6. Seller order management

- Seller Dashboard "Enquiries" tab shows all inbound enquiries; click to open `ChatWindow.tsx`.
- "Orders" tab shows Closed enquiries with `net_revenue` (pre-GST) and `total_billed` (post-GST).

### 7. Sustainability tracking

- On every `confirm_payment` or `direct_purchase`, the transaction's waste kg is recorded against the product's category.
- `get_sustainability_stats()` aggregates all Closed enquiries for the current user and the entire platform, multiplied by the category's `CO2 Factor`.
- `SustainabilityWidget.tsx` displays these numbers, refreshing every 30s.

---

## Real-time Events

| Event | Published by | Consumed by |
|---|---|---|
| `enquiry_{name}` | `enquiry.py` on any state change | `ChatWindow.tsx` |
| `new_enquiry` | `create_enquiry` | `SellerDashboard.tsx` |

Both consumers also use `refreshInterval: 15000` on their `useFrappeGetCall` hooks as a fallback.

---

## Key Paths for Common Changes

### Backend

- **Add/modify entities**: `reverto/reverto/doctype/<name>/<name>.json` + `<name>.py`
- **Add new SPA APIs**: `reverto/api/` – use `@frappe.whitelist()` and explicit permission checks.
- **Config & hooks**: `reverto/hooks.py`
- **Data migrations**: `reverto/patches.txt`
- **Fixture data** (CO₂ factors): `reverto/fixtures/`

### Frontend

- **Bootstrap & routing**: `frontend/src/main.tsx`, `frontend/src/App.tsx`
- **Global state**: `frontend/src/context/CartContext.tsx`
- **Shared UI**: `frontend/src/components/ui/*`
- **Feature components**: `frontend/src/components/`
- **Build config**: `frontend/vite.config.ts`

### Data access (frontend)

```ts
// Read list
useFrappeGetCall("reverto.api.products.list_products", { limit, category })

// Read doc
useFrappeGetDoc("Product", name)

// Read doc list
useFrappeGetDocList("Product", { fields, filters, limit, order_by })

// Mutation
const { call } = useFrappePostCall("reverto.api.enquiry.confirm_payment")
await call({ enquiry_id: id })

// Real-time
useFrappeEventListener("enquiry_ENQ-0001", () => mutate())
```

Avoid hand-rolled `fetch` calls to `/api/method/...`. If absolutely necessary, wrap in a shared helper.

---

## Non-Goals and Out of Scope

- Business policy (which waste types are legal, KYC requirements) – lives in product specs.
- Deployment, SSL, DNS, or infrastructure setup – use standard Frappe/bench patterns.
- Bench-level configuration (Redis, MariaDB) beyond what ReVerto itself needs.

For further reading:

- `README.md` – installation, contribution, and CI overview.
- `AGENTS.md` – concrete instructions for AI agents and developers on day-to-day tasks.
