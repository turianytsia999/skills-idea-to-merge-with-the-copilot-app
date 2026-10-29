export interface Bookmark {
  url: string;
  slug: string;
}

export const STORAGE_KEY = 'mona-bookmarks';
export const SEPARATOR = ' :: ';

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/** Normalises user input to a canonical http(s) URL, or returns null if invalid. */
export function normalizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const candidate = SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  if (!parsed.hostname) return null;
  const href = parsed.href;
  return parsed.pathname === '/' && !parsed.search && !parsed.hash
    ? href.replace(/\/$/, '')
    : href;
}

/** Generates "mona-" plus 4 base62 characters. `random` returns [0, 1). */
export function generateSlug(random: () => number = Math.random): string {
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += BASE62[Math.floor(random() * BASE62.length) % BASE62.length];
  }
  return `mona-${id}`;
}

/** Generates a slug not already used in `existing`. */
export function uniqueSlug(existing: Bookmark[], random: () => number = Math.random): string {
  const used = new Set(existing.map((b) => b.slug));
  for (let i = 0; i < 100; i++) {
    const slug = generateSlug(random);
    if (!used.has(slug)) return slug;
  }
  return `${generateSlug(random)}${Date.now().toString(36)}`;
}

function isBookmark(value: unknown): value is Bookmark {
  if (typeof value !== 'object' || value === null) return false;
  const { url, slug } = value as Record<string, unknown>;
  return typeof url === 'string' && url.length > 0 && typeof slug === 'string' && slug.length > 0;
}

/** Validates raw stored text; never throws. Drops malformed entries. */
export function parseStored(raw: unknown): Bookmark[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const out: Bookmark[] = [];
  for (const item of data) {
    if (!isBookmark(item)) continue;
    const url = normalizeUrl(item.url);
    if (url) out.push({ url, slug: item.slug });
  }
  return out;
}

export function serialize(bookmarks: Bookmark[]): string {
  return JSON.stringify(bookmarks.map(({ url, slug }) => ({ url, slug })));
}

export function formatBookmark(b: Bookmark): string {
  return `${b.url}${SEPARATOR}${b.slug}`;
}
