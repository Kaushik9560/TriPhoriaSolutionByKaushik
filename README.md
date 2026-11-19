# TriPhoriaSolutionByKaushik

## Hotel Offer Orchestrator

A small Express + TypeScript API using Temporal and Redis. It compares two mock hotel suppliers and returns the cheapest offer for each hotel name.

## Run with Docker

Install Docker with the Compose plugin, then run:

```sh
docker compose up --build -d
docker compose logs -f api worker
```

The API is at `http://localhost:3000`. Temporal's UI is at `http://localhost:8233`; search for workflows starting with `hotels-` to inspect the supplier activities.

```sh
curl 'http://localhost:3000/api/hotels?city=delhi'
curl 'http://localhost:3000/api/hotels?city=delhi&minPrice=5000&maxPrice=6000'
curl 'http://localhost:3000/health'
```

The second request returns:

```json
[
  { "name": "Holtin", "price": 5340, "commissionPct": 20, "supplier": "Supplier B" },
  { "name": "Radison", "price": 5900, "commissionPct": 13, "supplier": "Supplier A" }
]
```

Delhi has four unique hotels; Mumbai has one. An unknown city returns `[]`.

Stop the services with `docker compose down`. The Temporal development database is kept in a named volume. This setup is intended for the assessment and local demonstrations.

## Run Node locally

Use Node.js 22 or newer. Start Redis and Temporal first:

```sh
docker compose up -d redis temporal
npm ci
npm run build
npm start
```

In another terminal:

```sh
npm run worker
```

Alternatively, run an existing Redis instance on port 6379 and `temporal server start-dev` on port 7233, then use the same npm commands.

Environment variables (defaults work locally):

| Variable | Default | Used by |
| --- | --- | --- |
| `PORT` | `3000` | API |
| `TEMPORAL_ADDRESS` | `localhost:7233` | API and worker |
| `REDIS_URL` | `redis://localhost:6379` | API |
| `SUPPLIER_URL` | `http://localhost:3000` | Worker and supplier health checks |
| `SUPPLIER_A_DOWN` / `SUPPLIER_B_DOWN` | `false` | Mock APIs |

## How it works

1. `GET /api/hotels` validates the city and price bounds, then starts a Temporal workflow.
2. The workflow calls both supplier APIs in parallel using activities. Each failed activity gets one retry.
3. Hotels are grouped by trimmed, case-insensitive name. The cheapest offer keeps its own commission and supplier. Equal prices keep Supplier A's offer.
4. Redis stores the complete deduplicated list in `hotels:<city>`, using hotel JSON as the member and price as the sorted-set score. Keys expire after five minutes.
5. Redis `ZRANGEBYSCORE` applies the inclusive price range and returns results in price order. Saving and reading happen in one transaction so concurrent searches cannot mix their responses.

Every search refreshes the suppliers; Redis stores the latest result and performs filtering. Either price bound can be omitted. Blank, negative, non-numeric, repeated, or reversed price bounds return `400`. A missing city also returns `400`.

If one supplier fails, the API returns the available supplier's offers. Both suppliers failing, Redis failing, or a workflow timing out returns `503`. `/health` reports the availability of both suppliers; it does not test worker readiness.

## Postman

Import `postman/hotels.postman_collection.json` into Postman. Its `baseUrl` variable defaults to `http://localhost:3000`. Run the collection with both suppliers available.

To try a supplier outage:

```sh
SUPPLIER_B_DOWN=true docker compose up -d api
curl 'http://localhost:3000/api/hotels?city=delhi'
curl 'http://localhost:3000/health'
```

The search returns three Supplier A hotels; health returns `503` with `supplierB: "down"`. Restore the mock with:

```sh
SUPPLIER_B_DOWN=false docker compose up -d api
```

## Files

- `src/app.ts`, `server.ts`: routes and connections.
- `src/workflows.ts`, `activities.ts`, `worker.ts`: Temporal orchestration and HTTP calls.
- `src/hotels.ts`: sample data and cheapest-offer selection.
- `src/store.ts`: Redis storage and filtering.
- `Dockerfile`, `compose.yaml`: application and services.

To deploy the demo on a machine with Docker, copy this project and run `docker compose up --build -d`. Use that machine's address and port 3000 for API requests.
