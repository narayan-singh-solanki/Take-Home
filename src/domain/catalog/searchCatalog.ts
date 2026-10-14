import type { Medicine } from '../../types/models';

export function searchCatalog(catalog: readonly Medicine[], query: string): Medicine[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  return catalog.filter((medicine) =>
    `${medicine.name} ${medicine.salt}`.toLocaleLowerCase().includes(normalizedQuery),
  );
}
