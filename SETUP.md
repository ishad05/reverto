# ReVerto — Complete Setup & Contribution Guide

---

## Table of Contents

1. [What is ReVerto?](#1-what-is-reverto)
2. [How It Works — The Flow](#2-how-it-works--the-flow)
3. [Technology Stack](#3-technology-stack)
4. [Unique Selling Points](#4-unique-selling-points)
5. [Prerequisites](#5-prerequisites)
6. [Part A — Full Setup from Scratch (Ubuntu / Ubuntu VM)](#6-part-a--full-setup-from-scratch-ubuntu--ubuntu-vm)
7. [Part B — Bench Already Installed? Start Here](#7-part-b--bench-already-installed-start-here)
8. [Running the Project](#8-running-the-project)
9. [Forking & Raising a Pull Request](#9-forking--raising-a-pull-request)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What is ReVerto?

ReVerto is a **circular economy marketplace** for industrial and household waste materials. It
connects businesses and individuals who generate waste (sellers) with those who can repurpose,
recycle, or remanufacture it (buyers) — creating a closed-loop system where one party's waste
becomes another's raw material.

Think of it as a **real-time commodity exchange, but for waste**. A furniture factory with
leftover hardwood offcuts lists them. A small carpentry workshop buys them. A textile mill with
surplus fabric posts it. A fashion startup sources it at a fraction of the virgin price. Both
parties win — and so does the planet.

### The Problem ReVerto Solves

Every year, billions of kilograms of recyclable and reusable material end up in landfills —
not because they have no value, but because there is no efficient way to match supply with
demand. Existing solutions are fragmented: WhatsApp groups, Excel sheets, cold emails, and
informal broker networks. There is no price discovery, no negotiation infrastructure, and no
accountability.

ReVerto solves all three:

- **Discovery** — A searchable, category-filtered marketplace where waste listings are visible
  to verified buyers in real time.
- **Negotiation** — An integrated chat and price-proposal system where buyers and sellers reach
  a mutually agreed price before any money changes hands.
- **Trust & Accountability** — A rating system tied to completed transactions ensures every
  participant has reputation skin in the game.

### Who Uses ReVerto?

| Role | Who they are | What they do |
|---|---|---|
| **Seller** | Factory, warehouse, SME, or individual with surplus/waste material | Lists products with quantity, price, and category; responds to buyer enquiries; proposes prices |
| **Buyer** | Recycler, manufacturer, reseller, or individual seeking discounted raw materials | Browses marketplace; adds to cart; opens enquiries; negotiates; confirms payment |

Both roles are first-class citizens in the app. A user can be both a buyer and a seller
simultaneously — a recycler might buy plastic waste and sell processed pellets.

---

## 2. How It Works — The Flow

```
Seller lists waste product
        │
        ▼
Buyer browses marketplace (category filters, search, or map view)
        │
        ├─── Direct Purchase path ──────────────────────────────────┐
        │    Buyer clicks "Buy Now" on a listing                    │
        │    → PaymentModal shows price + 18% GST                  │
        │    → direct_purchase creates a Closed enquiry immediately │
        │    → inventory reduced instantly                          │
        │                                                            │
        └─── Negotiation path ──────────────────────────────────────┤
             Buyer adds to cart → clicks "Proceed to Enquiry"       │
                     │                                               │
                     ▼                                               │
             System creates Enquiry record (buyer ↔ seller ↔ product│
                     │                                               │
                     ▼                                               │
             Buyer & Seller negotiate in real-time chat              │
               ├─ Seller proposes price → Buyer accepts / rejects    │
               └─ Free-text messages throughout                      │
                     │                                               │
                     ▼                                               │
             Enquiry: Open → Negotiating → Accepted                  │
                     │                                               │
                     ▼                                               │
             Buyer clicks "Pay Now" → Payment confirmed              │
                     │                                               │
                     ▼                                               │
             Enquiry status: Closed ◄──────────────────────────────-┘
Product inventory reduced by the transacted quantity
        │
        ▼
Both parties see updated CO₂ savings on the Sustainability Widget
```

### The Enquiry Lifecycle

| Status | Meaning |
|---|---|
| `Open` | Buyer just submitted enquiry, seller not yet responded |
| `Negotiating` | At least one message or price proposal exchanged |
| `Accepted` | Buyer accepted seller's proposed price — deal agreed |
| `Rejected` | Seller rejected or deal cancelled |
| `Closed` | Payment confirmed — transaction complete |

---

## 3. Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend framework** | Frappe 15 (Python) | Battle-tested ERP framework with built-in auth, ORM, REST API, real-time events, and admin desk |
| **Database** | MariaDB 10.6+ | Default Frappe DB — transactional, reliable, well-supported on Linux |
| **Task queue / cache** | Redis | Frappe uses Redis for job queues, caching, and WebSocket pub/sub |
| **Web server** | Nginx + Gunicorn | Production-ready reverse proxy setup via bench |
| **Frontend** | React 19 + TypeScript | Component-based SPA with strong typing |
| **Build tool** | Vite (rolldown) | Sub-second HMR, fast production builds |
| **Styling** | Tailwind CSS 4 | Utility-first; consistent design system |
| **UI components** | Radix UI + shadcn pattern | Accessible, unstyled primitives composed into custom components |
| **Icons** | Lucide React | Consistent SVG icon set |
| **Frappe ↔ React bridge** | frappe-react-sdk | Handles CSRF, session cookies, SWR-style caching, real-time listeners |
| **Real-time chat** | Frappe WebSocket (`publish_realtime`) | Built into Frappe — no extra infrastructure needed |
| **Maps** | React Map GL + MapLibre + Supercluster | Interactive product map with clustering; free OpenStreetMap tiles, no API key needed |

---

## 4. Unique Selling Points

### 4.1 Negotiation-First Payment Model

Most marketplaces have a fixed price or a bidding system. ReVerto uses a **structured
negotiation protocol**: the buyer opens an enquiry at the listed price, the seller can propose
a different price, the buyer accepts or rejects, and payment is only triggered after explicit
acceptance. This mirrors how B2B commodity trades actually happen — no surprise charges.

### 4.2 Real-Time Inventory Reduction

When a buyer pays for 50 kg of a 100 kg listing, the product does not disappear from the
marketplace. The inventory drops to 50 kg and the listing remains visible. This allows a
single large batch of material to be traded across multiple buyers — critical for industrial
waste quantities that would rarely be bought by a single party.

### 4.3 Dynamic CO₂ Sustainability Index

Every completed transaction contributes to a live, personalized CO₂ impact score on the
home page. The calculation uses category-specific emission-saving factors (sourced from WRAP,
EPA WARM, and IPCC AR6) and covers both sides of every deal — buying *and* selling waste both
count. Crucially, the factors are stored in a database DocType (`CO2 Factor`), not hardcoded
— an admin can update them from the Frappe admin panel whenever new research is published,
without touching code or redeploying.

### 4.4 Role-Aware UX

Buyers and sellers see completely different home screens. A seller lands on a dashboard with
their listings, enquiry inbox, and quick-add tools. A buyer lands on the marketplace with
category filters, search, and a cart. The routing is automatic based on account type, set
at signup. A user who registered as a seller can still browse as a buyer — the nav shows
both modes.

### 4.5 Built on Frappe — Zero Infrastructure Overhead

Frappe provides authentication, permissions, admin UI, database migrations, scheduled jobs,
email notifications, and a REST API layer out of the box. ReVerto builds on top of this
foundation rather than reinventing it. This means a new contributor can have a fully
functional local environment — with login, DB, API, and hot-reload frontend — in under 20
minutes, using a single tool (`bench`).

### 4.6 Pre-Seeded Reference Data

The `bench migrate` command does not just create tables — it also loads the CO₂ factor
reference data (8 categories + 1 fallback) from a fixtures file. Every fresh install starts
with sensible, cited defaults that work immediately without manual data entry.

---

## 5. Prerequisites

Before you begin, make sure your Ubuntu VM meets these requirements.

### System requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| RAM | 4 GB | 8 GB |
| Disk | 20 GB free | 40 GB free |
| CPU | 2 cores | 4 cores |
| Ubuntu version | 22.04 LTS | 24.04 LTS |
| Internet | Required | Required |

### Accounts you will need

- A **GitHub account** (free) — needed to fork the repo and raise PRs
- Access to the **ReVerto repository** on GitHub

---

## 6. Part A — Full Setup from Scratch (Ubuntu / Ubuntu VM)

Follow every step in order. Each section builds on the previous one.

---

### Step 1 — Update the system

Open a terminal and run:

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

This ensures all system packages are current before installing new dependencies.

---

### Step 2 — Install system dependencies

Frappe Bench needs Python, Node.js, MariaDB, Redis, wkhtmltopdf, and a few build tools.

```bash
sudo apt-get install -y \
  git curl wget \
  python3-dev python3-pip python3-venv \
  build-essential \
  libffi-dev libssl-dev \
  libjpeg-dev libpng-dev zlib1g-dev \
  mariadb-server mariadb-client \
  redis-server \
  wkhtmltopdf \
  xvfb libfontconfig \
  supervisor \
  nginx
```

---

### Step 3 — Install Node.js 18+ via NVM

Do **not** use the Ubuntu default Node — it is usually outdated. Use NVM:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# Reload your shell so nvm is available
source ~/.bashrc

# Install and activate Node 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify
node -v    # should print v18.x.x
npm -v
```

---

### Step 4 — Install Yarn

Frappe Bench uses Yarn for frontend dependencies:

```bash
npm install -g yarn
yarn -v    # should print 1.x.x
```

---

### Step 5 — Configure MariaDB

#### 5a. Secure the installation

```bash
sudo mysql_secure_installation
```

When prompted:
- Set root password: **yes** — choose a strong password and remember it
- Remove anonymous users: **yes**
- Disallow root login remotely: **yes**
- Remove test database: **yes**
- Reload privilege tables: **yes**

#### 5b. Set the character set

Frappe requires `utf8mb4` encoding. Edit the MariaDB config:

```bash
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

Find the `[mysqld]` section and add these lines:

```ini
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4
```

Save and restart MariaDB:

```bash
sudo systemctl restart mariadb
sudo systemctl enable mariadb
```

#### 5c. Create a MariaDB user for Frappe

```bash
sudo mysql -u root -p
```

Inside the MariaDB shell:

```sql
CREATE USER 'frappe'@'localhost' IDENTIFIED BY 'your_strong_password_here';
GRANT ALL PRIVILEGES ON *.* TO 'frappe'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EXIT;
```

> **Note:** Replace `your_strong_password_here` with something real. You will need this
> password when creating your Frappe site in Step 9.

---

### Step 6 — Enable and verify Redis

```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server
redis-cli ping    # should respond: PONG
```

---

### Step 7 — Install Frappe Bench CLI

```bash
pip3 install frappe-bench

# Reload PATH if bench is not found immediately
source ~/.profile

bench --version    # should print bench 5.x.x or higher
```

If `bench` is not found after install, add pip's local bin to your PATH:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
bench --version
```

---

### Step 8 — Initialise a new bench

This creates a self-contained directory with Frappe, its Python environment, and all tooling:

```bash
bench init reverto-bench --frappe-branch version-15 --python python3

cd reverto-bench
```

> This step downloads Frappe from GitHub and can take 3–5 minutes depending on your
> internet connection.

---

### Step 9 — Create a site

A "site" in Frappe is a separate database + config, like a virtual host. You can run multiple
sites on one bench.

```bash
bench new-site reverto.localhost \
  --db-root-password your_mariadb_root_password \
  --admin-password admin
```

Replace `your_mariadb_root_password` with the MariaDB root password you set in Step 5a.
The `--admin-password admin` sets the Frappe Administrator password (you will use this to
log into the admin desk).

Add the site to your hosts file so the browser resolves it:

```bash
echo "127.0.0.1 reverto.localhost" | sudo tee -a /etc/hosts
```

---

### Step 10 — Get the ReVerto app

#### Option A — Get directly from the main repo (read-only)

```bash
bench get-app https://github.com/YOUR_ORG/reverto --branch develop
```

#### Option B — Get from your fork (recommended for contributing — see Section 9 first)

```bash
bench get-app https://github.com/YOUR_GITHUB_USERNAME/reverto --branch develop
```

> `bench get-app` clones the repo into `apps/reverto` and installs its Python dependencies
> into the bench's virtual environment automatically.

---

### Step 11 — Install the app on the site

```bash
bench --site reverto.localhost install-app reverto
```

This runs the Frappe installer for the app: creates all DocType tables, applies fixtures
(including the CO₂ factors), and sets up permissions.

---

### Step 12 — Run database migrations

```bash
bench --site reverto.localhost migrate
```

This step:
- Creates any new database tables defined in DocTypes
- Applies any patches
- Syncs fixtures (seeds the `CO2 Factor` table with default values)

---

### Step 13 — Build the frontend

The React SPA needs to be compiled and its output placed where Frappe can serve it:

```bash
cd apps/reverto/frontend
yarn install
yarn build
cd ../../..
```

---

### Step 14 — Set up pre-commit hooks (required for contributors)

Pre-commit runs linters (ruff, eslint, prettier) before every commit to maintain code quality:

```bash
pip3 install pre-commit
cd apps/reverto
pre-commit install
cd ../..
```

---

### Step 15 — Start the bench

```bash
bench start
```

This starts all required processes:
- Gunicorn (Python web server)
- Redis (cache + queue)
- Frappe worker (background jobs)
- Frappe scheduler

Open your browser at: **http://reverto.localhost:8000**

You should see the ReVerto marketplace. Log in with:
- **Username:** `Administrator`
- **Password:** `admin` (what you set in Step 9)

---

## 7. Part B — Bench Already Installed? Start Here

If you already have Frappe Bench set up and running on your machine, skip to here.

### Step 1 — Navigate to your bench

```bash
cd ~/reverto-bench    # or wherever your bench directory is
```

### Step 2 — Get the ReVerto app

```bash
bench get-app https://github.com/YOUR_GITHUB_USERNAME/reverto --branch develop
```

### Step 3 — Create a site (skip if you already have one for ReVerto)

```bash
bench new-site reverto.localhost \
  --db-root-password your_mariadb_root_password \
  --admin-password admin

echo "127.0.0.1 reverto.localhost" | sudo tee -a /etc/hosts
```

### Step 4 — Install the app

```bash
bench --site reverto.localhost install-app reverto
```

### Step 5 — Migrate and seed

```bash
bench --site reverto.localhost migrate
```

### Step 6 — Build the frontend

```bash
cd apps/reverto/frontend
yarn install
yarn build
cd ../../..
```

### Step 7 — Install pre-commit

```bash
pip3 install pre-commit
cd apps/reverto && pre-commit install && cd ../..
```

### Step 8 — Start

```bash
bench start
```

Visit **http://reverto.localhost:8000** — done.

---

## 8. Running the Project

### Standard start

```bash
cd reverto-bench
bench start
```

### Frontend hot-reload during development

In one terminal, run bench:
```bash
bench start
```

In a second terminal, run Vite's dev server:
```bash
cd reverto-bench/apps/reverto/frontend
yarn dev
```

The Vite dev server proxies API calls to Frappe and gives you instant hot module replacement
when editing React components — changes reflect in the browser without a page reload or
rebuild. The SPA is served at **http://reverto.localhost:5173** in dev mode.

### Accessing the Frappe Admin Desk

Go to **http://reverto.localhost:8000/app** and log in as Administrator.

From the admin desk you can:
- View and edit all DocType records (Products, Enquiries, Messages, Orders, Ratings)
- Edit CO₂ Factor values under: **ReVerto → CO2 Factor**
- Manage users and permissions
- View background job logs

### Creating test users

From the admin desk or directly via the app's signup page:
1. Go to **http://reverto.localhost:8000** → click **Sign Up**
2. Create one account with Account Type = **Seller**
3. Create another account with Account Type = **Buyer**
4. Log in as the Seller and create a product listing
5. Log in as the Buyer and start an enquiry

---

## 9. Forking & Raising a Pull Request

This section explains the full Git workflow for contributing to ReVerto.

### Step 1 — Fork the repository

1. Go to the ReVerto repository on GitHub
2. Click the **Fork** button in the top-right corner
3. Select your account as the destination
4. GitHub creates `https://github.com/YOUR_USERNAME/reverto` — this is your personal copy

### Step 2 — Clone your fork locally (if starting fresh)

If you followed Part A and used `bench get-app` with your fork URL, you already have it.
If not, you need to add your fork as a remote:

```bash
cd reverto-bench/apps/reverto

# Check current remotes
git remote -v

# The output should show 'origin' pointing to the original repo.
# Add your fork as a second remote called 'fork':
git remote add fork https://github.com/YOUR_USERNAME/reverto.git

# Verify
git remote -v
```

> If you cloned your fork directly (as recommended in Section 6 Step 10), `origin` is
> already your fork. In that case, add the original repo as `upstream`:
> ```bash
> git remote add upstream https://github.com/ORIGINAL_ORG/reverto.git
> ```

### Step 3 — Keep your fork up to date

Before starting any new work, always sync with the latest changes from the main repo:

```bash
# Fetch latest from upstream (original repo)
git fetch upstream

# Switch to develop (the main working branch)
git checkout develop

# Merge upstream changes into your local develop
git merge upstream/develop

# Push the update to your fork on GitHub
git push origin develop
```

### Step 4 — Create a feature branch

**Never commit directly to `develop`.** Always create a descriptive branch for your work:

```bash
# Branch naming convention: type/short-description
# Examples:
git checkout -b feat/add-map-view
git checkout -b fix/cart-quantity-overflow
git checkout -b docs/update-api-reference
git checkout -b refactor/sustainability-widget
```

Use these prefixes:
| Prefix | Use for |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `refactor/` | Code restructure, no behaviour change |
| `chore/` | Build scripts, deps, tooling |

### Step 5 — Make your changes

Write your code. Follow the project conventions:
- **Backend (Python):** Frappe whitelisted APIs in `reverto/api/`, DocTypes in `reverto/reverto/doctype/`
- **Frontend (TypeScript):** Components in `frontend/src/components/`, pages in `frontend/src/pages/`
- **Styling:** Tailwind utility classes — avoid inline styles
- **No hardcoded data:** Use DocTypes or constants files, not magic strings in functions

### Step 6 — Test your changes locally

Run the frontend build to catch TypeScript errors:
```bash
cd apps/reverto/frontend
yarn build
```

Run the linter:
```bash
yarn lint
```

Check Python with ruff (if you changed backend code):
```bash
cd apps/reverto
ruff check reverto/
```

Verify your changes in the browser by visiting http://reverto.localhost:8000.

### Step 7 — Stage and commit

Stage only the files you intentionally changed:

```bash
git add frontend/src/components/MyComponent.tsx
git add reverto/api/enquiry.py
# Do NOT use 'git add .' blindly — it may include build output or secrets
```

Write a clear commit message. Use the imperative mood ("Add", "Fix", "Remove", not "Added"
or "Fixes"):

```bash
git commit -m "feat: add map view to marketplace with OpenStreetMap tiles"
```

The pre-commit hook will run automatically and check formatting. If it fails:
1. It will fix most issues automatically (ruff, prettier)
2. Re-stage the auto-fixed files: `git add -u`
3. Run `git commit` again

### Step 8 — Push your branch to your fork

```bash
git push origin feat/add-map-view
```

If it's your first push for this branch, Git will ask you to set the upstream:

```bash
git push --set-upstream origin feat/add-map-view
```

### Step 9 — Open the Pull Request on GitHub

1. Go to **your fork** on GitHub: `https://github.com/YOUR_USERNAME/reverto`
2. GitHub will show a yellow banner: **"Compare & pull request"** — click it
3. Make sure the base is set to: **original repo → `develop`** (not `main`)
4. Fill in the PR form:

```
Title: feat: add map view to marketplace with OpenStreetMap tiles

Description:
## What this PR does
- Adds an interactive map view as an alternative to the grid view
- Renders product pins using the product's location field
- Falls back to grid if geolocation is not available

## How to test
1. Log in as a buyer
2. Go to the marketplace
3. Click the "Map" toggle in the top-right
4. Pins for each listing should appear

## Screenshots
[paste before/after screenshots if it's a UI change]

## Checklist
- [ ] `npm run build` passes with no errors
- [ ] `npm run lint` passes
- [ ] Tested locally in the browser
- [ ] No hardcoded test data or console.log statements left in
```

5. Click **Create Pull Request**

### Step 10 — Respond to review feedback

Reviewers may request changes. To update your PR:

```bash
# Make the requested changes to your files
# Then stage, commit, and push to the same branch

git add .
git commit -m "fix: address review feedback — use cluster markers for dense areas"
git push origin feat/add-map-view
```

GitHub automatically updates the open PR with your new commits. No need to close and
reopen it.

### Step 11 — After your PR is merged

Once a maintainer merges your PR, clean up:

```bash
# Switch back to develop
git checkout develop

# Pull the merged changes
git fetch upstream
git merge upstream/develop
git push origin develop

# Delete your feature branch locally
git branch -d feat/add-map-view

# Delete it on your fork too
git push origin --delete feat/add-map-view
```

---

## 10. Troubleshooting

### `bench` command not found after install

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### `bench start` fails with "Address already in use"

Another process is using port 8000. Find and kill it:

```bash
sudo lsof -i :8000
sudo kill -9 <PID>
```

### MariaDB connection refused

```bash
sudo systemctl status mariadb
sudo systemctl start mariadb
```

### `bench migrate` fails with character set errors

Make sure you applied the `utf8mb4` config in Step 5b and restarted MariaDB.

### Redis not running

```bash
sudo systemctl start redis-server
redis-cli ping    # must return PONG
```

### Frontend shows blank page or 404 after `npm run build`

Make sure the build completed without errors, then restart bench:

```bash
cd apps/reverto/frontend && yarn build && cd ../../..
bench restart
```

### Pre-commit hook fails on commit

Pre-commit auto-fixes most issues. After it runs:

```bash
git add -u          # re-stage the auto-fixed files
git commit          # commit again
```

If the hook keeps failing and you need to investigate:

```bash
pre-commit run --all-files
```

### `bench get-app` fails with permission errors on the sites directory

```bash
sudo chown -R $USER:$USER ~/reverto-bench/sites
```

### VM-specific: browser cannot reach reverto.localhost:8000

If you are running Ubuntu inside a VM and accessing the browser from your host machine,
you need to either:

**Option A — Port forward in your VM settings:**
Forward host port `8000` → guest port `8000` in VirtualBox / VMware network settings.

**Option B — Use the VM's IP directly:**
```bash
# In the VM, find the IP
ip addr show | grep "inet "

# On your host, add to /etc/hosts (macOS/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows):
192.168.x.x  reverto.localhost
```

Then visit `http://reverto.localhost:8000` from your host browser.

---

*Last updated: March 2026 · ReVerto v0.1 · Built with Frappe 15 + React 19*
