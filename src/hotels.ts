export type Hotel = {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
};

export type SupplierHotel = Omit<Hotel, 'supplier'> & {
  hotelId: string;
  city: string;
};

export const suppliers: Record<string, SupplierHotel[]> = {
  A: [
    { hotelId: 'a1', name: 'Holtin', price: 6000, city: 'delhi', commissionPct: 10 },
    { hotelId: 'a2', name: 'Radison', price: 5900, city: 'delhi', commissionPct: 13 },
    { hotelId: 'a3', name: 'City Inn', price: 3200, city: 'delhi', commissionPct: 8 },
    { hotelId: 'a4', name: 'Sea View', price: 4500, city: 'mumbai', commissionPct: 12 }
  ],
  B: [
    { hotelId: 'b1', name: 'Holtin', price: 5340, city: 'delhi', commissionPct: 20 },
    { hotelId: 'b2', name: 'Radison', price: 6200, city: 'delhi', commissionPct: 15 },
    { hotelId: 'b3', name: 'Park Stay', price: 4100, city: 'delhi', commissionPct: 9 },
    { hotelId: 'b4', name: 'Sea View', price: 4200, city: 'mumbai', commissionPct: 14 }
  ]
};

export function bestOffers(hotels: Hotel[]): Hotel[] {
  const best = new Map<string, Hotel>();
  for (const hotel of hotels) {
    const name = hotel.name.trim().toLowerCase();
    const current = best.get(name);
    // Keep the first supplier's offer when prices are equal.
    if (!current || hotel.price < current.price) best.set(name, hotel);
  }
  return [...best.values()];
}
