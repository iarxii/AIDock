# AIDock UI & UX Improvements Implementation Plan

This plan outlines the refactoring of the AIDock frontend interface to improve accessibility, layout, editing efficiency, and aesthetic consistency.

## User Review Required
(All questions answered. Proceeding with execution.)

## Proposed Changes

---

### AIDock Frontend Grid & Layout Refactoring

#### [MODIFY] `c:\AppDev\My_Linkdin\projects\iarxii\AIDock\client\src\App.tsx`
- **Capabilities Panel**: Add `isCapabilitiesExpanded` state and toggle logic to the "Available Capabilities" card to match the "Workspace Files" collapsible behavior.
- **Grid Reordering**: Move the conditional Text Editor rendering block `<section>` to be *before* the Chat Area `<section>` in the JSX so it appears on the left.
- **Grid Spans**: 
  - Chat Panel: Change conditional classes to `${isTextEditorOpen ? 'lg:col-span-3' : 'lg:col-span-9'}`
  - Text Editor Panel: Change classes to `lg:col-span-6`
- **Model Selection Dropdown**: Move the local and cloud `select` elements out of the Settings Modal and place them directly into the Chat Area Header so users can switch models on the fly. The design will conditionally render the appropriate dropdown (local vs cloud) based on `isCloudMode()`, ensuring a consistent but context-appropriate UX.
- **Keyboard Overrides & Autosave**:
  - Add an `autoSave` toggle state (`boolean`) to the Editor Header.
  - Add an `onKeyDown` event listener to the `textarea` capturing `Ctrl+S` / `Cmd+S` to trigger `handleSaveFile()` manually and call `e.preventDefault()`.
  - Add a `useEffect` hook that triggers `handleSaveFile()` every 3 seconds if `autoSave` is active and `editorSaved` is false.
  - Update the Document Status Label (`<span className="w-2 h-2 ...">`) to have adjacent text indicating "Saved" or "Unsaved".

---

### AIDock Frontend Component Styling

#### [MODIFY] `c:\AppDev\My_Linkdin\projects\iarxii\AIDock\client\src\components\SessionHistoryPanel.tsx`
- **Global Theme Alignment**: 
  - Replace all instances of orange accents (`#F97316`, `#EA580C`, `#FFEDD5`, `#C2410C`) with the global AIDock cyan/blue branding (`#0db7ed`, `#008bb9`, `#E8F7FD`, `#1A1D2E`).

## Verification Plan

### Manual Verification
1. Open the AIDock frontend and verify that the "Available Capabilities" panel can be collapsed and expanded.
2. Open a workspace file and verify the Text Editor slides open *between* the left menu and the chat panel (6 columns wide).
3. Type in the editor and press `Ctrl+S`. Verify the UI toast "Saved successfully" appears and the status indicator turns green. Toggle "Autosave" and verify it saves automatically after a brief delay.
4. Open the Session History side-panel and verify all orange colors have been replaced with the AIDock cyan global theme.
5. Verify the Chat Panel Header contains the Model Selection dropdown and successfully switches the active inference model.
