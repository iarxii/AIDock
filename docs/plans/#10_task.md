- `[x]` **Phase 1: Workspace Session ID Fix**
  - `[x]` Open `SessionHistoryPanel.tsx`.
  - `[x]` Update `onSelectSession(session.session_id)` to fallback to `String(session.id)`.

- `[x]` **Phase 2: Unhide Model Selector**
  - `[x]` Open `App.tsx`.
  - `[x]` Remove the `cloudModels.length > 0 &&` wrapping condition for the Cloud Model `<select>`.
  - `[x]` Remove the `localModels.length > 0 &&` wrapping condition for the Local Model `<select>`.
  - `[x]` Ensure disabled/empty states handle lack of models gracefully (e.g. "Loading..." or "No models").

- `[x]` **Phase 3: Markdown & Mermaid Integration**
  - `[x]` Run `npm install react-markdown remark-gfm mermaid` in `client`.
  - `[x]` Update `App.tsx` with imports for `react-markdown`, `remark-gfm`, and `mermaid`.
  - `[x]` Initialize `mermaid` in `App.tsx`.
  - `[x]` Build a custom `MermaidDiagram` component using a `useEffect` hook to render mermaid charts.
  - `[x]` Replace the `whitespace-pre-wrap` div in the Chat stream map with `<ReactMarkdown>` using `components` props for standard markdown formatting and `mermaid` interception.

- `[x]` **Phase 4: Unified Session Rehydration**
  - `[x]` Save and load local chat history to `chat_history.json` on AIDock backend.
  - `[x]` Implement `GET /conversations/by-session/{session_id}` route with fallback in AI_Codex backend.
  - `[x]` Persist and associate `session_id` in cloud `spaces/codegen` messages.
  - `[x]` Implement `fetchSessionMessages` in React client to fetch messages automatically when session changes.

- `[x]` **Phase 5: Auto-Save UI/UX Polish**
  - `[x]` Render premium sliding switch toggle for Autosave in editor pane.
  - `[x]` Disable Save button and show spinner during save operation.
  - `[x]` Resolve TS compilation warnings (`lang` and `isSaving` unused).
