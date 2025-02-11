import randomUserAgent from "random-useragent";

/**
 * Returns a random user agent string.
 */
export function getRandomUserAgent(): string {
  return randomUserAgent.getRandom();
}

/**
 * Generates a random alphanumeric string.
 * @param length - The length of the string
 * @returns A random string
 */
export function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
}
