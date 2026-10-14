# Plazza take-home starter

## Architecture

The app uses a small feature-oriented layout: `app` composes navigation, `features` owns screens, `components/ui` holds shared presentation elements, and `domain` holds pure rules. `data`, `storage`, `theme`, and `types` support those layers. Empty folders are intentionally omitted until useful.

State is intentionally local for now. This keeps the assignment easy to follow and avoids a state-management dependency before cross-screen cart behavior is needed. Derived bill totals should remain calculated from cart and catalog source data.

## Persistence and catalog

`src/storage/storage.ts` is a typed AsyncStorage boundary for cart source state, recent searches, and FIRST100 usage. It returns fallbacks for missing or malformed JSON. Prices are integer rupees. No `catalog.json` was supplied, so `src/data/catalog/catalog.ts` is deliberately empty and ready to import the real fixture when it arrives.

## Commands

```sh
npm start
npm run android
npm test
npx tsc --noEmit
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug
```

Expo's current Android baseline is API 35, meeting the API 33 minimum. Prebuild generates native Android files only when an APK is required.

## Deferred work

- Catalog search and recent-search UI
- Cart integration, coupon engine, and bill calculations
- Location and notification permission lifecycle
- Accessibility pass and visual polish
