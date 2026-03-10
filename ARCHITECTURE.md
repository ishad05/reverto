## ReVerto – Architecture Overview

ReVerto is an **e‑waste marketplace** where individuals and organizations can list, discover, and transact in waste (with a current emphasis on e‑waste). It runs on a **three‑tier stack**:

1. **Backend**: Frappe Framework (Python) – DocTypes, business logic, REST API, permissions, scheduler.
2. **Frontend SPA**: React + Vite + Tailwind 4 + shadcn‑style UI – marketplace experience for buyers and sellers.
3. **Integration & Delivery**: Doppio‑style SPA integration into Frappe’s website system – routing, asset build, and HTML entry wiring.

This document explains how those pieces fit together and where to make changes.

---

## High‑Level Components

### Backend: Frappe App (`reverto/`)

**Location**: `reverto/` (inside `apps/reverto`)

Responsibilities:

- Model core marketplace entities as **DocTypes**.
- Enforce business rules and permissions for listing and buying waste.
- Expose REST/whitelisted APIs consumed by the React SPA.
- Handle multi‑tenant DB, authentication, background jobs, and email notifications via Frappe.

Current key pieces:

- **App config** – `reverto/hooks.py`
  - App metadata and Frappe integration switches (DocType JS, schedulers, auth hooks, etc.).
  - Website routing for the SPA:

    ```python
    website_route_rules = [
        {"from_route": "/reverto/<path:reverto>", "to_route": "reverto"},
    ]
    ```

    This maps `/reverto/...` URLs to the SPA HTML page `reverto/www/reverto.html`, allowing React Router (or similar) to own client‑side navigation.

- **Core DocType (today)** – `Product`
  - Path: `reverto/reverto/doctype/product/`
  - Files:
    - `product.json` – DocType schema and metadata.
    - `product.py` – Python controller (`Product(Document)`).
    - `product.js` – Client‑side hooks (currently unused / commented out).
    - `test_product.py` – DocType tests (picked up by `bench --site <site> run-tests --app reverto`).
  - Fields (simplified):
    - `product_name` (`Data`, required) – human‑friendly title.
    - `quantity` (`Int`, non‑negative) – quantity, currently labeled “in Kg”.
    - `price_per_quantity` (`Currency`, non‑negative, required) – “Price per Kg”.
    - `status` (`Select` – `Available` / `Sold`) – listing lifecycle status, default `Available`.
    - `product_image` (`Attach Image`) – used as `image_field`.
  - Naming: `"autoname": "PN.####"` with `"naming_rule": "Random"`.

**Planned/likely DocTypes** (not all implemented yet, but useful for mental model):

- `Listing` – a marketplace listing (seller, product, quantity, price, status, location, etc.).
- `Order` / `Transaction` – captures a buyer’s commitment to purchase a listing.
- `Seller Profile` – models individuals vs organizations, KYC, and allowed waste types.
- `Buyer Profile` – for organizations/individuals buying waste.
- `Location` / `PickupSlot` – logistics for pickup/delivery.

When adding new entities, follow the `Product` pattern:

- Create a DocType JSON and controller under `reverto/reverto/doctype/<name>/`.
- Keep validation and business logic in the Python controller.
- Expose minimal whitelisted methods or REST endpoints needed by the SPA.

- **Public listing API** – `reverto/api/products.py`
  - Implements a guest‑accessible product listing endpoint:

    ```python
    @frappe.whitelist(allow_guest=True)
    def list_products(limit: int = 50) -> list[ProductSummary]:
        ...
    ```

  - Returns a concise `ProductSummary` payload (name, product_name, quantity, price_per_quantity, status, product_image).
  - Uses `ignore_permissions=True` and filters `status = "Available"` so anonymous visitors can browse marketplace listings without logging in.

---

### Frontend: React SPA (`frontend/`)

**Location**: `frontend/` (sibling to `reverto/` inside `apps/reverto`)

The SPA implements the marketplace UX for buyers and sellers. It is a **Vite‑powered React app** using **Tailwind 4** and **shadcn‑style UI** components built on top of Radix.

Key technologies:

- **React 19** – component model.
- **Vite** – dev server and bundler.
- **Tailwind CSS 4 + `@tailwindcss/vite`** – utility‑first styling.
- **Radix UI + custom `components/ui/*`** – shadcn‑style UI primitives.
- **`frappe-react-sdk`** – typed hooks and provider for talking to Frappe.

Important files:

