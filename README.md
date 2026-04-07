## Overview

RECOIL applies a global dark theme across websites, centralizes navigation, and introduces persistent tools like tasks, bookmarks, and system monitoring.

---

## Features

- Global dark mode applied to all websites
- Minimal UI with left-side navigation only
- Search-first interaction model
- Persistent task management with sidebar sync
- Automatic bookmark integration from browser
- Tab memory usage tracking
- Clean terminal-inspired interface
- Custom branding and icon system

---


## Core Components

### Content Script
Applies global dark theme to all websites using CSS filters.

### Background Script
Handles:
- Bookmark extraction
- Tab memory tracking
- Data persistence

### New Tab Interface
Provides:
- Navigation system
- Task management
- Search panel
- Bookmark display

---

## Functionality

### Dark Theme Engine
- Inverts and adjusts site colors
- Preserves media elements like images and videos

### Search Priority System
- Search panel overrides UI
- Top bar hides during active search
- Restores on navigation interaction

### Task System
- Tasks stored in local storage
- Automatically rendered in sidebar
- Persistent across sessions

### Bookmark Sync
- Fetches all browser bookmarks
- Displays structured links inside UI

### Memory Monitoring
- Tracks memory usage per tab
- Uses Chromium process APIs

---

## Permissions

- tabs
- bookmarks
- storage
- processes

---

## Installation

1. Clone the repository
2. Open browser extensions page
3. Enable developer mode
4. Load unpacked extension
5. Select project folder

---

## Customization

- Modify styles in `/styles`
- Replace icons in `/icons`
- Update layout in `newtab.html`

---

## Status

Stable build  
All core features functional  
Optimized for Chromium-based browsers

---

