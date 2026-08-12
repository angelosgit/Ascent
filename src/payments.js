import { Platform } from 'react-native';

/**
 * Pay to Exit.
 *
 * A consumable purchase: it can be bought again every time a climb is
 * interrupted, so the transaction is finished as consumable and the store is
 * free to sell it again.
 *
 * The native module is absent in Expo Go, so it is required lazily and the
 * whole feature degrades to unavailable rather than crashing the app.
 */

export const EXIT_TOLL_SKU = 'com.theascent.app.exit_toll';

export const PURCHASE = {
  OK: 'ok',
  CANCELLED: 'cancelled',
  UNAVAILABLE: 'unavailable',
  FAILED: 'failed',
};

let iap = null;
let connected = null;

function load() {
  if (iap !== null) return iap;
  try {
    // eslint-disable-next-line global-require
    iap = require('expo-iap');
  } catch {
    iap = false;
  }
  return iap;
}

export const isAvailable = () => Boolean(load());

async function connect() {
  const module = load();
  if (!module) return false;
  connected = connected ?? module.initConnection().catch(() => false);
  return (await connected) !== false;
}

/**
 * The store's own localised price string, e.g. "$0.99" or "0,99 €".
 * Apple rejects apps that hard-code a price, so this is what the Toll shows.
 */
export async function fetchTollPrice() {
  const module = load();
  if (!module || !(await connect())) return null;

  try {
    const products = await module.fetchProducts({ skus: [EXIT_TOLL_SKU], type: 'in-app' });
    const product = (products ?? []).find((item) => item.id === EXIT_TOLL_SKU) ?? products?.[0];
    return product?.displayPrice ?? null;
  } catch {
    return null;
  }
}

/**
 * Runs the purchase and resolves once the store confirms it.
 *
 * expo-iap reports the outcome through listeners rather than the call's return
 * value, so those are bridged into a promise here and always torn down.
 */
export async function purchaseExitToll() {
  const module = load();
  if (!module) return { status: PURCHASE.UNAVAILABLE };
  if (!(await connect())) return { status: PURCHASE.UNAVAILABLE };

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      updated.remove();
      failed.remove();
      resolve(result);
    };

    const updated = module.purchaseUpdatedListener(async (purchase) => {
      try {
        await module.finishTransaction({ purchase, isConsumable: true });
        finish({ status: PURCHASE.OK });
      } catch {
        finish({ status: PURCHASE.FAILED });
      }
    });

    const failed = module.purchaseErrorListener((error) => {
      finish({
        status: error?.code === 'user-cancelled' ? PURCHASE.CANCELLED : PURCHASE.FAILED,
        message: error?.message,
      });
    });

    module
      .requestPurchase({
        type: 'in-app',
        request: Platform.select({
          ios: { apple: { sku: EXIT_TOLL_SKU } },
          android: { google: { skus: [EXIT_TOLL_SKU] } },
          default: { apple: { sku: EXIT_TOLL_SKU } },
        }),
      })
      .catch(() => finish({ status: PURCHASE.FAILED }));
  });
}
