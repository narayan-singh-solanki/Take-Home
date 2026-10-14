import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCart } from '../../../app/providers/CartProvider';
import { InfoCard } from '../../../components/ui/InfoCard';
import { Screen } from '../../../components/ui/Screen';
import { catalog } from '../../../data/catalog/catalog';
import { searchCatalog } from '../../../domain/catalog/searchCatalog';
import { useAppPermissions } from '../../../permissions/useAppPermissions';
import { storage } from '../../../storage/storage';
import { colors, spacing, typography } from '../../../theme';
import type { Medicine } from '../../../types/models';

export function HomeScreen() {
  const { cartItems, addMedicine, decreaseMedicine, notice, clearNotice } = useCart();
  const { location, notifications, coordinates, openSettings, requestPermissions, refresh } = useAppPermissions();


  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load persistent recent searches on mount
  useEffect(() => {
    let active = true;
    void storage.getRecentSearches().then((saved) => {
      if (!active) return;
      // Prune any legacy typing fragments so only complete words remain
      const cleaned = saved.filter(
        (item, idx) =>
          !saved.some(
            (other, otherIdx) =>
              otherIdx !== idx &&
              other.length > item.length &&
              other.toLowerCase().startsWith(item.toLowerCase()),
          ),
      );
      setRecentSearches(cleaned);
      if (cleaned.length !== saved.length) {
        void storage.setRecentSearches(cleaned);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Save query to recent searches (deduped, fragments replaced)
  const recordRecentSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (trimmed.length < 3) return;
      setRecentSearches((prev) => {
        // Remove identical items or prefixes of the current term
        const filtered = prev.filter(
          (item) =>
            item.toLowerCase() !== trimmed.toLowerCase() &&
            !trimmed.toLowerCase().startsWith(item.toLowerCase()),
        );
        const updated = [trimmed, ...filtered].slice(0, 5);
        void storage.setRecentSearches(updated);
        return updated;
      });
    },
    [],
  );

  // Debounce search query & record recent search only when user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      const trimmed = query.trim();
      if (trimmed.length >= 3) {
        recordRecentSearch(trimmed);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [query, recordRecentSearch]);

  const isSearching = query !== debouncedQuery;



  const handleSelectRecentSearch = useCallback(
    (term: string) => {
      setQuery(term);
      recordRecentSearch(term);
    },
    [recordRecentSearch],
  );

  const handleClearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    void storage.setRecentSearches([]);
  }, []);

  // Compute search results
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return searchCatalog(catalog, debouncedQuery);
  }, [debouncedQuery]);

  // Quick lookup of quantities in cart
  const cartQuantities = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach((item) => map.set(item.medicineId, item.quantity));
    return map;
  }, [cartItems]);

  const anyPermissionBlocked = location.blocked || notifications.blocked;

  return (
    <Screen>
      {/* Toast Notice Banner */}
      {notice ? (
        <View style={styles.noticeBanner} accessibilityRole="alert">
          <Text style={styles.noticeText}>{notice}</Text>
          <Pressable
            accessibilityLabel="Dismiss notice"
            accessibilityRole="button"
            hitSlop={8}
            onPress={clearNotice}
          >
            <Text style={styles.noticeDismiss}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Delivery Header / Location Coordinates */}
      <Pressable
        accessibilityLabel="Current delivery location, tap to refresh"
        accessibilityRole="button"
        hitSlop={8}
        style={styles.deliveryContainer}
        onPress={() => void refresh()}
      >
        <Text style={styles.deliveryLabel}>Delivering to:</Text>
        <Text style={styles.deliveryValue}>
          {coordinates ?? (location.status === 'granted' ? 'Fetching location...' : 'Permission needed')}
        </Text>
        {location.status === 'granted' ? (
          <Text style={styles.refreshIcon}> 🔄</Text>
        ) : null}
      </Pressable>


      {/* Permissions Debug Banner */}
      <View style={styles.permissionBanner}>
        <View style={styles.permissionHeader}>
          <Text style={styles.permissionBannerTitle}>Device Permissions</Text>
          <View style={styles.permissionTagsRow}>
            <View
              style={[
                styles.permissionPill,
                location.status === 'granted'
                  ? styles.pillGranted
                  : location.status === 'blocked'
                  ? styles.pillBlocked
                  : styles.pillDenied,
              ]}
            >
              <Text style={styles.pillText}>Location: {location.status}</Text>
            </View>
            <View
              style={[
                styles.permissionPill,
                notifications.status === 'granted'
                  ? styles.pillGranted
                  : notifications.status === 'blocked'
                  ? styles.pillBlocked
                  : styles.pillDenied,
              ]}
            >
              <Text style={styles.pillText}>Notif: {notifications.status}</Text>
            </View>
          </View>
        </View>

        {anyPermissionBlocked ? (
          <View style={styles.blockedRationale}>
            <Text style={styles.blockedRationaleText}>
              Permissions are blocked in system settings. Enable location for delivery tracking.
            </Text>
            <Pressable
              accessibilityLabel="Open Android App Settings"
              accessibilityRole="button"
              style={styles.settingsButton}
              onPress={openSettings}
            >
              <Text style={styles.settingsButtonText}>Open OS Settings</Text>
            </Pressable>
          </View>
        ) : location.status === 'denied' || notifications.status === 'denied' ? (
          <Pressable
            accessibilityLabel="Request permissions again"
            accessibilityRole="button"
            style={styles.retryPermButton}
            onPress={requestPermissions}
          >
            <Text style={styles.retryPermButtonText}>Grant Permissions</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <Text style={styles.title}>Find your medicines</Text>
        <Text style={styles.description}>Search local catalog by brand name or chemical salt.</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            accessibilityLabel="Search medicines by name or salt"
            accessibilityRole="search"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            editable={true}
            placeholder="e.g. Dolo 650, Paracetamol, Cetrizine"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => recordRecentSearch(query)}

          />
          {query.length > 0 ? (
            <Pressable
              accessibilityLabel="Clear search text"
              accessibilityRole="button"
              hitSlop={10}
              style={styles.clearSearchButton}
              onPress={() => setQuery('')}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Recent Searches */}
      {recentSearches.length > 0 && !query ? (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionSubtitle}>Recent searches</Text>
            <Pressable
              accessibilityLabel="Clear all recent searches"
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleClearRecentSearches}
            >
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>
          <View style={styles.recentTags}>
            {recentSearches.map((term) => (
              <Pressable
                key={term}
                accessibilityLabel={`Recent search for ${term}`}
                accessibilityRole="button"
                style={styles.recentTag}
                onPress={() => handleSelectRecentSearch(term)}
              >
                <Text style={styles.recentTagText}>🔍 {term}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* Search Results / Content Area */}
      {isSearching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.loadingText}>Searching medicines...</Text>
        </View>
      ) : query.trim() ? (
        searchResults.length === 0 ? (
          <InfoCard>
            <Text style={styles.emptyTitle}>No medicines found</Text>
            <Text style={styles.emptySubtitle}>
              {`We couldn't find any medicine or salt matching "${query}". Try searching by generic name like Paracetamol or Pantoprazole.`}
            </Text>

          </InfoCard>
        ) : (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsCount}>
              {searchResults.length} medicine{searchResults.length > 1 ? 's' : ''} found
            </Text>
            {searchResults.map((medicine) => (
              <MedicineCard
                key={medicine.id}
                inCartQty={cartQuantities.get(medicine.id) ?? 0}
                medicine={medicine}
                onAdd={() => {
                  recordRecentSearch(query);
                  addMedicine(medicine);
                }}
                onDecrease={() => decreaseMedicine(medicine)}
              />
            ))}
          </View>
        )
      ) : (
        /* Default Empty Query State: Catalog Overview */
        <View style={styles.catalogOverview}>
          <Text style={styles.sectionSubtitle}>All Medicines ({catalog.length})</Text>
          <Text style={styles.catalogNote}>Showing all local medicines ready for express delivery.</Text>
          <View style={styles.resultsContainer}>
            {catalog.map((medicine) => (
              <MedicineCard
                key={medicine.id}
                inCartQty={cartQuantities.get(medicine.id) ?? 0}
                medicine={medicine}
                onAdd={() => addMedicine(medicine)}
                onDecrease={() => decreaseMedicine(medicine)}
              />
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

interface MedicineCardProps {
  medicine: Medicine;
  inCartQty: number;
  onAdd: () => void;
  onDecrease: () => void;
}

function MedicineCard({ medicine, inCartQty, onAdd, onDecrease }: MedicineCardProps) {
  const isMax = inCartQty >= medicine.maxQty;

  return (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName}>{medicine.name}</Text>
          {medicine.rx ? (
            <View
              accessibilityLabel="Prescription required badge"
              style={styles.rxBadge}
            >
              <Text style={styles.rxText}>Rx</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cardSalt}>{medicine.salt}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.cardPrice}>₹{medicine.price}</Text>
          <Text style={styles.cardMaxQty}>Max: {medicine.maxQty}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {inCartQty === 0 ? (
          <Pressable
            accessibilityLabel={`Add ${medicine.name} to cart`}
            accessibilityRole="button"
            style={styles.addButton}
            onPress={onAdd}
          >
            <Text style={styles.addButtonText}>+ ADD</Text>
          </Pressable>
        ) : (
          <View style={styles.qtyControl}>
            <Pressable
              accessibilityLabel={`Decrease quantity for ${medicine.name}`}
              accessibilityRole="button"
              hitSlop={6}
              style={styles.qtyBtn}
              onPress={onDecrease}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Text
              accessibilityLabel={`Quantity ${inCartQty}`}
              style={styles.qtyNumber}
            >
              {inCartQty}
            </Text>
            <Pressable
              accessibilityLabel={`Increase quantity for ${medicine.name}`}
              accessibilityRole="button"
              disabled={isMax}
              hitSlop={6}
              style={[styles.qtyBtn, isMax && styles.qtyBtnDisabled]}
              onPress={onAdd}
            >
              <Text style={[styles.qtyBtnText, isMax && styles.qtyBtnTextDisabled]}>+</Text>
            </Pressable>
          </View>
        )}
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
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  deliveryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  deliveryValue: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  refreshIcon: {
    fontSize: 12,
    marginLeft: 4,
  },

  permissionBanner: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  permissionBannerTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  permissionTagsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  permissionPill: {
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pillGranted: {
    backgroundColor: '#E8F5E9',
  },
  pillDenied: {
    backgroundColor: '#FFF8E1',
  },
  pillBlocked: {
    backgroundColor: '#FFEBEE',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  blockedRationale: {
    backgroundColor: '#FFFAFA',
    borderColor: '#FFCDD2',
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  blockedRationaleText: {
    fontSize: 12,
    color: '#C62828',
    lineHeight: 16,
  },
  settingsButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#C62828',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  retryPermButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  retryPermButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  searchSection: {
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1.5,
    color: colors.text,
    fontSize: 16,
    minHeight: 50,
    paddingLeft: spacing.md,
    paddingRight: 40,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    height: 30,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  recentSection: {
    gap: spacing.xs,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionSubtitle: {
    ...typography.heading,
    fontSize: 16,
    color: colors.text,
  },
  clearText: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  recentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  recentTag: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  recentTagText: {
    fontSize: 13,
    color: colors.text,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  catalogOverview: {
    gap: spacing.xs,
  },
  catalogNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  resultsContainer: {
    gap: spacing.sm,
  },
  resultsCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
    paddingRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardName: {
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
  cardSalt: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  cardMaxQty: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: 38,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 38,
  },
  qtyBtn: {
    height: 38,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  qtyBtnTextDisabled: {
    color: '#E0E0E0',
  },
  qtyNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
});
