# Walkthrough - Hybrid Cloud-Local Workspace Orchestrator

We have successfully designed, implemented, and verified the **Hybrid Cloud-Local Architecture** for the AIDock system. This addresses the hardware constraint issue by allowing remote LLM providers (such as Gemini, Groq, or OpenRouter) to handle reasoning, while executing tool-calls locally on the Docker `/workspace` volume mount.

---

## Changes Made

### 1. Unified Multi-Provider LLM Factory
- **File**: [llm_factory.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/agent/llm_factory.py) [NEW]
- **Details**:
  - Implemented `get_llm(provider, model, api_key)` to dynamically instantiate:
    - **Local**: `ChatOllama` targeting the internal Docker service at `model-runner.docker.internal` or local `12434`.
    - **Gemini**: `ChatGoogleGenerativeAI` with Google API credentials.
    - **Groq & OpenRouter**: `ChatOpenAI` pointing to the respective remote endpoint bases (`api.groq.com` or `openrouter.ai`).

### 2. State & Node Credential Propagation
- **Files**: 
  - [state.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/agent/state.py) [MODIFY]
  - [nodes.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/agent/nodes.py) [MODIFY]
- **Details**:
  - Extended `AgentState` type definitions to include `provider` and `api_key` string values.
  - Refactored `reason_node` to resolve and invoke models through the `llm_factory.get_llm()` instead of hardcoded Ollama endpoints, matching the client's preferred provider/key config.

### 3. Backend Routing & Auto-Resolving Cloud Keys
- **File**: [main.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/main.py) [MODIFY]
- **Details**:
  - Extended `ChatRequest` schema with `provider`, `api_key`, `cloud_token`, and `cloud_api_url`.
  - Implemented auto-lookup in `chat_endpoint`: if the user uses a cloud provider and has a valid `cloud_token` but has not entered a local key, the backend automatically calls the remote AICodex user info endpoint (`/api/v1/auth/me`) using the token, extracts the stored API keys from their cloud profile settings, and injects the corresponding key into the inference loop.
  - Enhanced title generator `generate_local_chat_title` to use the cloud model (when active) for background generation to eliminate local model runner load.

### 4. Client API Dispatch & Routing
- **File**: [App.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx) [MODIFY]
- **Details**:
  - Added `'chat'` to the `localPrefixes` list in `getBackendUrl()`, forcing all chat dispatch calls to route through the local orchestrator API.
  - Refactored `handleSend()` to package and send selected cloud model slugs, provider IDs, active cloud JWTs, and the cloud base URL as part of the post body to the local backend.
  - The local backend acts as the secure execution gatekeeper, proxying LLM requests to cloud providers and handling volume workspace operations locally.

---

## Verification & Testing

### 1. Build Verification
- **Frontend Build**: Verified that Vite compiled successfully with zero compilation or TypeScript errors.
- **Docker Compose Status**: Executed `./aidock.bat start`, confirming all containers rebuilt and are healthy:
  ```
  NAME             IMAGE                    STATUS              PORTS
  aidock_backend   aidock-backend           Up 12 seconds       0.0.0.0:8080->8080/tcp
  aidock_client    aidock-client            Up 11 seconds       0.0.0.0:3000->80/tcp
  aidock_db        pgvector/pgvector:pg16   Up About a minute   0.0.0.0:5433->5432/tcp
  ```

### 2. End-to-End Chat Routing Flow
- The frontend client successfully connects to the local backend.
- When running in cloud mode, chat prompts trigger local backend endpoints.
- The local backend connects to the remote cloud provider for the reasoning path.
- When asked to inspect the directory, the model emits tool-calls which the local backend executes directly on the volume mount `/workspace/{session_id}`.
