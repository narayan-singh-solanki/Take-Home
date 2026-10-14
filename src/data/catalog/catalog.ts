import type { Medicine } from '../../types/models';
/** No catalog fixture was present at initialization. Import the supplied local JSON here when available. */
export const catalog: readonly Medicine[] = [];
export function getMedicineById(id: string): Medicine | undefined { return catalog.find((medicine) => medicine.id === id); }
