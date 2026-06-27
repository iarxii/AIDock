# Design Spec & Implementation Plan — Real-Time Latency Timer & Chat Export Dropdown

This plan outlines the addition of:
1. A **real-time millisecond thinking timer** to measure model response latency.
2. A **Chat Export Dropdown** supporting local browser downloads, direct server saving, and an interactive **Text Editor** panel.

---

## 1. User Flows & States

### Flow: Exporting Chat to Workspace and Reviewing in UI

#### Overview
- **Goal:** Export the current chat transcript to Markdown or JSON, save it directly to the container workspace mount, or open it in a code-editor view side-by-side with the chat.
- **User Story:** As an AI developer, I want to export my conversation logs so that I can audit agent performance and workspace outputs.
- **Trigger:** Clicking the "Export Chat" dropdown menu in the chat header.

```
[Start Chatting]
      │
      ▼
[Send Message] ────▶ [Start Real-time Timer] ────▶ [Display Millisecond Counter]
      │                                                     │
      ▼                                                     ▼
[Receive Message] ◄───────────────────────────────── [Freeze Latency tag]
      │
      ▼
[Click Export Dropdown]
      ├────── Download (JSON/MD) ────────▶ [Trigger Browser Download]
      ├────── Save to Workspace ─────────▶ [API Post /api/export] ──▶ [Toast Success]
      └────── Open in Text Editor ────────▶ [Open Sidebar Panel]
                                                    │
                                                    ▼
                                            [Edit Markdown/JSON] ──▶ [Save/Download]
```

#### States
- **Normal Chat State:** Full screen view with sidebar (25%) and chat area (75%).
- **Active Latency State:** Shows a ticking millisecond counter in the thinking bubble (e.g. `Thinking (2,430 ms)...`).
- **Completed Latency State:** Every assistant response bubble features a latency micro-tag (e.g., `Latency: 2.4s` or `Latency: 27,944 ms`).
- **Text Editor Open State:** Squeezes the layout to fit a three-pane responsive layout:
  - Sidebar: `lg:col-span-3` (25%)
  - Chat Area: `lg:col-span-5` (41.6%)
  - Text Editor: `lg:col-span-4` (33.3%)
- **Editor Status States:**
  - `Saved`: Displayed as a green success badge when changes are pushed to `/workspace`.
  - `Unsaved`: Displayed as an orange warning badge when the user modifies the textarea.

---

## 2. Component Specifications

### Component: `LatencyTimer`
- **Purpose:** Tracks elapsed time in milliseconds during active LLM inference.
- **Implementation:** React `useEffect` with `requestAnimationFrame` for a smooth, high-precision timer.
- **Outputs:** Displayed inside the loader bubble. Once completed, saved in the message list schema as `latencyMs` and rendered under the corresponding message.

### Component: `ExportDropdown`
- **Purpose:** A clean, accessible overlay dropdown for selection of export options.
- **Options:**
  - `Download JSON` / `Download Markdown` (using Client-side Blob urls)
  - `Save to Workspace (JSON)` / `Save to Workspace (Markdown)` (triggers `/api/export`)
  - `Open in Text Editor` (opens Text Editor side pane)
- **A11y:** Focus management, key controls (`Esc` to close, `ArrowUp`/`ArrowDown` navigation, `Enter` to select).

### Component: `TextEditorPane`
- **Purpose:** A sidebar panel mimicking a code editor to review, edit, and save exports.
- **Design Tokens:**
  - Editor Background: `#1A1D2E` (matching the dark theme text color)
  - Text Area Color: `#E8ECF2`
  - Font: `JetBrains Mono` or default `monospace` (JetBrains Mono preferred)
- **Interactive States:** Editing in the textarea triggers the "Unsaved changes" status. Pressing `Save to Workspace` updates the state to "Saved".

---

## 3. Proposed Code Changes

### Backend API Expansion

We will add a new Pydantic schema and route in the backend to save export contents directly to the current session's workspace.

#### [MODIFY] [main.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/main.py)
- Import `Path` from `pathlib` and `BaseModel` from `pydantic`.
- Add an `ExportRequest` schema:
  ```python
  class ExportRequest(BaseModel):
      session_id: str
      filename: str
      content: str
  ```
- Implement the `@app.post("/export")` endpoint:
  - Constructs the absolute workspace destination path safely using `Path("/workspace") / request.session_id`.
  - Prevents path traversal vulnerabilities using `Path(request.filename).name`.
  - Writes the string body to the file.

---

### Frontend UI Deep Refactor

We will refactor the frontend layout to support the 3-column split-view, add the timer logic, build the dropdown menu, and implement the text editor.

#### [MODIFY] [App.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx)
- Extend `Message` interface to include optional fields:
  ```typescript
  latencyMs?: number;
  ```
- Add state variables:
  - `elapsedMs`: number (for real-time ticking)
  - `timerActive`: boolean
  - `isTextEditorOpen`: boolean
  - `editorContent`: string
  - `editorFilename`: string
  - `editorFormat`: 'json' | 'markdown'
  - `editorSaved`: boolean
- Implement `handleSend` enhancements:
  - Record start time `const start = Date.now()`.
  - Start real-time ticking interval updating `elapsedMs` every 50ms.
  - Store the final delta in `botMessage.latencyMs` once resolved.
- Implement Chat Header bar featuring session information and the `Export Chat` dropdown menu.
- Implement local file export methods (converting message state into JSON or Markdown string download URLs).
- Build the `TextEditorPane` layout:
  - Integrated into the Grid dynamically based on `isTextEditorOpen`.
  - Includes syntax/line number decorations and responsive dark editor theme.
  - Plugs into the backend API `/api/export` using fetch POST requests.

---

## 4. Verification Plan

### Automated & Manual Verification
1. **Latency Timer Check:** Send a prompt and confirm the loader ticks in milliseconds. Verify the final reply shows the frozen latency in seconds (e.g. `Latency: 4.3s`).
2. **Download Check:** Click "Download JSON" and "Download Markdown". Confirm the browser prompts and saves valid files locally.
3. **Workspace Check:** Click "Save to Workspace (Markdown)". Check that `/workspace/{session_id}/chat_export.md` is successfully created inside the container (we can verify with docker commands).
4. **Text Editor Check:** Click "Open in Text Editor". Verify the layout splits smoothly, the textarea displays the chat logs, and editing sets the status to "Unsaved". Click "Save to Workspace" inside the editor and verify the status flips back to "Saved".
