export const CART_TTL_MINUTES = 120;
export const CART_TTL_MS = CART_TTL_MINUTES * 60 * 1000;

export function cartExpirationFrom(base: Date, ttlMinutes = CART_TTL_MINUTES): Date {
  return new Date(base.getTime() + ttlMinutes * 60 * 1000);
}

export function isCartExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
