## ReVerto – AI Agents Guide

This file tells AI coding agents (Cursor, Claude, etc.) how to work safely and effectively in the `reverto` app.

ReVerto is a two-sided **waste marketplace** built on **Frappe Framework** (backend) with a **React SPA** (frontend) using **shadcn-style UI components** and **`frappe-react-sdk`** for talking to Frappe. It supports product listings, real-time negotiation/chat, cart checkout, environmental impact tracking, and a full seller dashboard.

---

## Commands

### Frontend (React SPA)

From `apps/reverto`:

```bash
# install JS deps (runs frontend install via postinstall)
yarn install

# dev server (Vite, React SPA)
yarn dev          # or: cd frontend && yarn dev

# build SPA and wire it into Frappe
yarn build        # or: cd frontend && yarn build
                  # outputs assets to /assets/reverto/frontend/*
                  # and copies HTML to reverto/www/reverto.html

# lint/format frontend
cd frontend && yarn lint
```

Notes for agents:

- **Local SPA URL (dev)**: `http://reverto.localhost:5173` (see `frontend/vite.config.ts`).
- **Dev proxy to Frappe**:
  - Vite proxies `/api`, `/assets`, and `/files` to `http://reverto.localhost:8000`.
  - When you call `/api/method/...` from the browser, requests go through the dev server and hit the Frappe site without CORS issues.
- **Frappe + SPA integration (build/production)**:
  - Built assets are served from `/assets/reverto/frontend/`.
  - `yarn build` copies `reverto/public/frontend/index.html` to `reverto/www/reverto.html`.
  - `hooks.py` defines `website_route_rules` so `/reverto/...` is handled by the SPA.

### Backend (Frappe / Python)

Always run bench commands from the **bench root**, not from `apps/reverto`.

```bash
# install app to a site
bench --site <site-name> install-app reverto

# after DocType/schema changes
bench --site <site-name> migrate

# run server-side tests for this app
bench --site <site-name> run-tests --app reverto

# export fixture data (CO2 factors etc.)
bench --site <site-name> export-fixtures --app reverto
```

Linting and formatting (Python + JS/TS) are handled via **pre-commit** and CI:

```bash
cd apps/reverto
pre-commit install
pre-commit run --all-files
```

Tools configured (see `pyproject.toml`, pre-commit config, and CI):

- **Python**: `ruff` (lint + format), `pyupgrade`.
- **JS/TS**: `eslint`, `prettier`.
- **Security/quality** (CI): Semgrep Frappe rules, `pip-audit`.

---

## Architecture (Quick Mental Model)

- **Backend**: Frappe app `reverto/`
  - DocTypes: `Product`, `CO2 Factor`, `Reverto Enquiry`, `Reverto Message`, `Reverto Seller Profile`, `Reverto Rating`.
  - Frappe handles multi-tenant DB, authentication, roles/permissions, background jobs, and REST API.
  - All SPA-facing logic lives in `reverto/api/` (auth, products, profile, enquiry).
- **Frontend**: React SPA in `frontend/`
  - Built with Vite + React + TypeScript + Tailwind CSS 4.
  - UI primitives follow **shadcn/ui** patterns (Radix + Tailwind; see `frontend/src/components/ui`).
  - Uses **`frappe-react-sdk`** for talking to Frappe (auth, data fetching/mutations, realtime).
  - Global cart state via `CartContext`.
- **Integration**:
  - SPA HTML entry lives at `reverto/www/reverto.html`.
  - `website_route_rules` in `hooks.py` route `/reverto/<path:reverto>` to the SPA.
  - Built assets are served from `/assets/reverto/frontend/` via Frappe's asset pipeline.

See `ARCHITECTURE.md` for a detailed overview of flows and entities.

---

## File Map

