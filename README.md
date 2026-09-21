# Royal Chat Web (React & TypeScript)

A free, real-time, end-to-end encrypted messaging web app built with React 18, TypeScript, Tailwind CSS, Vite, and Firebase (Authentication + Firestore).

## Overview

Royal Chat delivers a desktop-grade multi-pane experience on large screens and a native-feeling mobile single-view layout on small devices. Accounts are created with just an **email, username, and password** — no phone number, no OTP/SMS step. People find and message each other by **username**, every conversation is backed by real-time Firebase Firestore listeners, and message/photo/voice content is **end-to-end encrypted** on the sender's device before it ever reaches Firestore.

## Key Features

- **Accounts**: Sign up with email + username + password (Firebase Authentication). No phone numbers, no OTP.
- **Real end-to-end encryption**: Each account generates a real ECDH (P-256) key pair on-device (Web Crypto API). Message text, photos, and voice notes are encrypted with AES-256-GCM before being written to Firestore — Royal Chat's backend only ever stores ciphertext for content. See "How the encryption works" below for the exact scheme and its honest limitations.
- **Real-time messaging**: Conversations, messages, typing indicators, and read receipts are all backed by Cloud Firestore (`onSnapshot` listeners) — no mock or simulated data anywhere in the app.
- **Real audio/video calling**: WebRTC calls signaled through Firestore (offer/answer/ICE candidates) — no third-party calling service. Free STUN only (no TURN); see "Known limitations".
- **Find people by username**: Live username search (prefix match) to start a direct chat or add someone to a group. Usernames are globally unique and reserved atomically at sign-up.
- **Responsive Adaptive Interface**:
  - **Desktop (3-Pane Scaffold)**: NavRail with badged tabs, central conversation list with filter pills (`All`, `Unread`, `Groups`), and detail pane with the active thread.
  - **Mobile**: Touch-optimized single-view flow with transition headers and a floating compose button.
- **Rich Message Composer & Messaging**:
  - Text messaging with multi-line auto-grow.
  - Reply bar quoting previous messages (the quoted text is encrypted too).
  - Photo attachment with live preview and captioning (stored inline and encrypted; keep photos under ~650KB — see "Known limitations").
  - Real voice messages recorded from the microphone (MediaRecorder), encrypted the same way as photos.
  - Emoji quick reaction bar and message context menu (Reply, Star, Copy, Delete).
  - Delivery receipts: Sending → Sent → Read (computed from real per-user "last read" timestamps).
- **Groups**: Create groups, add members by username search, group name/description editing, leave group. Each group has its own random encryption key, individually wrapped for every member with their public key.
- **Settings**: Dark / Light / System theme, real Read Receipts / Last Seen / Notification / Quiet Hours toggles, an Encryption panel showing your real key fingerprint, log out, cache manager (local), JSON chat backup/export, account deletion (also releases your username and clears your local key).

## How the encryption works

- Every account has an ECDH (P-256) key pair. The **private key is generated and stored only in the browser it was created in** (localStorage) — it is never uploaded anywhere. Only the public key goes to Firestore.
- **1:1 chats**: both sides independently derive the *same* AES-256-GCM key from `ECDH(my private key, their public key)`. No symmetric key is ever transmitted.
- **Group chats**: a random AES-256 key is generated once for the group and individually "wrapped" (encrypted) for each member using the pairwise ECDH key between whoever added them and that member. Only an actual member can ever recover the plaintext group key.
- Message text, photo/voice data, and reply-quote text are encrypted this way. Message metadata (sender, timestamp, message kind, reactions) is **not** encrypted — Firestore's security rules (see `firestore.rules`) are what keep that metadata private to a conversation's participants.
- **Honest limitations**: there is no multi-device key sync/backup — logging in on a new device generates a fresh key pair, and message history encrypted for the old key becomes unreadable there (undecryptable messages show a "🔒 Unable to decrypt" placeholder instead of crashing). This implementation has **not** been through independent security review; it is real, working cryptography, not a certified or audited security product.

## Setup

### 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project (the free **Spark plan** is enough for messaging + calling; see the push-notifications note below).
2. Enable **Authentication** → Sign-in method → **Email/Password**.
3. Enable **Firestore Database** → Create database (start in production mode; the rules below secure it).
4. Add a **Web app** (</> icon) to the project and copy the config values it gives you.
5. Deploy the security rules in `firestore.rules` (Firebase Console → Firestore → Rules, or `firebase deploy --only firestore:rules` with the Firebase CLI).

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env` with the web app config values from step 1 (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc). This file is git-ignored — never commit real keys.

### 3. Install and run

```bash
npm install
npm run dev       # local dev server
npm run build     # production build (outputs to dist/)
```

Deploy the `dist/` folder to any static host (Firebase Hosting, Vercel, Netlify, etc). Firebase Hosting's free tier is a natural fit since the app already uses Firebase.

## Optional: push notifications

`functions/` contains an optional Cloud Function that sends a push notification when a new message arrives. It needs the Blaze (pay-as-you-go) plan to deploy, but stays free under normal personal/small-app usage. The chat app works fully in real time without deploying it — you can skip this entirely.

## Known limitations

- **Photos/voice notes** are stored inline (encrypted) as base64 in Firestore (keeps the whole app on the free tier, no Cloud Storage needed) — Firestore's 1MB document limit plus encryption overhead means very large files are rejected with a friendly message (~650KB ceiling).
- **Calling is STUN-only** (Google's free public STUN server) — there is no TURN server configured, so calls between two people on very restrictive networks (symmetric NAT, some corporate firewalls) may fail to connect. Adding a TURN server (e.g. Twilio, Cloudflare both have usable free/cheap tiers) would close that gap. Group calling is not supported — only 1:1.
- Presence ("online" status) is approximated via Firestore field updates on sign-in/sign-out, not a dedicated realtime presence system.
- Encryption keys have no cross-device backup (see "How the encryption works" above) — this is a deliberate, disclosed trade-off, not a bug.
- This code has not been tested against two real, separate live devices/browsers in this environment — it has been verified for correctness via TypeScript compilation and production builds, but real-world testing (especially of calling and encryption across two different accounts) is recommended before relying on it in production.

## Development

```bash
npm install     # install dependencies
npm run dev     # start Vite dev server
npm run build   # production build
```