- `frontend/package.json`
  - Scripts:
    - `dev` – starts the Vite dev server.
    - `build` – builds the SPA with `--base=/assets/reverto/frontend/` and copies HTML into Frappe (`reverto/www/reverto.html`).
    - `lint` – runs ESLint on TS/TSX files.
  - Dependencies include:
    - `react`, `react-dom`.
    - `frappe-react-sdk` for Frappe integration.
    - Radix primitives and supporting libs (typical of shadcn/ui).

- `frontend/vite.config.ts`
  - Configures Vite with React and Tailwind plugins.
  - Defines `@` alias to `./src` for clean imports.
  - Build base configured to `/assets/reverto/frontend/` so assets resolve correctly when served by Frappe.
  - Dev server runs on `http://reverto.localhost:5173` and proxies:
    - `/api`, `/assets`, and `/files` to `http://reverto.localhost:8000` (the Frappe site) to avoid CORS issues.

- `frontend/src/main.tsx`
  - React entry point.
  - Wraps `App` with `FrappeProvider` from `frappe-react-sdk`, using `url={window.location.origin}`:

    - In production (served by Frappe), API calls go directly to the Frappe origin.
    - In dev, API calls go to the Vite dev server, which forwards them to Frappe via the proxy.
    - Provides the SPA with:
      - Auth/session info.
      - Typed data‑fetching hooks (`useFrappeGetCall`, `useFrappeGetDocList`, `useFrappeGetDoc`, `useFrappeCreateDoc`, etc.).
      - Realtime updates via websockets if enabled.

- `frontend/src/App.tsx`
  - Top‑level marketplace shell:
    - `Navigation`, `Hero`, `CategoryFilters`.
    - A grid of `WasteCard` components representing waste listings.
    - A sidebar `SustainabilityWidget` showcasing impact metrics.
    - `Footer` with site‑wide links.
  - Fetches product data dynamically using:

    ```ts
    useFrappeGetCall("reverto.api.products.list_products", { limit: 50 })
    ```

    and renders loading, error, empty, and non‑empty states.

- `frontend/src/components/ui/*`
  - Collection of reusable UI primitives similar to **shadcn/ui**:
    - Buttons, dialogs, dropdowns, forms, navigation, sidebars, tooltips, tabs, etc.
  - Built on **Radix UI** and styled with Tailwind;
  - These should be the default building blocks for new UI instead of one‑off components.

---

### SPA–Frappe Integration (Doppio‑style)

ReVerto follows the same pattern that the **Doppio** app recommends for integrating a modern SPA into a Frappe app:

- **Build output location**:

  - Vite is configured to emit assets under:
    - `/assets/reverto/frontend/`

- **HTML entry point**:

  - `yarn build` runs:

    ```bash
    vite build --base=/assets/reverto/frontend/ && yarn copy-html-entry
    ```

  - The `copy-html-entry` script copies:
    - `reverto/public/frontend/index.html` → `reverto/www/reverto.html`

  - `reverto/www/reverto.html` is the page Frappe serves for the `/reverto` route, and it bootstraps the React SPA.

- **Routing**:

  - `hooks.py` defines:

    ```python
    website_route_rules = [
        {"from_route": "/reverto/<path:reverto>", "to_route": "reverto"},
    ]
    ```

  - This means:
    - `/reverto` and any nested routes like `/reverto/listings/123` are served the same `reverto.html`.
    - Inside the SPA, React Router (or equivalent) is free to map those URLs to individual views.

- **Doppio CLI (for future scaffolding)**:

  - While this repo already has a SPA, new SPAs or major reorganizations should use the **Doppio** app:

    ```bash
    # from bench root
    bench get-app https://github.com/NagariaHussain/doppio            # install once
    bench add-spa --app reverto --name reverto-frontend --react \
      --tailwindcss --typescript
    ```

  - Doppio:
    - Sets up Vite, Tailwind, and `frappe-react-sdk`.
    - Wires website routing and build output into the Frappe app.
    - Provides a predictable layout for SPA code.

---

## Domain and Key Flows

### Core Domain Concepts

The marketplace is centered around **waste listings**:

- **Sellers** – individuals or organizations that create listings.
  - Can specify waste type, quantity, pricing model (per kg/unit), and location.
  - May have different verification or KYC requirements depending on regulations.

- **Buyers** – individuals or organizations that browse and purchase waste.
  - Can filter listings by type, distance, price, and seller type.
  - Initiate orders and coordinate pickup/delivery with sellers.