```
reverto/api/
  auth.py         signup, get_user_profile
  products.py     list_products, my_products, create/update/delete_product
  profile.py      seller profile CRUD, rate_seller, get_my_rating_for_enquiry
  enquiry.py      create_enquiry, send_message, propose_price,
                  respond_to_price, confirm_payment, direct_purchase,
                  get_my_orders, get_seller_orders, get_sustainability_stats,
                  get_buyer_enquiries, get_seller_enquiries

reverto/reverto/doctype/
  product/                    Marketplace listing
  co2_factor/                 CO₂ kg/kg factors by waste category
  reverto_enquiry/            Negotiation session (Open→Negotiating→Accepted→Closed)
  reverto_message/            Chat messages within an enquiry
  reverto_seller_profile/     Seller profile + aggregate avg_rating / rating_count
  reverto_rating/             Post-transaction buyer rating (1–5 stars)

frontend/src/
  App.tsx                     Top-level router, auth guard, page switcher
  context/CartContext.tsx      Global cart state (items, totals, open/close)
  components/
    Navigation.tsx            Sticky navbar (search, location label, badges, cart)
    WasteCard.tsx             Product card (buy, enquire, details, add-to-cart)
    ProductDetailsModal.tsx   Full product + seller detail modal
    ProductMap.tsx            MapLibre interactive map with Supercluster clustering
    CategoryFilters.tsx       Horizontal category filter chips
    SustainabilityWidget.tsx  Personal + community CO₂/waste stats
    CartDrawer.tsx            Cart slide-out with GST totals + batch checkout
    PaymentModal.tsx          Confirm payment (enquiry or direct purchase)
    BuyerEnquiriesDrawer.tsx  Buyer's open/negotiating enquiries list
    MyOrdersDrawer.tsx        Buyer's completed orders
    ProfilePage.tsx           Editable user/seller profile
    enquiry/
      ChatWindow.tsx          Real-time chat + price negotiation UI
      EnquiryModal.tsx        Batch enquiry creation results
    seller/
      AddListingModal.tsx     Create/edit product listing form (with location parsing)
    auth/                     LoginForm, SignupForm, AuthLayout, BrandingPanel
    ui/                       Shadcn/ui primitives
```

---

## How to Work on Common Tasks

### 1) Backend: DocTypes & APIs

- **Add a new marketplace entity**:
  - Create DocType JSON + controller: `reverto/reverto/doctype/<name>/`.
  - Add validation/side-effect logic in `<name>.py`.
  - Run `bench --site <site-name> migrate` after schema changes.
  - Register data patches in `reverto/patches.txt` if existing records need updating.
- **Add a new API endpoint**:
  - Add to the right module in `reverto/api/` (or create one for a new domain).
  - Use `@frappe.whitelist(allow_guest=True)` for public read endpoints.
  - Use `@frappe.whitelist()` for authenticated endpoints and always validate `frappe.session.user` ownership.
  - Never use `ignore_permissions=True` on write paths.
