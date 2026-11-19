import express from 'express';
import type { Hotel } from './hotels';
import { suppliers } from './hotels';

type Search = (city: string, min: number, max: number) => Promise<Hotel[]>;

export function createApp(search: Search) {
  const app = express();
  app.disable('x-powered-by');

  for (const supplier of ['A', 'B']) {
    app.get(`/supplier${supplier}/hotels`, (req, res) => {
      if (process.env[`SUPPLIER_${supplier}_DOWN`] === 'true') {
        return res.status(503).json({ error: `Supplier ${supplier} is down` });
      }
      const city = typeof req.query.city === 'string' ? req.query.city.trim().toLowerCase() : '';
      res.json(suppliers[supplier].filter(hotel => !city || hotel.city === city));
    });
  }

  app.get('/api/hotels', async (req, res) => {
    const { city, minPrice, maxPrice } = req.query;
    if (typeof city !== 'string' || !city.trim() || city.length > 100) {
      return res.status(400).json({ error: 'city is required (up to 100 characters)' });
    }
    const validPrice = (value: unknown) => value === undefined || (
      typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
    );
    const min = minPrice === undefined ? 0 : Number(minPrice);
    const max = maxPrice === undefined ? Infinity : Number(maxPrice);
    if (!validPrice(minPrice) || !validPrice(maxPrice) || min > max) {
      return res.status(400).json({ error: 'Prices must be non-negative numbers, with minPrice <= maxPrice' });
    }
    try {
      res.json(await search(city.trim().toLowerCase(), min, max));
    } catch (error) {
      console.error('Hotel search failed:', error);
      res.status(503).json({ error: 'Hotel search is unavailable. Check the worker, suppliers and Redis.' });
    }
  });

  app.get('/health', async (_req, res) => {
    const baseUrl = process.env.SUPPLIER_URL || `http://localhost:${process.env.PORT || 3000}`;
    const [supplierA, supplierB] = await Promise.all(['A', 'B'].map(async supplier => {
      try {
        const response = await fetch(`${baseUrl}/supplier${supplier}/hotels`, { signal: AbortSignal.timeout(3000) });
        return response.ok ? 'up' : 'down';
      } catch {
        return 'down';
      }
    }));
    const healthy = supplierA === 'up' && supplierB === 'up';
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', supplierA, supplierB });
  });
  return app;
}
