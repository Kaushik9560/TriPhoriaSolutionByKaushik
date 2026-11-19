import { log } from '@temporalio/activity';
import type { Hotel, SupplierHotel } from './hotels';

export async function fetchHotels(supplier: string, city: string): Promise<Hotel[]> {
  const baseUrl = process.env.SUPPLIER_URL || 'http://localhost:3000';
  try {
    const response = await fetch(`${baseUrl}/supplier${supplier}/hotels?city=${encodeURIComponent(city)}`, {
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw new Error(`Supplier ${supplier} returned ${response.status}`);
    const hotels: SupplierHotel[] = await response.json();
    return hotels.map(({ name, price, commissionPct }) => ({
      name, price, commissionPct, supplier: `Supplier ${supplier}`
    }));
  } catch (error) {
    log.warn(`Supplier ${supplier} request failed`, { error: String(error) });
    throw error;
  }
}
