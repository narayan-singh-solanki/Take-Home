# Plazza Frontend Take-Home — Project Notes

## 1. Assumptions

- **Target Platform**: Android (API 33+). The app runs in Expo Go for rapid interactive verification and compiles via continuous native generation / Gradle into an installable debug APK (`android/app/build/outputs/apk/debug/app-debug.apk`).
- **Catalog as Source of Truth**: All 15 medicines (`m1` to `m15`) are loaded locally from `src/data/catalog/catalog.json`. Prices are integer rupees; `maxQty` is enforced across all operations; medicines with `rx: true` display a red `Rx` badge without requiring prescription upload.
- **Delivery Fee Boundary**: Delivery is ₹40 when the Item Total is strictly less than ₹499 (`itemTotal < 499`). At ₹499 and above, delivery is ₹0 (`FREE`). If the cart is empty (`itemTotal === 0`), the delivery fee is ₹0.
- **Coupon Constraints**:
  - Only one coupon can be active at a time.
  - Applying a coupon validates immediately against current `itemTotal` and historical use.
  - `FLAT50`: ₹50 off for `itemTotal >= 300`.
  - `SAVE10`: 10% discount, strictly capped at ₹100.
  - `FREEDEL`: Waives the delivery fee entirely.
  - `FIRST100`: ₹100 off for `itemTotal >= 200`, usable only once per user. Recorded as consumed only upon clicking "Place Order".
  - Total discount is capped at `itemTotal` (grand total before delivery never drops below ₹0).
  - If a cart reduction invalidates an active coupon, the coupon is auto-removed and an explanatory toast notice is presented.
- **Permissions**:
  - Foreground location and notification permissions are requested on first launch via Expo modules (`expo-location`, `expo-notifications`).
  - Handles `granted`, `denied`, and permanently `blocked` states.
  - When blocked, a rationale and "Open OS Settings" button deep-links to Android system settings via `Linking.openSettings()`.
  - AppState listener automatically refreshes permission status when returning to the app.
  - When location is granted, coordinates (`<lat, lng>`) are displayed in the header banner; no external reverse-geocoding is performed.

---

## 2. Key Design Decisions & Trade-Offs

### A. Separation of Concerns & Clean Layering
- **Pure Domain (`src/domain/`)**: All business rules—`searchCatalog`, `billing`, `cartQuantity`, and `coupons`—are written as pure functions independent of React, React Native, and AsyncStorage. This made them 100% testable with Jest.
- **Pluggable Coupon Engine (`src/domain/coupons/coupons.ts`)**: Implemented a Strategy / Registry pattern (`registerCoupon`). Adding a new promotional rule (e.g., during the live extension interview) touches only `coupons.ts` or calls `registerCoupon` without modifying cart state, billing calculations, or UI screens.
- **Shared Cart State (`src/app/providers/CartProvider.tsx`)**: Centralized shared cart state in a lightweight React Context provider mounted at `AppRoot.tsx`. Both `HomeScreen` and `CartScreen` access identical cart items, quantities, bill breakdown, and notices, eliminating state synchronization bugs.
- **Robust Versioned Persistence (`src/storage/storage.ts`)**:
  - Stored payloads are wrapped in a versioned envelope (`{ version: 1, data: ... }`).
  - Strict type guards (`isCartItem`) validate shapes on load. Corrupted or invalid JSON automatically falls back to empty defaults without crashing the app.
  - Recent searches are stored in AsyncStorage, capped at 5 unique queries, and available immediately upon relaunch.

---

## 3. What I Would Do Differently With More Time

1. **Animated Micro-Interactions**: Add subtle spring animations using `react-native-reanimated` when items are added to cart, when the cart badge updates, or when toast notices appear and dismiss.
2. **Prescription Upload Workflow**: Build a mock camera/file picker flow for `rx: true` medicines before allowing checkout.
3. **Optimistic Debounced Storage**: Add batching/debouncing to AsyncStorage writes during rapid `+` / `-` tapping.
4. **Search Highlighting**: Highlight matching substrings in medicine names and salts in the search results list.
5. **E2E Tests**: Add Maestro or Detox end-to-end tests covering permission prompts and complete checkout flow on Android emulators.

---

## 4. AI Collaboration — Prompting, Review & Ownership

- **What was prompted for**:
  - Initial directory inspection and locating `catalog.json` without destructive modifications.
  - Pure domain rules and test suites for billing, delivery thresholds, and coupon calculations.
  - Resolving boilerplate React Hook linting errors (`set-state-in-effect`) and TypeScript type-safety constraints.
- **What was rejected or rewritten**:
  - **Codex Boilerplate Limitations**: The initial boilerplate had disconnected providers, disabled inputs (`editable={false}`), hardcoded placeholder cards, and static text. All placeholder screens were rewritten into production-grade functional components.
  - **Hardcoded Coupon Enums**: Rejected hardcoded `switch` / `if` statements in `CartProvider` in favor of a pluggable Coupon Strategy Registry (`couponRules`), ensuring that new coupons can be registered dynamically.
  - **Unsafe AsyncStorage parsing**: Replaced naive `JSON.parse` with versioned envelopes and runtime schema guards (`isCartItem`, `Array.isArray`) to fulfill the robust persistence bonus requirement.
  - **Unbounded Search History**: Rewrote recent searches to enforce a maximum of 5 distinct searches with deduplication.

---

## 5. Verification & Test Commands

All business rules, edge cases, and storage defenses are verified by automated tests:

```bash
# Run unit tests (34 tests across 5 test suites)
npm test

# Run TypeScript type check
npx tsc --noEmit

# Run ESLint
npm run lint

# Build Android Debug APK
cd android && ./gradlew assembleDebug
```

### Test Suite Summary:
- `tests/billing.test.ts`: Delivery fee cutoff (< ₹499 vs >= ₹499 vs ₹0 cart), safe discount bounds.
- `tests/coupons.test.ts`: All 4 coupons (`FLAT50`, `SAVE10` cap at ₹100, `FREEDEL`, `FIRST100` one-time use), auto-removal on cart changes, and pluggable custom rule registration.
- `tests/cartQuantity.test.ts`: Strict `maxQty` enforcement, non-finite input guards.
- `tests/storage.test.ts`: Versioned envelope serialization, corrupt JSON defense, recent search cap.
- `tests/searchCatalog.test.ts`: Case-insensitive search across brand name and chemical salt.
