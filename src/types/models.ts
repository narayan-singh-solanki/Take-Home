export interface Medicine { id: string; name: string; salt: string; /** Integer rupees, matching catalog convention. */ price: number; maxQty: number; rx: boolean; }
/** Reference the catalog medicine by id; do not duplicate product data in cart state. */
export interface CartItem { medicineId: Medicine['id']; quantity: number; }
export type CouponCode = 'FLAT50' | 'SAVE10' | 'FREEDEL' | 'FIRST100';
export interface CouponState { code: CouponCode | null; isApplied: boolean; errorMessage?: string; }
export interface BillBreakdown { itemTotal: number; discount: number; deliveryFee: number; grandTotal: number; }
export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'blocked';
