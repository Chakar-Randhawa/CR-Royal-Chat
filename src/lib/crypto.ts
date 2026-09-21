// Royal Chat — real end-to-end encryption.
//
// Each account has an ECDH (P-256) key pair. The private key never
// leaves the browser it was generated in (kept in localStorage only);
// only the public key is stored in Firestore. For a 1:1 chat, both
// sides independently derive the SAME AES-GCM key from
// ECDH(myPrivate, theirPublic) — nothing symmetric is ever transmitted.
// For groups, a random AES key is generated once and "wrapped"
// (encrypted) individually for each member using the pairwise ECDH key
// between whoever is adding them and that member, so the server
// (Firestore) only ever sees ciphertext for message content.
//
// Honest limitations (real cryptography, not a "we promise" statement):
// - The private key lives in this browser only. Logging in on a new
//   device generates a fresh key pair, and message history encrypted
//   under the old key becomes unreadable there — there is no
//   multi-device key sync/backup in this version.
// - Metadata (who messaged whom, when, message kind, reactions) is not
//   encrypted — only text and media content are. Firestore's access
//   rules are what keep that metadata private to the conversation's
//   participants.
// - This has not been through independent security review. It is real
//   working encryption, not a marketing claim of being audited or
//   "better" than any specific other product.

const EC_PARAMS: EcKeyGenParams & EcKeyImportParams = { name: 'ECDH', namedCurve: 'P-256' };

export interface WrappedKey {
  iv: string; // base64
  ciphertext: string; // base64
}

function bufToBase64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(EC_PARAMS, true, ['deriveKey', 'deriveBits']) as Promise<CryptoKeyPair>;
}

export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

export async function exportPrivateKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, EC_PARAMS, true, []);
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, EC_PARAMS, true, ['deriveKey', 'deriveBits']);
}

/** Both sides call this with (their own private, the other's public) and get the identical AES-GCM key. */
export async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function generateRandomAesKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export async function exportRawAesKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

export async function importRawAesKey(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Encrypt a UTF-8 string with an AES-GCM key. Returns base64 iv + ciphertext. */
export async function encryptString(key: CryptoKey, plaintext: string): Promise<WrappedKey> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return { iv: bufToBase64(iv.buffer), ciphertext: bufToBase64(ciphertext) };
}

/** Decrypt back to the original UTF-8 string. Throws if the key is wrong or data is corrupt. */
export async function decryptString(key: CryptoKey, wrapped: WrappedKey): Promise<string> {
  const iv = new Uint8Array(base64ToBuf(wrapped.iv));
  const ciphertext = base64ToBuf(wrapped.ciphertext);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuf);
}

/** Wrap (encrypt) a raw AES key's bytes using a pairwise-derived AES-GCM key — used for group key distribution. */
export async function wrapRawKey(wrappingKey: CryptoKey, rawKeyToWrap: ArrayBuffer): Promise<WrappedKey> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrappingKey, rawKeyToWrap);
  return { iv: bufToBase64(iv.buffer), ciphertext: bufToBase64(ciphertext) };
}

export async function unwrapRawKey(wrappingKey: CryptoKey, wrapped: WrappedKey): Promise<ArrayBuffer> {
  const iv = new Uint8Array(base64ToBuf(wrapped.iv));
  const ciphertext = base64ToBuf(wrapped.ciphertext);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, wrappingKey, ciphertext);
}

/** A short, human-checkable fingerprint of a public key (SHA-256, hex, grouped). Not a security boundary by itself — a visual aid only. */
export async function fingerprintPublicKey(jwk: JsonWebKey): Promise<string> {
  const material = new TextEncoder().encode(JSON.stringify({ x: jwk.x, y: jwk.y }));
  const digest = await crypto.subtle.digest('SHA-256', material);
  const bytes = Array.from(new Uint8Array(digest));
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 32).match(/.{1,4}/g)!.join(' ');
}

const LOCAL_KEY_PREFIX = 'royalchat_keypair_';

export interface StoredKeyPair {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}

export function loadStoredKeyPair(uid: string): StoredKeyPair | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_PREFIX + uid);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeKeyPair(uid: string, pair: StoredKeyPair) {
  try {
    localStorage.setItem(LOCAL_KEY_PREFIX + uid, JSON.stringify(pair));
  } catch {
    // If storage is unavailable (private browsing quota, etc.) the keys
    // simply won't persist across reloads — callers already regenerate
    // when nothing is found, so this fails safe.
  }
}

export function clearStoredKeyPair(uid: string) {
  try {
    localStorage.removeItem(LOCAL_KEY_PREFIX + uid);
  } catch {
    // ignore
  }
}
