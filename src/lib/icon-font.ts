/**
 * Bounded, self-contained retry for icon-font loading.
 *
 * Why this exists: `@expo/vector-icons` v15 loads icon fonts lazily at runtime
 * (`build/IconsLazy.js`), and `expo-font` deletes its in-flight dedupe entry in a
 * `finally` block — so a *failed* load is never remembered. Every subsequent
 * `<Ionicons>` mount therefore starts a fresh download, each one rejecting
 * unhandled. With 200+ icon call sites a single network or cache hiccup turns
 * into an unbounded retry storm that itself keeps the load from succeeding.
 *
 * Preloading through this helper collapses that into one bounded attempt chain:
 * on success `Font.isLoaded()` short-circuits every later call site, and on
 * failure we give up deliberately instead of hammering.
 *
 * Kept free of React Native / Expo imports so it is unit-testable under Node.
 */

export type FontLoader = () => Promise<unknown>;

export type LoadIconFontOptions = {
  /** Total attempts, including the first. Values below 1 are treated as 1. */
  attempts?: number;
  /** Delay before the second attempt; doubles each retry. */
  delayMs?: number;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
  /** Called once per failed attempt. `attempt` is 1-based. */
  onError?: (error: unknown, attempt: number) => void;
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Runs `load` until it resolves or the attempt budget runs out.
 * Resolves `true` when the font loaded, `false` when every attempt failed.
 * Never rejects — the caller decides how to degrade.
 */
export async function loadIconFontWithRetry(
  load: FontLoader,
  options: LoadIconFontOptions = {}
): Promise<boolean> {
  const attempts = Math.max(1, Math.trunc(options.attempts ?? 3));
  const delayMs = Math.max(0, options.delayMs ?? 400);
  const sleep = options.sleep ?? defaultSleep;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await load();
      return true;
    } catch (error) {
      options.onError?.(error, attempt);
      if (attempt < attempts) {
        await sleep(delayMs * 2 ** (attempt - 1));
      }
    }
  }

  return false;
}
