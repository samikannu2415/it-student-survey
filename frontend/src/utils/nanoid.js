// src/utils/nanoid.js
// Minimal nano-ID replacement to avoid the ESM-only nanoid package with CRA.
export function nanoid(size = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(size);
  crypto.getRandomValues(array);
  array.forEach(v => { result += chars[v % chars.length]; });
  return result;
}
