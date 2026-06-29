# AIDock Frontend Polish — Dark/Light Theme, Layout, Model Dropdown, Markdown Fixes

## Code Review Findings (Pre-Implementation)

### [P1] Cloud Model Dropdown Always Empty
**File:** [App.tsx:394-444](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx#L394-L444)
**Root cause:** `fetchCloudModels` requires a `CloudSpace` with `recommended_provider` set. When `code-lab` is selected, its `recommended_provider` is `"ollama_cloud"` — this provider requires `x_base_url` and `actual_key` to be sent, but the AIDock client sends **neither** of those headers. The `/api/models?provider=ollama_cloud` endpoint returns `[]` because `x_base_url` is null. Similarly, `spirit-book` uses `"gemini"` which requires `GEMINI_API_KEY` to be set server-side — if it's not, the API returns `[]`.
**Fix:** The model dropdown needs to use the `recommended_model` directly from the space config as a fallback when the models API returns empty. This is a **data-driven fallback**, not a code bug.

### [P1] Content Clipping (Global)
**File:** [App.tsx:150-164](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx#L150-L164) and [App.tsx:1507-1560](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx#L1507-L1560)
**Root cause:** The outer chat bubble has `max-w-[85%]` (line 1485 and 1495), then a nested `max-w-[85%]` which compounds to ~72% effective width. Inside a `p-4` bubble, the `TutorBlock` and `SpiritBlock` themselves have their own padding. Combined with the `prose` class's default `max-width`, this creates severe horizontal clipping. The `overflow-hidden` on the TutorBlock container (line 153) clips long words/code.
**Fix:** Apply anti-clipping globally: remove compounding `max-w-[85%]`, use `overflow-x-auto` everywhere instead of `overflow-hidden`, add `break-words` / `overflow-wrap: anywhere` at the global prose level, and ensure all content containers use `max-w-none`. This is not limited to TUTOR/SPIRIT blocks — it's a whole-chat-panel fix.

### [P2] Chat Panel Padding Compression When Editor Is Open
**File:** [App.tsx:1345-1346](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx#L1345-L1346)
**Root cause:** When editor opens, chat collapses to `lg:col-span-3` but retains `p-6` padding on the inner container. On a 3-column span, `p-6` (24px) on each side eats 48px from ~25% of viewport width — the paddings become disproportionate.
**Fix:** Redistribute the 12-column grid: change editor from `col-span-6` → `col-span-5` and chat from `col-span-3` → `col-span-4`. This gives the chat panel 33% instead of 25%, significantly reducing the squeeze. Also reduce padding to `p-4` when editor is open.

### [P2] No Dark Mode Support
**Issue:** Entire UI is hardcoded to light colors. No `prefers-color-scheme` detection or user toggle.
**Fix:** Add CSS custom properties for dark theme, detect system preference, persist user choice, add toggle in Settings modal.

---

## Proposed Changes

### 1. Dark/Light Theme System

#### [MODIFY] [index.css](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/index.css)
- Add `:root` (light) and `.dark` (dark) CSS custom property sets
- Add `@media (prefers-color-scheme: dark)` auto-detection rule
- Update `body` styles to reference variables

#### [MODIFY] [App.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx)
- Add `theme` state: `'system' | 'light' | 'dark'`, persisted to `localStorage`
- Add `useEffect` to apply `.dark` class to `<html>` based on theme choice + system preference
- Add "UI Accessibility" section in Settings Modal with 3-segment theme selector (System / Light / Dark)
- Replace **all** hardcoded color tokens in JSX className strings with CSS variable references where impactful (primary surfaces, text, borders)

> [!IMPORTANT]
> Due to the heavy use of inline Tailwind classes with hardcoded hex values throughout App.tsx (~1900 lines), a full token replacement in a single pass would be error-prone. The approach will be:
> 1. Add dark-mode-aware CSS classes for **major surfaces** (body, cards, modals, chat bubbles, editor)
> 2. Use Tailwind's `dark:` prefix for the most impactful elements
> 3. Leave minor decorative elements for a future polish pass

---

### 2. Chat Panel Padding Fix (Editor Open State)

#### [MODIFY] [App.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx)
- Editor section: Change from `lg:col-span-6` → `lg:col-span-5`
- Chat section: Change from `lg:col-span-3` → `lg:col-span-4` (when editor open)
- Chat container padding: conditional `p-4` when editor open, `p-6` otherwise
- Line 1485: Remove the nested `max-w-[85%]` from the message flex container — the outer one is sufficient
- Line 1495: Set message content wrapper to `max-w-full` instead of `max-w-[85%]` to prevent compounding width reduction

---

### 3. Model Dropdown Fix + SVG Icon

#### [MODIFY] [App.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx)
- In `fetchCloudModels`: When the API returns `[]`, insert a synthetic model entry using the space's `recommended_model` and `recommended_provider` so the dropdown always has at least one option
- Add a small `<Cpu />` SVG icon to the left of the model `<select>` element for visual clarity
- Auto-select the recommended model + provider even when the API doesn't return a list

---

### 4. Markdown / TUTOR Block Content Clipping Fix

#### [MODIFY] [App.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx)
Global anti-clipping pass across all content containers:
- `TutorBlock`: Replace `overflow-hidden` with `overflow-x-auto`, add `break-words` and `max-w-none`
- `SpiritBlock`: Same — add `overflow-x-auto` and `break-words`
- `CanvasCodeBlock`: Add `overflow-x-auto` to code content area
- Chat bubble prose wrapper (line 1514): Add `break-words overflow-x-auto overflow-wrap-anywhere` 
- All `pre` and `code` blocks: ensure `overflow-x-auto` via prose overrides
- Add a global CSS rule: `.prose pre, .prose code { overflow-wrap: anywhere; word-break: break-word; }`

#### [MODIFY] [index.css](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/index.css)
- Add global prose overflow safety rules to prevent clipping in any context

---

## Verification Plan

### Automated Tests
- `npm run build` in `AIDock/client` — must pass with 0 errors

### Manual Verification
1. Open AIDock frontend in browser
2. Verify Settings Modal has "UI Accessibility" section with theme toggle
3. Toggle between System / Light / Dark and confirm visual update
4. Open editor + chat side-by-side and verify padding is not crushing chat content
5. Verify model dropdown shows at least the recommended model for `code-lab` space
6. Send a message that triggers a `[TUTOR]` block and verify no content clipping
7. Verify the Cpu icon appears next to the model selector dropdown
