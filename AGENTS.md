## ReVerto – AI Agents Guide

This file tells AI coding agents (Cursor, Claude, etc.) how to work safely and effectively in the `reverto` app.

ReVerto is an e‑waste marketplace built on **Frappe Framework** (backend) with a **React SPA** (frontend) using **shadcn‑style UI components** and **`frappe-react-sdk`** for talking to Frappe.

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

- **Local SPA URL**: Vite default (`http://localhost:5173`) unless changed in `frontend/vite.config.ts`.
- **Frappe + SPA integration**:
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

### Doppio + SPA scaffolding

ReVerto already has a React SPA under `frontend/`. When adding **new SPAs or major reshuffles**, prefer using the **Doppio** app so structure stays consistent with Frappe best practices.

High-level Doppio flow (run from bench root):

```bash
# install Doppio into your bench (once)
bench get-app https://github.com/NagariaHussain/doppio

# scaffold a new React SPA inside the reverto app
bench add-spa --app reverto --name reverto-frontend --react --tailwindcss --typescript
```

When using Doppio:

- Keep generated SPA code under a dedicated directory (e.g. `reverto/frontend`).
- Ensure routing and build output remain compatible with `hooks.py` and `reverto/www/reverto.html`.
- Reuse existing shadcn‑style UI components where possible instead of regenerating similar ones.

---

## Architecture (Quick Mental Model)

- **Backend**: Frappe app `reverto/`
  - Core DocType today: `Product` (`reverto/reverto/doctype/product`).
  - Frappe handles multi‑tenant DB, authentication, roles/permissions, background jobs, and REST API.
  - Future DocTypes will model sellers (individual/organization), buyers, listings, and orders.
- **Frontend**: React SPA in `frontend/`
  - Built with Vite + React + Tailwind 4.
  - UI primitives follow **shadcn/ui** patterns (Radix + Tailwind; see `frontend/src/components/ui`).
  - Uses **`frappe-react-sdk`** for talking to Frappe (auth, data fetching/mutations, realtime).
- **Integration**:
  - SPA HTML entry lives at `reverto/www/reverto.html`.
  - `website_route_rules` in `hooks.py` route `/reverto/<path:reverto>` to the SPA.
  - Built assets are served from `/assets/reverto/frontend/` via Frappe’s asset pipeline.

See `ARCHITECTURE.md` for a deeper overview of flows and entities.

---

## How to Work on Common Tasks

### 1) Backend: DocTypes & APIs

- **Where to add new marketplace entities**:
  - DocType JSON + controller: `reverto/reverto/doctype/<doctype_name>/`.
  - Example: `Product` lives in `reverto/reverto/doctype/product/`.
- **When changing DocTypes**:
  - Update the `.json` definition.
  - If you add business logic, extend the `Document` subclass in `<doctype_name>.py`.
  - Run `bench --site <site-name> migrate` after schema changes.
- **APIs for the frontend**:
  - Prefer **whitelisted Python functions** in a module like `reverto/api.py` or in DocType controllers.
  - Use Frappe’s permission system instead of manual checks when possible.
  - Expose read/write actions needed by the SPA: browsing products, creating listings, placing orders, etc.

### 2) Frontend: React, shadcn, and Frappe

Frontend code lives under `frontend/`:

- **Entry points**:
  - `frontend/src/main.tsx` – React root, wrapped in `FrappeProvider` from `frappe-react-sdk`.
  - `frontend/src/App.tsx` – top‑level app shell for the e‑waste marketplace UI.
- **UI components**:
  - Shared primitives in `frontend/src/components/ui/*` follow the shadcn/ui style (Radix + Tailwind).
  - High‑level layout and marketplace components: `Navigation`, `Hero`, `WasteCard`, `CategoryFilters`, `SustainabilityWidget`, `Footer`, etc.
- **Accessing Frappe from React** (preferred approach):
  - Use `frappe-react-sdk` hooks instead of ad‑hoc `fetch` calls.
  - Example patterns:
    - `useFrappeGetDocList('Product', ...)` to list products.
    - `useFrappeCreateDoc('Product')` to create new listings.
    - `useFrappeAuth()` for login/logout and session handling.

When wiring new features:

- Keep all network access behind `frappe-react-sdk` so auth, CSRF, and error handling stay centralized.
- Keep UI components **presentational** and move data fetching/mutations into hooks or container components.

### 3) Testing Changes

- **Python/Frappe tests**:

  ```bash
  bench --site <site-name> run-tests --app reverto
  ```

  - In CI, the site is created as `test_site`; locally, ask the user or README for the correct site name.
  - Respect Frappe fixtures and data setup patterns when adding tests.

- **Frontend checks**:

  ```bash
  cd frontend
  yarn lint
  yarn test   # if/when a test runner is configured
  ```

  - For now, rely on manual testing in the browser plus linting.

- **End‑to‑end flows**:
  - Start Frappe bench (`bench start`) and the Vite dev server (`yarn dev`).
  - Test flows in the browser at `/reverto` (Frappe‑served) or via the Vite dev URL, depending on environment.

---

## Conventions & Guardrails for Agents

- **Do not** modify bench‑level configuration or external services unless explicitly asked.
- **Prefer small, focused changes**:
  - Update one DocType or feature at a time.
  - Keep frontend changes isolated to a component/route when possible.
- **Respect existing tooling**:
  - Ensure `pre-commit run --all-files` passes before considering work “done”.
  - Fix new lints you introduce; avoid large unrelated reformatting.
- **Security & data safety**:
  - Do not hardcode secrets, tokens, or credentials.
  - Use Frappe’s permission and role system to protect seller/buyer data.
- **Documentation**:
  - When you add user‑visible or architectural features, update `ARCHITECTURE.md` or `README.md` as appropriate.

If in doubt about where something should live, prefer:

- Backend/domain logic → Frappe DocTypes and hooks in `reverto/`.
- UX and presentation → React components in `frontend/src/components`.
- Cross‑cutting conventions or architecture changes → `ARCHITECTURE.md`.

