/**
 * Pay to Exit.
 *
 * This sells a digital benefit, so both stores require their own in-app
 * purchase rails — Stripe or PayPal here would fail review. The real
 * implementation is a *consumable* IAP through react-native-iap or
 * expo-in-app-purchases, which needs a development build (it cannot run in Expo
 * Go) plus a configured product in App Store Connect and Play Console.
 *
 * Until the client has developer accounts and a price, this stands in for it and
 * always succeeds. The call site already treats it as async and failable, so
 * swapping the body out is the whole job.
 */
export async function purchaseExitToll() {
  await new Promise((resolve) => setTimeout(resolve, 450));
  return { ok: true };
}
