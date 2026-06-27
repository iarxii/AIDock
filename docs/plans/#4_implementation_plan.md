# Design Spec & Implementation Plan — Advanced OBSERVABILITY & Workspace UI Refactor

This plan addresses the user visual change proposals from `Screenshot 2026-06-27 230234.png`:
1. **Widen container (.container-fluid):** Expand screen layout to full-width.
2. **User bubble corner & glow fix:** Adjust point origin to top-right with white gradient glow and `rounded-tr-none`.
3. **LLM Logo & model header:** Show model metadata badge row inside assistant messages.
4. **Workspace File Tree:** A collapsible folder structure in the sidebar listing files in the container workspace, with click-to-edit integration.
5. **Utility toolbar:** Add functional buttons (e.g. clear, refresh, templates) above the input.
6. **Plus (+) Context Uploader:** Let users upload context documents to the session workspace.
7. **Autogrowing multitext textarea:** Auto-resizing multiline text input submitting on Enter.

---

## 1. Flows & States

### Flow: Workspace Files Click-to-Edit
```
[User views Workspace Tree] ──▶ [Click file: 'test.py']
                                       │
                                       ▼
                       [Fetch File Content /api/file-content]
                                       │
                                       ▼
                       [Open Text Editor Panel on Right]
                                       │
                                       ▼
                       [Edit & Save to Workspace /api/export]
                                       │
                                       ▼
                       [Refresh File Tree list]
```

### States:
- **Input Textarea State:** Height adjusts dynamically from `48px` to `150px` based on line count.
- **File Upload State:** Drag-and-drop or select file -> uploading progress -> success notification -> reload tree.

---

## 2. Proposed Code Changes

### Backend API Expansion

We will add file tree listing, file reading, and file uploading endpoints.

#### [MODIFY] [main.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/main.py)
- Import `UploadFile`, `File` from `fastapi`.
- Implement `@app.get("/files")` returning names, relative paths, and sizes of files in `/workspace/{session_id}`.
- Implement `@app.get("/file-content")` reading file contents safely preventing directory traversal.
- Implement `@app.post("/upload")` saving uploaded context files directly to `/workspace/{session_id}`.

---

### Frontend Styling Refinement

We will adjust the custom corner glow styles.

#### [MODIFY] [index.css](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/index.css)
- Redefine `.user-corner-glow::before` to draw a white gradient at the top-right corner (`top: -1px; right: -1px;`).
- Redefine `.user-corner-glow-secondary::before` to draw a black gradient at the bottom-left corner (`bottom: -1px; left: -1px;`).

---

### Frontend UI Layout Upgrades

#### [MODIFY] [App.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx)
- **Container Widen:** Change main container class to `max-w-none px-8 w-full`.
- **User Bubble Corner:** Apply `rounded-tr-none` and update glows.
- **LLM Logo:** Add a neat header badge inside assistant messages (e.g. `DeepSeek-R1-Distill-Llama`).
- **File Tree Component:** 
  - Render a collapsible directory list in the left sidebar.
  - Implement dynamic polling/fetching of `/api/files?session_id={session_id}`.
  - Clicking a file fetches content and loads it in the Text Editor.
- **Utility Buttons:** Render a bar above the textarea: "Clear Chat", "Insert Code", "System Health", "Refresh Files".
- **Context Upload Button (`+`):** Add click handler opening an upload input. Sends file to `/api/upload`.
- **Dynamic Textarea Input:** Replace input element with textarea adjusting `rows` or styling `height` dynamically, submitting on Enter (and allowing Shift+Enter newlines).

---

## 3. Verification Plan

### Automated & Manual Verification
1. **Container Width:** Check that page content spans the full screen.
2. **User Bubble pointer:** Send a message and confirm the pointy corner is top-right, styled with white gradient glow.
3. **Model Header:** Verify assistant message includes the model badge.
4. **File Tree:** Create files using chat or text editor, verify they appear in the Sidebar File Tree. Click any file and verify it loads in the text editor.
5. **Context upload:** Click `+`, upload a text file, verify it gets saved to `/workspace/{session_id}` and appears in the tree.
6. **Autogrow textarea:** Type multiple lines in the chat input and verify it grows dynamically. Press Enter to submit.
