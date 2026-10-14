import type { Medicine } from '../../types/models';
import catalogJson from './catalog.json';

export const catalog: readonly Medicine[] = catalogJson;
export function getMedicineById(id: string): Medicine | undefined { return catalog.find((medicine) => medicine.id === id); }
