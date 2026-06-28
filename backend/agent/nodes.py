import os
import re
import time
import logging
import requests
from pathlib import Path
import dotenv
from backend.agent.state import AgentState
from langchain_core.messages import AIMessage, ToolMessage
from langchain_ollama import ChatOllama

logger = logging.getLogger("aidock.agent.nodes")

# Load .env looking upwards from this file
dotenv.load_dotenv(dotenv.find_dotenv())

def init_node(state: AgentState):
    """Initialize the workspace for this session."""
    session_id = state.get("session_id", "default_session")
    # Base workspace path from Docker mount
    base_workspace = Path("/workspace")
    
    # Create isolated sub-folder for this chat cycle
    project_workspace = base_workspace / session_id
    project_workspace.mkdir(parents=True, exist_ok=True)
    
    return {"workspace_path": str(project_workspace)}

def reason_node(state: AgentState):
    """Reasoning node that calls the local LLM."""
    # Detect if running inside a Docker container
    in_docker = os.path.exists('/.dockerenv') or Path('/workspace').exists()
    
    # Default model-runner base URL: internal DNS in Docker, localhost on the host
    default_base_url = "http://model-runner.docker.internal" if in_docker else "http://localhost:12434"
    base_url = os.getenv("LLM_BASE_URL", default_base_url)
    
    # Prefer per-request model slug if provided (validated), else resolve env
    # Simple cache for allowed models list to avoid frequent API calls
    _models_cache: dict = globals().get("_models_cache") or {"ts": 0, "models": []}

    def fetch_allowed_slugs() -> list:
        # Priority: explicit env var LLM_ALLOWED_MODELS (comma separated)
        env_list = os.getenv("LLM_ALLOWED_MODELS")
        if env_list:
            return [s.strip() for s in env_list.split(",") if s.strip()]

        # Next priority: server-managed whitelist file
        wl_file = os.getenv("LLM_WHITELIST_FILE", "./backend/llm_whitelist.json")
        try:
            p = Path(wl_file)
            if p.exists():
                data = p.read_text(encoding="utf-8")
                import json
                parsed = json.loads(data)
                if isinstance(parsed, list):
                    return [s for s in parsed if isinstance(s, str)]
        except Exception as e:
            logger.debug(f"Failed reading whitelist file {wl_file}: {e}")

        api_url = os.getenv("CODEXSPACE_API_URL")
        api_key = os.getenv("CODEXSPACE_API_KEY")
        if not api_url or not api_key:
            return []

        # Cache for 60 seconds
        now = time.time()
        if _models_cache.get("ts", 0) + 60 > now and _models_cache.get("models"):
            return _models_cache["models"]

        try:
            resp = requests.get(f"{api_url.rstrip('/')}/models", headers={"Authorization": f"Bearer {api_key}"}, timeout=5)
            resp.raise_for_status()
            data = resp.json()
            slugs = []
            for item in data:
                if isinstance(item, dict) and "slug" in item:
                    slugs.append(item["slug"])
                elif isinstance(item, str):
                    slugs.append(item)
            _models_cache["ts"] = now
            _models_cache["models"] = slugs
            globals()["_models_cache"] = _models_cache
            return slugs
        except Exception as e:
            logger.warning(f"Could not fetch allowed slugs from CodexSpace: {e}")
            return []

    def is_valid_slug(slug: str) -> bool:
        # Allow patterns like owner/model or owner/model:tag with safe chars
        pattern = r'^[a-z0-9._-]+/[a-z0-9._-]+(:[A-Za-z0-9._-]+)?$'
        if not re.match(pattern, slug):
            return False

        # If there's an explicit allow-list, require membership
        allowed = fetch_allowed_slugs()
        if allowed:
            return slug in allowed

        # No allow-list configured; accept on pattern match only
        return True

    model = None
    model_slug = state.get("model_slug")
    if model_slug and isinstance(model_slug, str) and is_valid_slug(model_slug):
        # Use the provided slug directly; ChatOllama is expected to accept
        # recognized model identifiers. If your CodexSpace returns docker
        # image names, pass them as-is via the `model` parameter.
        model = model_slug

    if not model:
        # Fall back to configured environment variables
        model = os.getenv("LLM_MODEL_NAME")
        if not model:
            image = os.getenv("LLM_IMAGE", "ai/mistral:7B-Q4_K_M")
            model = f"docker.io/{image}"

    llm = ChatOllama(model=model, base_url=base_url)
    
    # In a full implementation, bind tools here:
    # llm_with_tools = llm.bind_tools(tools)
    
    logger.info(f"LLM Reasoning - invoking model: {model} with {len(state['messages'])} messages...")
    response = llm.invoke(state["messages"])
    logger.info(f"LLM Reasoning - model response received (length: {len(response.content)} chars)")
    return {"messages": [response], "is_complete": True} # Placeholder for completeness check
