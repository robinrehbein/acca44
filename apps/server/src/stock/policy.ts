export interface Quantity { id: string; quantity: number }
export interface LocationAvailability { id: string; name: string; available: number }
export const locationPriority = (name: string) => ['Lindau', 'Friedrichshafen'].indexOf(name);
export function allocate(locations: LocationAvailability[], quantity: number): Quantity[] {
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Ungültige Menge');
  let remaining = quantity;
  const result: Quantity[] = [];
  for (const location of [...locations].filter(l => locationPriority(l.name) >= 0).sort((a, b) => locationPriority(a.name) - locationPriority(b.name) || a.id.localeCompare(b.id))) {
    const count = Math.min(remaining, Math.max(0, location.available));
    if (count > 0) result.push({ id: location.id, quantity: count });
    remaining -= count;
    if (!remaining) break;
  }
  if (remaining) throw new Error('Nicht genügend Bestand verfügbar. Bitte Warenkorb aktualisieren.');
  return result;
}
export function remainingAtLocations(original: Quantity[], used: Quantity[]): Quantity[] {
  const balances = new Map<string, number>();
  for (const row of original) balances.set(row.id, (balances.get(row.id) ?? 0) + row.quantity);
  for (const row of used) balances.set(row.id, (balances.get(row.id) ?? 0) - row.quantity);
  return [...balances].filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ id, quantity }));
}
