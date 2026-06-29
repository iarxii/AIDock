# AIDock Integrated Workspace Terminal & CLI Harness

This plan details the design and implementation of an interactive web-based terminal within the AIDock frontend, backed by a pseudo-terminal (PTY) WebSocket server, which defaults to an enhanced, container-aware version of the `aidock` CLI tool.

---

## User Review Required

> [!IMPORTANT]
> **Docker Context Change**: The backend build context will be shifted from `./backend` to the project root `.` to allow the container image to package and execute the `cli` folder.
> **Dependency Update**: The client requires `xterm` and `xterm-addon-fit` npm packages, and the backend requires CLI dependencies (`click`, `rich`, `questionary`) to be compiled during docker build.

---

## Open Questions

> [!NOTE]
> None. The requirements are clear, and the design relies on standard containerized PTY/Xterm.js architectures.

---

## Proposed Changes

### 1. Build and Orchestration Layer

#### [MODIFY] [docker-compose.yml](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/docker-compose.yml)
- Change `backend.build.context` to `.` and specify `dockerfile: ./backend/Dockerfile` to enable copying root files.

#### [MODIFY] [Dockerfile](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/Dockerfile)
- Update to COPY CLI source directories and requirements during backend image compilation.
- Ensure root `requirements.txt` CLI dependencies are installed alongside FastAPI backend packages.

---

### 2. Backend API Layer

#### [MODIFY] [main.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/main.py)
- Create a WebSocket endpoint at `/ws/terminal` accepting a `session_id` query parameter.
- Implement an asynchronous PTY spawner using Python's standard `pty.openpty()` and `asyncio.create_subprocess_exec`.
- Spawn `bash` pointing to `/workspace/<session_id>` with a fallback execution command that launches `python3 /app/cli/aidock.py` on launch.
- Pipe binary/text streams bidirectionally between the WebSocket socket and PTY master file descriptor.

---

### 3. CLI Orchestrator Layer

#### [MODIFY] [aidock.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/cli/aidock.py)
- Detect container environment via `CONTAINER_MODE` or `/.dockerenv`. If inside a container, disable host-bound compose commands (`start`, `stop`, `reload`, `prune`) with a clear user notice.
- **Add `chat` command**: Launches an interactive, ANSI-formatted chat session with the active model. Support:
  - `/exit` / `/quit`: Close session.
  - `/model`: Switch local/cloud LLMs.
  - `/files`: Quick workspace overview.
  - `/clear`: Clear terminal history.
- **Add `run` command**: Batch task invocation directly from command line parameters (e.g. `aidock run "compile code"`).
- **Add `status` command**: Display active session information and workspace metadata.

---

### 4. Frontend UI Layer

#### [MODIFY] [package.json](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/package.json)
- Add `xterm` and `xterm-addon-fit` to production dependencies.

#### [MODIFY] [App.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx)
- Integrate a toggleable Bottom Terminal Drawer (`h-72`) utilizing `xterm.js`.
- Mount terminal instance on a `<div ref={terminalRef}>` container.
- Establish a WebSocket channel connection to `ws://<host>:<port>/ws/terminal?session_id=<sessionId>` on load/remount.
- Integrate the `FitAddon` to automatically recalculate character dimensions on window resize.
- Wire up a toggle shortcut key/icon in the App header for accessibility.

---

## Verification Plan

### Automated Tests
- Build verification: `npm run build` in client directory.
- CLI execution check: Execute local Python execution of CLI with dummy env options.

### Manual Verification
1. Run `.\aidock.bat reload` to rebuild the backend container with the updated context.
2. Load UI in browser and open the Terminal Drawer.
3. Confirm that the terminal starts inside `python cli/aidock.py` inside the container.
4. Verify execution of CLI menu, selection of options, and dropping into standard shell workspace on exit.
5. Verify command line execution of `npm run build` or file operations directly from the UI terminal.
