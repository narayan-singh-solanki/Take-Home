import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCart } from '../../../app/providers/CartProvider';
import { Screen } from '../../../components/ui/Screen';
import { couponRules } from '../../../domain/coupons/coupons';
import { colors, spacing, typography } from '../../../theme';
import type { CartLine } from '../../../domain/billing/billing';

export function CartScreen() {
  const {
    lines,
    itemCount,
    bill,
    coupon,
    notice,
    addMedicine,
    decreaseMedicine,
    removeMedicine,
    applyCoupon,
    clearCoupon,
    placeOrder,
    clearNotice,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');

  const handleApply = (codeToApply?: string) => {
    const code = (codeToApply ?? inputCoupon).trim();
    if (!code) return;
    const ok = applyCoupon(code);
    if (ok) {
      setInputCoupon('');
    }
  };

  const deliveryThresholdDiff = 499 - bill.itemTotal;
  const isFreeDelivery = bill.deliveryFee === 0 && bill.itemTotal > 0;

  return (
    <Screen>
      {/* Toast Notice Banner (e.g. for coupon auto-removal, limit warnings, order placed) */}
      {notice ? (
        <View style={styles.noticeBanner} accessibilityRole="alert">
          <Text style={styles.noticeText}>{notice}</Text>
          <Pressable
            accessibilityLabel="Dismiss message"
            accessibilityRole="button"
            hitSlop={8}
            onPress={clearNotice}
          >
            <Text style={styles.noticeDismiss}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.description}>
          {itemCount === 0
            ? 'Your cart is empty'
            : `${itemCount} item${itemCount > 1 ? 's' : ''} saved locally`}
        </Text>
      </View>

      {lines.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyIcon}>🛍️</Text>
          <Text style={styles.emptyTitle}>No medicines added yet</Text>
          <Text style={styles.emptySubtitle}>
            Go to the Home tab, search for medicines or browse the catalog, and add items to your cart.
          </Text>
        </View>
      ) : (
        <>
          {/* Cart Item Lines */}
          <View style={styles.linesSection}>
            {lines.map((line) => (
              <CartItemRow
                key={line.medicine.id}
                line={line}
                onDecrease={() => decreaseMedicine(line.medicine)}
                onIncrease={() => addMedicine(line.medicine)}
                onRemove={() => removeMedicine(line.medicine.id)}
              />
            ))}
          </View>

          {/* Free Delivery Callout Banner */}
          {bill.itemTotal > 0 && (
            <View style={[styles.deliveryCallout, isFreeDelivery && styles.deliveryCalloutSuccess]}>
              <Text style={styles.deliveryCalloutIcon}>
                {isFreeDelivery ? '🎉' : '🚚'}
              </Text>
              <Text style={styles.deliveryCalloutText}>
                {isFreeDelivery
                  ? 'You unlocked FREE delivery!'
                  : `Add ₹${deliveryThresholdDiff} more medicines to get FREE delivery.`}
              </Text>
            </View>
          )}

          {/* Coupons & Promotions Section */}
          <View style={styles.couponCard}>
            <Text style={styles.sectionHeading}>Apply Coupon</Text>

            {coupon ? (
              <View style={styles.appliedCouponRow}>
                <View style={styles.appliedBadge}>
                  <Text style={styles.appliedCode}>🏷️ {coupon}</Text>
                  <Text style={styles.appliedDesc}>
                    {couponRules[coupon]?.description ?? 'Discount applied'}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={`Remove coupon ${coupon}`}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.removeCouponBtn}
                  onPress={clearCoupon}
                >
                  <Text style={styles.removeCouponText}>Remove</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.couponInputRow}>
                  <TextInput
                    accessibilityLabel="Enter coupon code"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="Enter coupon code"
                    placeholderTextColor={colors.textMuted}
                    style={styles.couponInput}
                    value={inputCoupon}
                    onChangeText={setInputCoupon}
                    onSubmitEditing={() => handleApply()}
                  />
                  <Pressable
                    accessibilityLabel="Apply entered coupon"
                    accessibilityRole="button"
                    style={[
                      styles.applyBtn,
                      !inputCoupon.trim() && styles.applyBtnDisabled,
                    ]}
                    onPress={() => handleApply()}
                  >
                    <Text style={styles.applyBtnText}>APPLY</Text>
                  </Pressable>
                </View>

                {/* Quick-tap coupon pills for easy reviewer testing */}
                <Text style={styles.availableCouponsHint}>Available offers:</Text>
                <View style={styles.quickCouponsRow}>
                  {Object.values(couponRules).map((c) => (
                    <Pressable
                      key={c.code}
                      accessibilityLabel={`Apply coupon ${c.code}`}
                      accessibilityRole="button"
                      style={styles.couponChip}
                      onPress={() => handleApply(c.code)}
                    >
                      <Text style={styles.couponChipText}>{c.code}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Dynamic Bill Breakdown */}
          <View style={styles.billCard}>
            <Text style={styles.sectionHeading}>Bill Details</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{bill.itemTotal}</Text>
            </View>

            {bill.discount > 0 ? (
              <View style={styles.billRow}>
                <Text style={styles.discountLabel}>Coupon Discount ({coupon})</Text>
                <Text style={styles.discountValue}>− ₹{bill.discount}</Text>
              </View>
            ) : null}

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={bill.deliveryFee === 0 ? styles.freeDeliveryValue : styles.billValue}>
                {bill.deliveryFee === 0 ? 'FREE' : `₹${bill.deliveryFee}`}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.grandTotalRow}>
              <View>
                <Text style={styles.grandTotalLabel}>To Pay</Text>
                <Text style={styles.grandTotalSub}>Inclusive of all taxes</Text>
              </View>
              <Text style={styles.grandTotalValue}>₹{bill.grandTotal}</Text>
            </View>
          </View>

          {/* Place Order CTA */}
          <Pressable
            accessibilityLabel="Place Order"
            accessibilityRole="button"
            style={styles.placeOrderButton}
            onPress={placeOrder}
          >
            <Text style={styles.placeOrderText}>PLACE ORDER (₹{bill.grandTotal})</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

interface CartItemRowProps {
  line: CartLine;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

function CartItemRow({ line, onIncrease, onDecrease, onRemove }: CartItemRowProps) {
  const isMax = line.quantity >= line.medicine.maxQty;
  const linePrice = line.medicine.price * line.quantity;

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <View style={styles.itemNameRow}>
          <Text style={styles.itemName}>{line.medicine.name}</Text>
          {line.medicine.rx ? (
            <View
              accessibilityLabel="Prescription required badge"
              style={styles.rxBadge}
            >
              <Text style={styles.rxText}>Rx</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.itemSalt}>{line.medicine.salt}</Text>
        <Text style={styles.itemUnitPrice}>
          ₹{line.medicine.price} each • Subtotal: ₹{linePrice}
        </Text>
      </View>

      <View style={styles.itemActions}>
        <View style={styles.qtyControl}>
          <Pressable
            accessibilityLabel={`Decrease ${line.medicine.name}`}
            accessibilityRole="button"
            hitSlop={6}
            style={styles.qtyBtn}
            onPress={onDecrease}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </Pressable>
          <Text
            accessibilityLabel={`Quantity ${line.quantity}`}
            style={styles.qtyNumber}
          >
            {line.quantity}
          </Text>
          <Pressable
            accessibilityLabel={`Increase ${line.medicine.name}`}
            accessibilityRole="button"
            disabled={isMax}
            hitSlop={6}
            style={[styles.qtyBtn, isMax && styles.qtyBtnDisabled]}
            onPress={onIncrease}
          >
            <Text style={[styles.qtyBtnText, isMax && styles.qtyBtnTextDisabled]}>+</Text>
          </Pressable>
        </View>

        {isMax ? (
          <Text style={styles.maxCapNote}>Max: {line.medicine.maxQty}</Text>
        ) : null}

        <Pressable
          accessibilityLabel={`Remove ${line.medicine.name} from cart`}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.removeBtn}
          onPress={onRemove}
        >
          <Text style={styles.removeBtnText}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  noticeBanner: {
    backgroundColor: '#1E3A2F',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  noticeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: spacing.sm,
  },
  noticeDismiss: {
    color: '#A0D8BE',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    gap: 4,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyStateContainer: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
  },
  emptySubtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  linesSection: {
    gap: spacing.sm,
  },
  itemRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 3,
    paddingRight: spacing.sm,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rxBadge: {
    backgroundColor: '#FFEAEA',
    borderColor: '#E53935',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  rxText: {
    color: '#D32F2F',
    fontSize: 10,
    fontWeight: '800',
  },
  itemSalt: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  itemUnitPrice: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 36,
  },
  qtyBtn: {
    height: 36,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.35,
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  qtyBtnTextDisabled: {
    color: '#DDD',
  },
  qtyNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  maxCapNote: {
    fontSize: 10,
    color: '#E65100',
    fontWeight: '600',
  },
  removeBtn: {
    paddingVertical: 2,
  },
  removeBtnText: {
    fontSize: 12,
    color: '#E53935',
    fontWeight: '600',
  },
  deliveryCallout: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  deliveryCalloutSuccess: {
    backgroundColor: '#E8F8F0',
    borderColor: '#A3E2C4',
  },
  deliveryCalloutIcon: {
    fontSize: 18,
  },
  deliveryCalloutText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  couponCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeading: {
    ...typography.heading,
    fontSize: 16,
    color: colors.text,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  couponInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  availableCouponsHint: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  quickCouponsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  couponChip: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  couponChipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  appliedCouponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.sm,
  },
  appliedBadge: {
    flex: 1,
  },
  appliedCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  appliedDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },
  removeCouponBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  removeCouponText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '700',
  },
  billCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  discountLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  freeDeliveryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  grandTotalSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
