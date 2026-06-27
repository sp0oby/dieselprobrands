"use client";

// Tiny localStorage-backed compare list. Max 4 products.
const KEY = "dpb_compare";
const MAX = 4;

type Listener = (slugs: string[]) => void;
const listeners = new Set<Listener>();

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs));
  } catch {}
  for (const l of listeners) l(slugs);
}

export const compareStore = {
  list: read,
  has(slug: string) { return read().includes(slug); },
  toggle(slug: string) {
    const cur = read();
    if (cur.includes(slug)) write(cur.filter((s) => s !== slug));
    else if (cur.length < MAX) write([...cur, slug]);
    return read();
  },
  remove(slug: string) { write(read().filter((s) => s !== slug)); },
  clear() { write([]); },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  MAX,
};

import { useEffect, useState } from "react";
export function useCompareList(): string[] {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    setSlugs(compareStore.list());
    const unsub = compareStore.subscribe(setSlugs);
    return () => { unsub(); };
  }, []);
  return slugs;
}
