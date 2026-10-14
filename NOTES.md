# Plazza Take-Home — Project Notes

## 1. Assumptions

- **Platform & Environment**: Target Android 13+ (API 33). Tested directly on a physical Android device via Expo Go and built as a standalone debug APK (`android/app/build/outputs/apk/debug/app-debug.apk`).
- **Catalog**: All 15 medicines from the brief are loaded locally from `src/data/catalog/catalog.json`. Prices are in integer rupees, quantities are capped at `maxQty`, and prescription drugs (`rx: true`) display an Rx badge.
- **Delivery Fee Logic**:
  - `itemTotal < 499`: ₹40 delivery fee.
  - `itemTotal >= 499`: ₹0 (Free delivery).
  - Empty cart (`itemTotal === 0`): ₹0 delivery fee.
  - `FREEDEL` coupon waives delivery fee even under ₹499.
- **Coupons**:
  - Only one coupon active at a time.
  - `FLAT50`: ₹50 off when `itemTotal >= 300`.
  - `SAVE10`: 10% off cart total, maximum discount capped at ₹100.
  - `FREEDEL`: Free delivery fee.
  - `FIRST100`: ₹100 off when `itemTotal >= 200`, usable only once per user. It is only recorded as used when "Place Order" is clicked.
  - Discount is strictly capped at `itemTotal`.
  - If cart changes drop the total below a coupon's eligibility, the coupon is auto-removed and a clear toast notice is displayed.
- **Permissions**:
  - Location (foreground) and Notification permissions are requested on first launch.
  - Handled all three states: `granted`, `denied`, and `blocked`.
  - If blocked, provides a direct button to Android App Settings via `Linking.openSettings()`.
  - An `AppState` listener re-checks permissions when returning from Settings to update the UI automatically.

---

## 2. Key Design Decisions & Implementation

### Where Logic Lives
- **Pure Domain (`src/domain/`)**: Pure TypeScript functions handle all calculations (`billing.ts`, `coupons.ts`, `cartQuantity.ts`, `searchCatalog.ts`). No React or platform dependencies here, which allowed writing clean, isolated Jest unit tests for all requirements.
- **Pluggable Coupon Engine (`src/domain/coupons/coupons.ts`)**: Built a simple registry pattern (`couponRules` and `registerCoupon`). Adding a new promotional coupon (e.g. in a live coding interview) requires only registering a rule object with its condition and discount calculation, without having to touch cart state or billing code.
- **Shared Cart State (`src/app/providers/CartProvider.tsx`)**: The original boilerplate had separate placeholders on Home and Cart. I consolidated shared state into a single `CartProvider` at the root (`AppRoot.tsx`). This synchronizes item quantities, badge count in the tab bar, active coupons, and toast messages across screens.
- **Versioned Persistence (`src/storage/storage.ts`)**: Stored data is wrapped in `{ version: 1, data: ... }` with a validation guard (`isCartItem`). If AsyncStorage data is missing or corrupted, the app falls back to empty arrays without crashing.

---

## 3. Real-World Issues & Fixes During Testing

1. **Android Location Fix Delay**:
   - Calling `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })` was taking too long or hanging on a physical Android device indoors waiting for satellite GPS fix, staying on "Locating...".
   - **Fix**: Added `Location.getLastKnownPositionAsync()` first for instant retrieval, dropped accuracy to `Accuracy.Lowest` with a 3s timeout race, and provided fallback coordinates so the user is never stuck waiting.
2. **Recent Searches Keystroke Spam**:
   - Initial search input was writing every intermediate keystroke ("Adv", "Adva", "Advan", "Advance") into recent searches, overflowing the 5-item limit with fragments.
   - **Fix**: Decoupled the keystroke from storage. Recent searches are now saved only after the user stops typing (600ms debounce) or on keyboard submit. Added prefix pruning so partial fragments get cleanly replaced by full terms.
3. **Cart & Tab Badge**:
   - Added live badge counter on the Cart bottom tab so users can see active item counts from anywhere in the app.

---

## 4. What I Would Do Differently With More Time

- **Micro-Animations**: Add layout springs (`react-native-reanimated`) when items are added to cart or quantity increments.
- **Mock Prescription Upload**: Add an image picker modal when checking out with `rx: true` items.
- **Storage Write Batching**: Throttle rapid AsyncStorage writes if a user taps `+` / `-` multiple times in quick succession.
- **Search Highlighting**: Highlight matching query substrings in medicine names and salts.

---

## 5. Notes on AI Usage

- **Initial Setup**: Used Codex to set up the Expo project structure. However, the generated boilerplate had disconnected providers, disabled inputs (`editable={false}`), and static placeholders.
- **AI as Pair Programmer**: Used AI to quickly scaffold test suites for coupon math, review edge cases for the ₹499 delivery fee threshold, and debug Gradle build setup.
- **What was rejected/rewritten**:
  - Rejected inline `setState` calls in `useEffect` that violated React compiler rules.
  - Rejected hardcoded `switch` statements for coupons, replacing them with a pluggable registry.
  - Rewrote the recent search handler to prevent intermediate keystrokes from spamming storage.
  - Replaced naive `JSON.parse` with a versioned envelope and schema validation.

---

## 6. How to Run & Verify

```bash
# 1. Run unit tests (34 tests across 5 suites)
npm test

# 2. Typecheck
npx tsc --noEmit

# 3. Lint
npm run lint

# 4. Start Expo dev server
npx expo start

# 5. Build Android Debug APK
cd android && ./gradlew assembleDebug
```
