import { useSyncExternalStore } from 'react';

const subscribeNever = () => () => {};
const getTrue = () => true;
const getFalse = () => false;
const getToday = () => new Date().toDateString();
const getNull = () => null;

// false on the server and while hydrating the pre-rendered page, true right after: data cached in
// localStorage then appears without a hydration mismatch (the pre-rendered markup shows skeletons).
export function useHydrated() {
  return useSyncExternalStore(subscribeNever, getTrue, getFalse);
}

// Today's date (Date#toDateString) on the client, null on the server. Stable for the whole day.
export function useToday() {
  return useSyncExternalStore(subscribeNever, getToday, getNull);
}
