import type { Location } from '@/src/types';

let pending: Location | null = null;

export function setPendingTripLocation(loc: Location) {
  pending = loc;
}

export function consumePendingTripLocation(): Location | null {
  const v = pending;
  pending = null;
  return v;
}