- **Products / Listings** – concrete waste items on the marketplace.
  - Today modeled via the `Product` DocType (with basic fields like name, quantity, price, status, image).
  - In future, likely split into:
    - A product catalog (standardized waste types).
    - Listings that reference a product plus real‑world availability, location, and pricing.

- **Orders / Transactions** (planned):
  - Connect a buyer, a listing, a quantity, and a price at a given time.
  - Track payment status, logistics, and completion.

### Key Flows (Target Design)

These flows describe the **intended architecture**; not all are fully implemented yet.

1. **Seller creates a listing**
   - Seller logs in via Frappe auth.
   - SPA shows a “Create Listing” form backed by `frappe-react-sdk` mutations.
   - On submit:
     - A new listing (or `Product` record initially) is created in Frappe.
     - Images are uploaded via Frappe’s file APIs.
   - Frappe enforces:
     - Seller permissions.
     - Required fields (waste type, quantity, pricing, location).

2. **Buyer browses and filters waste**
   - Buyer lands on `/reverto`.
   - SPA loads paginated listings via `frappe-react-sdk` (`useFrappeGetDocList`).
   - Filters (type, distance, price, seller type) are applied in the frontend and/or in DocType queries.
   - Clicking into a listing navigates to `/reverto/listings/<name>` which the SPA resolves to a detail view.

3. **Buyer initiates a purchase**
   - From a listing detail:
     - Buyer selects quantity and confirms intent.
     - SPA calls a whitelisted Frappe method to create an `Order`/`Transaction` record.
   - If payments are integrated:
     - Frappe (optionally via `frappe/payments`) generates a payment request.
     - On payment success, the order state is updated and the listing’s available quantity and `status` are adjusted.

4. **Listing lifecycle**
   - A listing moves through states such as:
     - `Draft` → `Published` (`Available`) → `Partially Filled` → `Sold` / `Closed`.
   - Controllers enforce allowed transitions and side‑effects (e.g. preventing overselling quantity).
   - The `status` field and available quantity are what the SPA uses to display badges and call‑to‑action buttons.

---

## Key Paths for Common Changes

### Backend

- **Add/modify marketplace entities**:
  - DocTypes: `reverto/reverto/doctype/<doctype_name>/<doctype_name>.json`
  - Controllers: `reverto/reverto/doctype/<doctype_name>/<doctype_name>.py`

- **Add new public APIs for SPA**:
  - Create/extend modules such as `reverto/api.py` (if not present yet).
  - Use `@frappe.whitelist()` for functions the SPA will call.
  - Ensure permissions rely on Frappe roles/permissions where possible.

- **Configuration and hooks**:
  - `reverto/hooks.py` – add DocType JS, scheduled tasks, auth hooks, etc.
  - `reverto/patches.txt` – register data patches and migrations when changing live data structures.

### Frontend

- **Top‑level layout and routing**:
  - `frontend/src/main.tsx` – SPA bootstrap and `FrappeProvider` setup.
  - `frontend/src/App.tsx` – high‑level layout and initial marketplace views.
  - When adding multiple routes, introduce a router (e.g. React Router) and map URL paths under `/reverto/**` to pages.

- **UI components and pages**:
  - Shared primitives: `frontend/src/components/ui/*`
  - Feature components: `frontend/src/components/*` (e.g. `Navigation`, `WasteCard`, etc.).
  - New flows: create page‑level components (e.g. `CreateListingPage`, `ListingDetailPage`) and compose them from UI primitives.

- **Data access patterns**:
  - Use `frappe-react-sdk`:
    - Read:
      - `useFrappeGetDocList('Product', { fields, filters, limit, order_by })`
      - `useFrappeGetDoc('Product', name)`
    - Write:
      - `useFrappeCreateDoc('Product')`, `useFrappeUpdateDoc`, `useFrappeDeleteDoc`.
  - Avoid hand‑rolled `fetch` calls to `/api/method/...` unless strictly necessary (and then wrap them in a shared helper).

---

## Non‑Goals and Out of Scope

- This document does **not** define business policy (e.g. exactly which kinds of waste are allowed or legal constraints) – those should live in product specs.
- It does not cover deployment, SSL, or DNS setup for production; rely on standard Frappe/bench deployment patterns.
- It does not document bench‑level configuration (e.g. Redis, MariaDB) beyond what is needed by ReVerto.

For implementation details beyond this overview, consult:

- `README.md` – installation, contribution, and CI overview.
- `AGENTS.md` – concrete instructions for AI agents and developers on day‑to‑day tasks.

