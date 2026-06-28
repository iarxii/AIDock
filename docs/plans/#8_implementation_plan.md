# Implementation Plan: Unified Session/Workspace Architecture

This plan executes the findings from the `dependency_review.md` to standardize `session_id` conventions across `AICodex`, `VSCodex`, and `AIDock`, and introduces dynamic LLM chat titling and a visual session history panel.

## User Review Required

> [!WARNING]  
> Modifying the `AICodex` Postgres database schema to convert `Conversation.id` from an Integer to a String (`session_id`) is a destructive database migration. Instead, we will add a new `session_id` (String) column to the `conversations` table in `AICodex` as a secondary unique key, ensuring backward compatibility while allowing `AIDock` string identifiers to seamlessly map to the cloud backend.

## Open Questions

1. Do you want me to write the Alembic database migration scripts for the `AI_Codex` repo right now, or should we focus exclusively on the `AIDock` frontend and backend implementation first?
2. Do we want the LLM Title Generation to block the initial chat response (slightly slower first message), or happen asynchronously in the background (title pops in a few seconds later)? Asynchronous is recommended for UX.

## Proposed Changes

### Phase 1: AIDock Backend Modifications (Local Context)
#### [MODIFY] [backend/main.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/main.py)
- **Metadata Management:** Update the `/chat` endpoint. Upon receiving the first message for a new `session_id`, synchronously or asynchronously prompt the local Docker LLM to generate a 3-5 word title. Save this title to `data/workspaces/{session_id}/metadata.json`.
- **Sessions API:** Create a new `GET /sessions` endpoint that scans `data/workspaces/` (or `data/sessions/`), parses the `metadata.json` for each folder, and returns a JSON list of sessions sorted by last modified time, matching the schema expected from `AICodex` Cloud mode.

### Phase 2: AIDock Frontend UI (History Panel & Header)
#### [NEW] [client/src/components/SessionHistoryPanel.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/components/SessionHistoryPanel.tsx)
- Create a sliding right-side panel component containing a scrollable list of historical sessions.
- Implement fetching logic to dynamically hit `/api/conversations` (Cloud Mode) or `/sessions` (Local Mode).

#### [MODIFY] [client/src/App.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx)
- Replace the `Session ID: [ input ]` field in the header with a dynamic `<button>` that displays the current session's generated Title (or raw ID if loading).
- Bind the button click to toggle the new `SessionHistoryPanel`.
- Implement the `onSelectSession` callback to switch the active `sessionId`, clearing the current chat array and refetching the files and messages for the selected session.

### Phase 3: AICodex Backend Integration (Cloud Orchestration)
*(Note: To be executed in the AI_Codex repository)*
- **Models:** Add `session_id` string column to `backend/db/models.py -> Conversation`.
- **Chat Endpoint:** Add asynchronous LLM title generation to the Cloud Run `/chat` or `/ws` handlers when a new `session_id` is created.
- **REST API:** Ensure the existing `GET /api/conversations/` endpoint supports looking up by the string `session_id` instead of just the integer ID.

## Task List
- `[ ]` Review and approve database schema strategy for AICodex.
- `[ ]` Implement `metadata.json` and auto-titling logic in AIDock local backend.
- `[ ]` Implement `GET /sessions` local endpoint in AIDock.
- `[ ]` Build `SessionHistoryPanel.tsx` in AIDock frontend.
- `[ ]` Refactor AIDock `App.tsx` header to trigger the panel and display the title.

## Verification Plan
1. **Local Mode:** Start a new chat in AIDock, verify the folder is created, `metadata.json` is populated with an LLM-generated title, and the right panel correctly lists the session.
2. **Cloud Mode:** (After `AI_Codex` updates) Switch AIDock to Cloud Mode, verify the right panel pulls the conversation history from the Cloud Run Postgres database.
