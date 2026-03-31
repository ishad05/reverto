# ReVerto

A two-sided waste marketplace built on Frappe Framework. Buyers and sellers can list, discover, and transact in waste materials—with a current focus on e-waste, plastics, metals, and other recyclable categories.

## Features

- **Marketplace browsing** – filter by category, search by keyword, and view products on an interactive map with clustering.
- **Real-time negotiation** – buyers initiate enquiries, sellers propose prices, and both parties chat in real time via Frappe pub/sub sockets.
- **Direct purchase** – skip negotiation and buy at the listed price instantly.
- **Cart checkout** – add multiple products, review GST-inclusive totals, and submit batch enquiries.
- **Seller dashboard** – manage listings, track inbound enquiries, and view completed order revenue.
- **Environmental impact tracking** – per-category CO₂ factor data powers a live sustainability widget showing personal and community waste diverted.
- **Ratings** – buyers can rate sellers (1–5 stars) after a completed transaction.
- **Location-aware** – product location parsed from Google Maps or OpenStreetMap URLs; user's current city shown via browser geolocation + OSM reverse-geocoding.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Frappe Framework (Python), MariaDB |
| Frontend | React + TypeScript, Vite, Tailwind CSS 4, shadcn/ui (Radix) |
| Maps | React Map GL (MapLibre), Supercluster, OpenStreetMap tiles |
| Frappe integration | `frappe-react-sdk` |

## Installation

Install via [bench](https://github.com/frappe/bench):

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch develop
bench install-app reverto
```

## Development

### Frontend

```bash
cd apps/reverto/frontend
yarn dev        # Vite dev server at http://reverto.localhost:5173
yarn build      # Production build + copy HTML entry into reverto/www/
```

The dev server proxies `/api`, `/assets`, and `/files` to `http://reverto.localhost:8000` (Frappe).

### Backend tests

```bash
bench --site <site> run-tests --app reverto
```

## Contributing

This app uses `pre-commit` for code formatting and linting. Install and enable it before your first commit:

```bash
cd apps/reverto
pre-commit install
```

Configured tools:

- **ruff** – Python linting and formatting
- **eslint** – TypeScript/TSX linting
- **prettier** – JS/TS/CSS formatting
- **pyupgrade** – Python syntax modernisation

## CI

GitHub Actions workflows:

- **CI** – installs the app and runs unit tests on every push to `develop`.
- **Linters** – runs [Frappe Semgrep Rules](https://github.com/frappe/semgrep-rules) and [pip-audit](https://pypi.org/project/pip-audit/) on every pull request.

## Further reading

- [ARCHITECTURE.md](ARCHITECTURE.md) – component overview, data model, and key flows.
- [AGENTS.md](AGENTS.md) – practical guide for AI agents and developers making day-to-day changes.

## License

MIT
