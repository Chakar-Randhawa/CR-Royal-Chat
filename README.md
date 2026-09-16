# Relay Web (React & TypeScript)

Privacy-first, zero-infrastructure-cost messaging web application rewritten in React 18, TypeScript, Tailwind CSS, and Vite.

## Overview

Relay is a privacy-first web messaging platform built with a high-performance React architecture. It delivers a desktop-grade multi-pane experience on large screens and a native-feeling mobile single-view layout on small devices.

Relay features client-side end-to-end encryption concepts (X25519 ECDH + AES-GCM-256 fingerprinting), a 4-stage message delivery lifecycle (Sending, Sent, Delivered, Read), debounced typing indicators, simulated real-time peer reactions and auto-replies, push-to-talk voice notes with live interactive animated audio waveforms, safety number verification with QR codes, group management, media sharing with full captions, and local encrypted chat backups.

## Key Features

- **Responsive Adaptive Interface**:
  - **Desktop (3-Pane Scaffold)**: NavRail with badged tabs, central conversation list with filter pills (`All`, `Unread`, `Groups`), and detail pane with active thread or branded zero-infra empty state.
  - **Mobile**: Touch-optimized single-view flow with transition headers, swipeable actions, and floating compose button.
- **Rich Message Composer & Messaging**:
  - Text messaging with multi-line auto-grow and Enter-to-send support.
  - Reply bar quoting previous messages.
  - Photo attachment modal with live image preview and captioning.
  - Push-to-talk voice recording mode with live animated equalizer waveforms and audio playback.
  - Emoji quick reaction bar and message context menu (Reply, Star, Copy, Info, Delete).
  - 4-Stage Delivery Receipts: Clock (Sending), Single check (Sent), Double check (Delivered), Colored double check (Read).
- **Security & Privacy**:
  - 12-block safety number comparison modal with QR code generator.
  - Key vault displaying public ECDH identity keys.
  - Privacy toggles for Read Receipts and Last Seen status.
- **Settings & Media Management**:
  - Dark / Light / System theme switching with persistent state.
  - Cache manager with granular storage breakdown (photos, voice, encrypted database).
  - Encrypted JSON archive export and restoration.
- **Authentication & Setup**:
  - Zero-friction onboarding: Phone number entry with searchable country code picker, 6-digit SMS verification screen, and profile setup.

## Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Production build
npm run build
```
