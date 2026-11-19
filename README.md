# TriPhoriaSolutionByKaushik

Backend assessment using Node.js, TypeScript, Express, Temporal and Redis.

Temporal calls two mock suppliers in parallel and keeps the cheapest offer for each hotel name. The results are saved in Redis, which also handles price filtering.

## Setup

Install Docker with Docker Compose, then run:

```sh
git clone https://github.com/Kaushik9560/TriPhoriaSolutionByKaushik.git
cd TriPhoriaSolutionByKaushik
docker compose up --build -d
```

API: `http://localhost:3000`

Temporal UI: `http://localhost:8233`

To deploy, run the same command on your server and replace localhost with the server address. To stop, use `docker compose down`.

## Endpoints

```text
GET /api/hotels?city=delhi
GET /api/hotels?city=delhi&minPrice=5000&maxPrice=6000
GET /supplierA/hotels
GET /supplierB/hotels
GET /health
```

Delhi and Mumbai have sample data. An unknown city returns an empty list. Either price limit can be left out.

Import `postman/hotels.postman_collection.json` into Postman to try the requests.

## Notes

- Redis data expires after 5 minutes.
- `/health` checks both suppliers. Failed calls are logged and retried once.
- If one supplier is down, the other supplier's offers are returned. If both are down, the API returns 503.
