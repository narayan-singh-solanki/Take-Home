# Plazza — React Native Pharmacy Mobile App

A high-fidelity mobile application slice built for the Plazza Frontend Take-Home assignment using React Native, Expo (SDK 57), and TypeScript. Target platform: Android 13+ (API 33+).

---

## Features

### 1. Native Capabilities & Permissions
- **Android Lifecycle**: Requests foreground location and notification permissions on first launch, supporting `granted`, `denied`, and permanently `blocked` states.
- **Deep-linking to OS Settings**: When permissions are blocked, displays a clear rationale card with a direct button that links to Android App Settings via `Linking.openSettings()`.
- **Automatic State Refresh**: Listens to `AppState` to refresh permission statuses immediately when the user returns from system settings.
- **Real-Time Precise Location**: Uses `Location.watchPositionAsync` with `Location.Accuracy.High` to stream live GPS updates formatted to 4-decimal precision (`Delivering to: <lat,lng>`), with manual tap-to-refresh.

### 2. Medicine Search (Home Tab)
- **Local Catalog**: Loaded from `src/data/catalog/catalog.json` with all 15 medicines (m1–m15), prices in integer rupees, `maxQty`, and `rx` flags.
- **Case-Insensitive Search**: Queries both brand names (e.g. *Dolo 650*, *Crocin*) and chemical salts (e.g. *Paracetamol*, *Azithromycin*).
- **Explicit States**: Handles initial/empty query, debounced search loading, no-results state with suggestions, and live search results.
- **Debounced Recent Searches**: Retains a maximum of 5 recent searches across app restarts. Only records queries once the user stops typing (600ms debounce) or on keyboard submit, automatically pruning keystroke fragments.
- **Inline Cart Controls**: Add to Cart button converts into an active quantity stepper (`- qty +`) bounded strictly by `maxQty`.

### 3. Cart & Dynamic Billing (Cart Tab)
- **Cart Management**: Add, increment, decrement, and remove items with real-time `maxQty` enforcement.
- **Persistent State**: Persists cart items and one-time coupon usage across restarts using versioned AsyncStorage payloads with schema corruption defense.
- **Tab Bar Counter**: Real-time badge counter on the Cart tab reflecting total items.
- **Dynamic Bill Breakdown**:
  - **Item Total**: Sum of price × quantity.
  - **Delivery Fee**: Flat ₹40 if Item Total is strictly below ₹499; ₹0 (FREE) at ₹499 and above or when cart is empty.
  - **Free Delivery Callout**: Dynamically prompts users how much to add to unlock free delivery.
  - **Coupon Discount**: Displays savings with coupon name. Total discount is strictly bounded so grand total never goes below ₹0.
  - **Grand Total**: Final payable amount inclusive of taxes.
- **Place Order**: Clears active cart, records one-time coupon as consumed, and triggers order confirmation toast.

### 4. Pluggable Coupon Engine
- **Core Coupons**:
  - `FLAT50`: ₹50 off on orders of ₹300 or more.
  - `SAVE10`: 10% discount on cart total, capped at ₹100 maximum.
  - `FREEDEL`: Waives delivery fee entirely.
  - `FIRST100`: ₹100 off on first order of ₹200 or more (usable once per user; marked consumed upon placing order).
- **Auto-Removal on Invalidation**: If cart items are removed and the total drops below a coupon's requirements, the coupon is automatically removed and a toast banner explains why.
- **Pluggable Architecture**: Built on a Strategy Registry (`registerCoupon`). New coupon types can be added on the spot during a live extension exercise without touching cart or billing code.

---

## Project Structure

```
├── App.tsx                     # Entry point
├── app.json                    # Expo config & Android permissions
├── NOTES.md                    # Architecture, trade-offs, and candidate notes
├── android/                    # Prebuilt native Android project
│   └── app/build/outputs/apk/  # Built debug APK
├── src/
│   ├── app/
│   │   ├── AppRoot.tsx         # Navigation & global CartProvider mount
│   │   └── providers/          # CartProvider & shared state
│   ├── components/ui/          # Screen, InfoCard, and shared UI primitives
│   ├── data/catalog/           # catalog.json (15 medicines) & accessor
│   ├── domain/                 # Pure domain business logic (100% unit-tested)
│   │   ├── billing/            # Item totals, delivery fee, grand total
│   │   ├── cart/               # maxQty capping & quantity bounds
│   │   ├── catalog/            # Case-insensitive medicine & salt search
│   │   └── coupons/            # Pluggable coupon engine & rules
│   ├── features/
│   │   ├── home/screens/       # HomeScreen (search, recent searches, location)
│   │   └── cart/screens/       # CartScreen (items, bill, coupons, checkout)
│   ├── navigation/             # AppTabs bottom navigator with custom vector icons
│   ├── permissions/            # useAppPermissions hook (Location & Notifications)
│   ├── storage/                # Versioned AsyncStorage wrapper
│   ├── theme/                  # Color palette, spacing, typography tokens
│   └── types/                  # Shared TypeScript interfaces & types
└── tests/                      # Automated Jest test suites
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Android device with Expo Go, Android Emulator, or Android Studio for APK installation

### Installation

```bash
# Install dependencies
npm install
```

### Running the App

```bash
# Start Expo development server (scan QR code in Expo Go on Android)
npx expo start
```

### Running Automated Tests & Quality Checks

```bash
# Run unit tests (34 tests across 5 suites)
npm test

# Run TypeScript typecheck
npx tsc --noEmit

# Run ESLint
npm run lint
```

### Building the Debug APK

```bash
# Assemble standalone Android Debug APK
cd android && ./gradlew assembleDebug
```
The output APK is generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## Deliverables Checklist

- [x] **Working App**: Runs smoothly on Android via Expo Go and standalone native build.
- [x] **Debug APK**: Prebuilt APK ready at `android/app/build/outputs/apk/debug/app-debug.apk`.
- [x] **Automated Tests**: 34 unit tests covering delivery thresholds, all 4 coupons, the SAVE10 cap, FIRST100 one-time use, auto-removal, maxQty capping, and versioned storage.
- [x] **NOTES.md**: Complete documentation of assumptions, architecture, real-world Android debugging, and honest AI collaboration reflections.

