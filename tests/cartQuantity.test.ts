import { toValidQuantity } from '../src/domain/cart/cartQuantity';
import type { Medicine } from '../src/types/models';
const medicine: Medicine = { id: 'example', name: 'Example medicine', salt: 'Example salt', price: 100, maxQty: 3, rx: false };
describe('toValidQuantity', () => { it('keeps quantities inside the catalog limit', () => { expect(toValidQuantity(2, medicine)).toBe(2); expect(toValidQuantity(10, medicine)).toBe(3); expect(toValidQuantity(0, medicine)).toBe(1); }); });
