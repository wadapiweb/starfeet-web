export const CART_TTL_MS = 2 * 60 * 60 * 1000;

export function cartExpirationFrom(base: Date): Date {
  return new Date(base.getTime() + CART_TTL_MS);
}

export function isCartExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
