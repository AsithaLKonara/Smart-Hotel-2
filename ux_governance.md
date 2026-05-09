# SmartHotel OS — UX Governance & Role Layout Standards

This document establishes UI/UX constraints, luxury color themes, keyboard interaction palettes, and responsive layouts tailored to high-pressure hospitality shifts.

---

## 1. Visual Brand Palette (Dark Luxury)

SmartHotel OS delivers a calm, high-contrast, premium interface minimizing screen strain during late-night shifts:

- **Primary Background**: `#090514` (Deep obsidian indigo)
- **Secondary Surfaces**: `#120d24` (Sleek dark violet slate)
- **Accents**: `#8b5cf6` (Vibrant electric amethyst)
- **State Semantics**:
  - `READY`: `#10b981` (Emerald mint green)
  - `WARNING`: `#f59e0b` (Warm amber gold)
  - `CRITICAL`: `#ef4444` (Ruby red crimson)

---

## 2. Keyboard-First Command Palette Specs

Operating reception desks or kitchen prep tables requires fast execution speeds. The application integrates a global **Spotlight-Style console overlay**:

- **Hotkeys**: `Cmd+K` or `Ctrl+K` triggers console input overlay from any workspace.
- **Console Command Mapping**:
  - `/clean [Room Number]` dispatches immediate housekeeper assignment.
  - `/incident [Description]` opens instant maintenance log drawer.
  - `/chat [Message]` broadcasts workspace collaboration channel notes.

---

## 3. Responsive Workspace Viewports

The design system maps layouts to operational roles:

| Operational Workspace | Target Viewport | Core UX Criteria |
| :--- | :--- | :--- |
| **Front Desk Receptionist** | Tablet / Desktop | Calendar timelines, arrivals list, fast room swaps. |
| **Kitchen Executive (KDS)** | Large Touch Monitor | Large tactile cards, allergy highlighting, countdowns. |
| **Housekeeper & CMMS** | Mobile PWA | Offline sync storage, one-tap completes, camera logs. |
| **Operations Manager** | Desktop | Telemetry logs, department heatmap, cost analytics. |
