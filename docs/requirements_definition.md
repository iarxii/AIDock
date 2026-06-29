# Requirements Definition - AIDock Integrated UI Terminal & CLI Harness

This document defines the functional and non-functional requirements for the AIDock terminal interface and enhanced command-line CLI developer harness.

---

## 1. Functional Requirements

### 1.1 Web UI Terminal Component
- **A. Terminal Console**: The AIDock web application must feature a bottom console panel (Terminal Drawer) that can be toggled via a button in the main header and a keyboard shortcut (e.g. ``Ctrl + ` ``).
- **B. Workspace Bound**: The terminal session must automatically start inside the current active session workspace directory (`/workspace/<session_id>`) inside the backend Docker container.
- **C. Interactive Shell**: The terminal must be fully interactive, supporting:
  - Cursor control, carriage returns, arrow-key navigation.
  - Shell tab completions, history, and standard signals (Ctrl+C, Ctrl+D).
  - Rich ANSI/VT100 escape sequence formatting (colors, styles).
- **D. Default CLI Harness Entry**: Upon first mount or remount, the terminal session must automatically execute the `aidock` CLI tool as the primary interactive shell interface. If the user exits the CLI tool, the terminal session must drop them into a standard `bash` shell bound to the session directory rather than closing the connection.

### 1.2 CLI Tool Enhancements (Harness Mode)
- **A. Container Awareness**: The CLI tool (`cli/aidock.py`) must dynamically detect if it is running inside the container environment. If inside the container, Docker host commands (`start`, `stop`, `reload`, `prune`) must be deactivated, and workspace operations must be highlighted.
- **B. Interactive Chat Interface (`chat`)**:
  - The CLI must provide an interactive, CLI-based agent chat loop via a new command: `aidock chat` or `aidock run`.
  - Type-in queries must send messages to the AIDock backend agent and print agent responses with formatted rich Markdown.
  - Support slash commands inside the chat loop: `/exit`, `/quit`, `/clear`, `/files`, `/model`.
- **C. Batch Execution Interface (`run`)**:
  - Direct execution of tasks via single-invocation prompts (e.g. `aidock run "create a python server"`).
- **D. Status Reporting (`status`)**:
  - Query active LLM configurations, session IDs, API endpoints, and filesystem metrics.

---

## 2. Non-Functional Requirements

- **A. Real-Time Responsiveness**: Bidirectional PTY communication must have low-latency input/output streams over WebSockets.
- **B. Resource Safety**: Terminating a terminal WebSocket connection must clean up all spawned child processes and file descriptors on the backend to prevent resource leaks.
- **C. Isolation**: Subprocesses spawned inside the backend container terminal must not be able to escape the container boundary or access host-level Docker sockets.
- **D. Portability**: The backend implementation should dynamically fall back to standard execution if the host OS doesn't support pseudo-terminals (e.g. native Windows development without Docker).
