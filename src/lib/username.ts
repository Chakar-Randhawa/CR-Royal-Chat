// Royal Chat — username helpers.
//
// Usernames are how people find and start chats with each other (no
// phone numbers, no OTP). Each username is reserved in its own
// `usernames/{usernameLower}` document so uniqueness can be checked
// and enforced with a single, cheap document read/write instead of a
// query, and so Firestore security rules can allow the check to run
// before a user is signed in (e.g. during sign-up).
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

const USERNAME_RULES = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): string | null {
  const normalized = normalizeUsername(raw);
  if (!normalized) return 'Username is required';
  if (!USERNAME_RULES.test(normalized)) {
    return '3-20 characters: lowercase letters, numbers, and underscore only';
  }
  return null;
}

export async function isUsernameAvailable(usernameLower: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'usernames', usernameLower));
  return !snap.exists();
}

/**
 * Atomically reserves a username for a uid. Throws if the username is
 * already taken (checked again inside the transaction to close the
 * race window between the availability check and account creation).
 */
export async function reserveUsername(usernameLower: string, uid: string): Promise<void> {
  const ref = doc(db, 'usernames', usernameLower);
  await runTransaction(db, async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists()) {
      throw new Error('username-taken');
    }
    tx.set(ref, { uid, usernameLower, createdAt: Date.now() });
  });
}

export async function releaseUsername(usernameLower: string): Promise<void> {
  await deleteDoc(doc(db, 'usernames', usernameLower));
}

export interface UserSearchResult {
  uid: string;
  username: string;
  displayName: string;
  about?: string;
  avatarUrl?: string;
  publicKeyJwk?: JsonWebKey;
}

/**
 * Prefix search over usernames (Firestore has no full-text search, so
 * this matches "starts with" using a range query on usernameLower).
 */
export async function searchUsersByUsername(
  prefix: string,
  excludeUid?: string
): Promise<UserSearchResult[]> {
  const normalized = normalizeUsername(prefix);
  if (!normalized) return [];

  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    orderBy('usernameLower'),
    where('usernameLower', '>=', normalized),
    where('usernameLower', '<=', normalized + '\uf8ff'),
    limit(20)
  );

  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data() as any;
      return {
        uid: d.id,
        username: data.username,
        displayName: data.displayName,
        about: data.about,
        avatarUrl: data.avatarUrl,
        publicKeyJwk: data.publicKeyJwk ? JSON.parse(data.publicKeyJwk) : undefined,
      };
    })
    .filter((u) => u.uid !== excludeUid);
}
