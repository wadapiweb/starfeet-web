"use client";

const CART_SESSION_KEY = "starfeet_cart_session";

export type CartSession = {
  cartId: string;
  customerEmail: string;
};

function readStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getStoredCartSession(): CartSession | null {
  const storage = readStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(CART_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CartSession>;
    if (!parsed?.cartId || !parsed?.customerEmail) return null;
    return {
      cartId: String(parsed.cartId),
      customerEmail: String(parsed.customerEmail).toLowerCase().trim(),
    };
  } catch {
    return null;
  }
}

export function saveCartSession(session: CartSession) {
  const storage = readStorage();
  if (!storage) return;

  storage.setItem(
    CART_SESSION_KEY,
    JSON.stringify({
      cartId: session.cartId,
      customerEmail: session.customerEmail.toLowerCase().trim(),
    }),
  );
}

export function clearCartSession() {
  const storage = readStorage();
  if (!storage) return;
  storage.removeItem(CART_SESSION_KEY);
}
