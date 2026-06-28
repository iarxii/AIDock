# Dependency Review: Unified Chat & Workspace Orchestration

This document reviews the dependencies, data models, and architectural boundaries across the three main platforms (`AICodex`, `VSCodex`, and `AIDock`) to unify the `SESSION_ID` and `WORKSPACE_ID` terminology and integrate dynamic LLM chat titles and history panels.

## 1. Current State Analysis

### AICodex (Cloud Backend & Web UI)
- **Data Model:** Uses a Postgres database. The core unit is a `Conversation` model with an integer `id`, string `title`, and timestamps.
- **Endpoints:** Provides robust REST API (`/api/conversations/`) to list, create, and fetch conversation history.
- **Workspace vs Session:** A `conversation_id` is primarily a chat thread. The filesystem context (for the agent) is often bound to this ID (e.g., `data/workspaces/{session_id}`).
- **Chat Titles:** Currently defaults to "New Conversation" unless manually updated or generated.

### VSCodex (VS Code Extension)
- **Architecture:** Communicates with the `AICodex` backend via WebSockets (`/ws/agent`).
- **State Management:** Relies entirely on the `AICodex` backend for conversation continuity and history. The "workspace" is implicitly the user's opened folder in VS Code, meaning the "session" in VS Code is purely conversational, not an isolated cloud filesystem container.

### AIDock (Local & Hybrid Frontend/CLI)
- **Data Model:** No local database. The backend uses the filesystem (`data/sessions/session_{X}`) directly.
- **Terminology:** Uses `session_id` (a generated string like `session_1782599848728`) as both the chat thread identifier AND the directory name for the agent's filesystem sandbox.
- **UI:** The frontend displays the raw `session_id` string in an editable input box in the header. It lacks a visual "History" sidebar to traverse past sessions.

## 2. Core Misalignments

> [!WARNING]  
> The largest architectural gap is the data type mismatch. `AICodex` uses auto-incrementing integers for `conversation_id`, while `AIDock` uses client-generated strings (`session_{timestamp}`). If `AIDock` switches to Cloud Mode, it attempts to pass a string ID to an endpoint expecting an integer, or completely bypasses the DB history tracking.

Additionally, `AICodex` treats "Workspaces" and "Conversations/Sessions" slightly differently depending on the submodule (`codex_spaces` vs `core`), while `AIDock` strictly enforces a 1:1 relationship where the Session IS the Workspace.

## 3. Proposed Unified Architecture

To adhere to the goal of "stick to one convention across the AICodex, VSCodex, and AIDock Agentic Harness Tools", we will establish the **Unified Session-Workspace (USW)** convention:

1. **Terminology Resolution (`session_id` vs `workspace_id`)**
   - We will standardize on the term **`session_id`** globally. 
   - A `session_id` represents a 1:1 mapping of a **Chat Thread** to a **Filesystem Sandbox**.
   - To support both local file-based systems (AIDock) and DB-backed systems (AICodex), `session_id` will be standardized as an alphanumeric UUID or String token (e.g., `sess_abc123`) across ALL databases and frontends, deprecating integer IDs.

2. **Chat Title Generation**
   - **Trigger:** When the *first* human message is sent in a new `session_id`, the orchestration backend will asynchronously dispatch a lightweight prompt to the LLM (e.g., `gemma4` or `mistral`) to generate a 3-5 word title summarizing the prompt.
   - **Storage:** Saved to the `Conversation` DB in `AICodex` and a `metadata.json` file inside the `data/sessions/{session_id}/` folder for `AIDock`.

3. **AIDock Right-Side History Panel**
   - The current editable `<input>` field for the Session ID in `AIDock` will be refactored into a clickable `<button>`.
   - Clicking this button will toggle a sliding right-side panel (the `SessionHistoryPanel`).
   - The panel will query `GET /api/conversations` (if in Cloud Mode) or `GET /sessions` (if in Local Mode) to list historical sessions, displaying the LLM-generated titles and timestamps.