- **Real-time events**:
  - Publish with `frappe.publish_realtime(event="enquiry_{name}", message={"type": "..."})`.
  - Include a `type` field so the frontend can route without parsing the full payload.
  - See [Real-time Events](#real-time-events) below.

### 2) Frontend: React, shadcn, and Frappe

Frontend code lives under `frontend/`:

- **Entry points**:
  - `frontend/src/main.tsx` – React root, wrapped in `FrappeProvider` from `frappe-react-sdk` using `url={window.location.origin}`.
  - `frontend/src/App.tsx` – top-level router, page switcher, auth state, enquiry badge counts.
- **UI components**:
  - Shared primitives in `frontend/src/components/ui/*` – always prefer these over one-off inline styles.
  - Feature components are in `frontend/src/components/` – compose from primitives.
- **Adding a new page/view**:
  - Create a component in `frontend/src/components/`.
  - Add a `currentPage` state case in `App.tsx` with the appropriate auth guard.
  - If a new URL path is needed, add a route rule in `hooks.py`.
- **Accessing Frappe from React** – always use `frappe-react-sdk` hooks:

  ```ts
  // Read list
  useFrappeGetCall("reverto.api.products.list_products", { limit: 50 });

  // Read doc
  useFrappeGetDoc("Product", name);

  // Read doc list with filters
  useFrappeGetDocList("Product", { fields, filters, limit, order_by });

  // Mutation
  const { call } = useFrappePostCall("reverto.api.enquiry.create_enquiry");
  await call({ product_id: id, quantity_kg: qty });

  // Polling
  useFrappeGetCall("...", {}, undefined, { refreshInterval: 15000 });

  // Real-time
  useFrappeEventListener("enquiry_ENQ-0001", (data) => refetch());
  ```

- **Cart changes**: All cart state, totals, and GST (18%) live in `CartContext.tsx`. Update there first; `CartDrawer.tsx` and `PaymentModal.tsx` consume it.
- **Enquiry/checkout changes**: `CartDrawer.tsx` → `create_enquiry` (batch), `PaymentModal.tsx` → `confirm_payment` or `direct_purchase`. GST rate is also hardcoded in `enquiry.py` – change both if the rate changes.

### 3) Location / Maps

Location URL parsing happens in **two places**:

- **Backend** `reverto/api/products.py` (`_parse_location_url`): resolves short URLs (HTTP redirect), then applies regex patterns for Google Maps `@lat,lng`, query params `q=lat,lng`, OpenStreetMap hash format, and bare decimal pairs.
- **Frontend** `AddListingModal.tsx`: client-side preview; short URLs are flagged for backend resolution on submit.

If a new Maps URL format needs to be supported, update the regex patterns in **both** files.

### 4) Sustainability / CO₂

- CO₂ factors are stored in the `CO2 Factor` DocType and can be edited via Frappe Desk or via `reverto/fixtures/`.
- `get_sustainability_stats()` in `enquiry.py` loads all factors in a single query; missing categories fall back to `1.0 kg CO₂/kg`.
- The `fixtures` key in `hooks.py` controls which records are exported/imported via `bench migrate`.

### 5) Real-time Events

| Event | Publisher | Listener |
|---|---|---|
| `enquiry_{enquiry_id}` | `enquiry.py` on any state change | `ChatWindow.tsx` + 15s polling fallback |
| `new_enquiry` | `create_enquiry` | `SellerDashboard.tsx` + 15s polling fallback |

When adding a new real-time event:

1. Publish from Python with a `type` field in the message.
2. Subscribe in the React component with `useFrappeEventListener`.
3. Add a 15s `refreshInterval` fallback on the `useFrappeGetCall` hook covering the same data.

### 6) Testing Changes

- **Python/Frappe tests**:

  ```bash
  bench --site <site-name> run-tests --app reverto
  ```

  - Test files live next to their DocType: `reverto/reverto/doctype/<name>/test_<name>.py`.
  - In CI the site is `test_site`.

- **Frontend checks**:

  ```bash
  cd frontend && yarn lint
  ```

---

## Conventions & Guardrails for Agents

- **Do not** modify bench-level configuration or external services unless explicitly asked.
- **Prefer small, focused changes**: update one DocType or feature at a time; keep frontend changes isolated to a component where possible.
- **Respect existing tooling**: ensure `pre-commit run --all-files` passes before considering work done. Fix lints you introduce; avoid large unrelated reformatting.
- **Security & data safety**:
  - Do not hardcode secrets, tokens, or credentials.
  - Use Frappe's permission and role system to protect seller/buyer data.
  - Never expose another user's data via a guest or buyer endpoint.
- **No speculative abstractions**: write code for the task at hand; do not add helpers, configs, or flags for hypothetical future requirements.
- **Documentation**: when you add user-visible or architectural features, update `ARCHITECTURE.md` or `README.md` as appropriate.

If in doubt about where something should live:

- Backend/domain logic → Frappe DocTypes and API modules in `reverto/`.
- UX and presentation → React components in `frontend/src/components/`.
- Cross-cutting conventions or architecture changes → `ARCHITECTURE.md`.
