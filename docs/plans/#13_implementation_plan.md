# Implementation Plan - AIDock Enhancements and Harness Fixes

This implementation plan details the technical solution for the following user requests:
1. **AI-Generated Chat Title**: Display the AI-generated title of the active session in the chat panel header.
2. **Harness Filesystem Access**: Bind filesystem tools (list, read, write, delete) to the backend agent to enable workspace scanning and CRUD operations.
3. **Remove "Write Code" & Auto-Post "Scan Workspace"**: Delete the "Write Code" button and configure the "Scan Workspace" button to submit its action directly.
4. **Chat Context & Token Progress**: Display a progress bar and token count reflecting the chat context state below the chat input box.

---

## User Review Required

> [!NOTE]
> All changes are local and backwards-compatible. Filesystem operations will run inside the container's `/workspace/<session_id>` context, maintaining sandboxing constraints.

---

## Proposed Changes

### Backend Component

We will modify the agent definition to implement filesystem tools and bind them to the local model reasoning node. We will also update the agent graph compilation flow to route and execute tool calls automatically.

#### [MODIFY] [nodes.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/agent/nodes.py)
- Import `tool` decorator and `SystemMessage`.
- Implement `make_workspace_tools(session_id: str)` to produce curried filesystem tools:
  - `list_files()`: Recursive scan of `/workspace/<session_id>`.
  - `read_file(file_path)`: Read relative file.
  - `write_file(file_path, content)`: Write/update relative file.
  - `delete_file(file_path)`: Delete relative file.
- Implement `call_tools_node(state: AgentState)` to execute the requested tool calls and generate `ToolMessage`s.
- Update `reason_node` to:
  - Bind filesystem tools to the LLM.
  - Prepend a `SystemMessage` giving instructions about the tools.
  - Handle tool invocation.
  - Set `is_complete` to `False` if tool calls are present in the response.

#### [MODIFY] [graph.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/agent/graph.py)
- Import `tools_condition` and `call_tools_node`.
- Add `"tools"` node to the graph and register conditional routing from `"reason"` to `"tools"` or `END` based on `tools_condition`.
- Add an edge from `"tools"` back to `"reason"` for agent-loop continuation.

---

### Client Component

#### [MODIFY] [App.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx)
- **AI Session Title**:
  - Add state `sessionTitle` (defaulting to `"Active Session Stream"`).
  - Add function `fetchActiveSessionTitle(sid: string)` to request `/sessions` (or `/conversations` in cloud mode) and find the matching session's title.
  - Fetch the title whenever a session loads or within `fetchSessionMessages`, and update it 1 second after submitting a new message.
  - Render the active session's title in the chat area header instead of the hardcoded `"Active Session Stream"`.
- **"Write Code" Button Removal & "Scan Workspace" Auto-Post**:
  - Remove the "Write Code" button from the JSX.
  - Modify `handleSend` to accept an optional parameter `overrideInput?: string`. If specified, it uses this text and directly posts it without clearing the standard text input.
  - Update the "Scan Workspace" button to trigger `handleSend("Scan all workspace files and summarize their contents.")` directly.
- **Chat Context & Token Progress**:
  - Add `getContextTokenCount()` helper to estimate token usage (~4 characters per token) across current messages and current draft input.
  - Render a progress bar showing context capacity usage (based on a 2,048 token limit) and print the token count right below the chat input box.

---

## Verification Plan

### Automated/Manual Verification
1. Rebuild and restart the Docker stack.
2. Open the UI, create a new session, type a message, and verify that the AI-generated title updates in the header.
3. Click "Scan Workspace" and verify that it immediately submits the message and scans the mounted filesystem, returning a summary of the files.
4. Verify that the "Write Code" button is no longer present.
5. Enter some messages and verify that the context progress bar and token count dynamically update below the chat input.
