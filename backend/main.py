import os
import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

try:
    import pty
    HAS_PTY = True
except ImportError:
    HAS_PTY = False
from typing import Optional
import requests
import json
from typing import List
from fastapi import Header
from fastapi import Request
from datetime import datetime
from backend.db.session import init_db
from backend.agent.graph import create_agent_graph
from langchain_core.messages import HumanMessage

# Configure backend logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("aidock.backend")
client_logger = logging.getLogger("aidock.client")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB (create pgvector extension etc.)
    await init_db()
    yield

app = FastAPI(title="AIDock Backend", lifespan=lifespan)
graph = create_agent_graph()

class ChatRequest(BaseModel):
    message: str
    session_id: str
    model_slug: Optional[str] = None
    provider: Optional[str] = None
    api_key: Optional[str] = None
    cloud_token: Optional[str] = None
    cloud_api_url: Optional[str] = None



class ExportRequest(BaseModel):
    session_id: str
    filename: str
    content: str

class LogRequest(BaseModel):
    level: str
    message: str


class WhitelistItem(BaseModel):
    slug: str


class WhitelistReplace(BaseModel):
    slugs: List[str]


def _whitelist_path() -> Path:
    return Path(os.getenv("LLM_WHITELIST_FILE", "./backend/llm_whitelist.json"))


def _read_whitelist() -> List[str]:
    p = _whitelist_path()
    if not p.exists():
        return []
    try:
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return [s for s in data if isinstance(s, str)]
    except Exception:
        return []
    return []


def _write_whitelist(slugs: List[str]):
    p = _whitelist_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(slugs, f, indent=2)


def _require_admin(admin_key: str = Header(None)):
    configured = os.getenv("ADMIN_API_KEY")
    if not configured:
        raise HTTPException(status_code=403, detail="Admin API key not configured on server")
    if not admin_key or admin_key != configured:
        raise HTTPException(status_code=403, detail="Invalid admin API key")
    return True


def _audit_log(action: str, slug: str | None, request: Request | None = None):
    try:
        audit_dir = Path(os.getenv("LLM_AUDIT_DIR", "./backend"))
        audit_dir.mkdir(parents=True, exist_ok=True)
        audit_path = audit_dir / "admin_audit.log"
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action,
            "slug": slug,
        }
        if request is not None:
            client = request.client.host if getattr(request, 'client', None) else None
            entry["client_ip"] = client
        with open(audit_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.warning(f"Failed to write audit log: {e}")

@app.post("/log")
def log_client_message(request: LogRequest):
    lvl = request.level.upper()
    msg = f"CLIENT: {request.message}"
    if lvl == "DEBUG":
        client_logger.debug(msg)
    elif lvl == "WARNING":
        client_logger.warning(msg)
    elif lvl == "ERROR":
        client_logger.error(msg)
    else:
        client_logger.info(msg)
    return {"status": "ok"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    logger.info(f"Chat request received - Session: {request.session_id} - Length: {len(request.message)} chars")
    try:
        provider = request.provider or "local"
        api_key = request.api_key
        
        # If in cloud mode and we have a cloud token, fetch keys from cloud
        if provider != "local" and not api_key and request.cloud_token and request.cloud_api_url:
            try:
                import requests
                headers = {"Authorization": f"Bearer {request.cloud_token}"}
                profile_url = f"{request.cloud_api_url.rstrip('/')}/api/v1/auth/me"
                resp = requests.get(profile_url, headers=headers, timeout=5)
                if resp.status_code == 200:
                    profile_data = resp.json()
                    settings_str = profile_data.get("settings")
                    if settings_str:
                        import json
                        settings_data = json.loads(settings_str)
                        api_keys = settings_data.get("api_keys", {})
                        # Normalize key resolution
                        resolved_prov = provider.lower().strip()
                        if resolved_prov == "google":
                            resolved_prov = "gemini"
                        api_key = api_keys.get(resolved_prov)
                        logger.info(f"Resolved cloud API key for provider '{provider}' from profile settings")
            except Exception as e:
                logger.warning(f"Failed to fetch cloud API keys from profile: {e}")

        # Initialize state with user message, session_id and optional model slug
        initial_state = {
            "messages": [HumanMessage(content=request.message)],
            "session_id": request.session_id,
            "model_slug": request.model_slug,
            "provider": provider,
            "api_key": api_key
        }
        
        project_workspace = Path("/workspace") / request.session_id
        project_workspace.mkdir(parents=True, exist_ok=True)
        metadata_path = project_workspace / "metadata.json"
        
        # Load past chat history from chat_history.json
        history_path = project_workspace / "chat_history.json"
        past_messages = []
        if history_path.exists():
            try:
                with open(history_path, "r", encoding="utf-8") as f:
                    past_messages = json.load(f).get("messages", [])
            except Exception:
                pass
                
        if not metadata_path.exists():
            asyncio.create_task(generate_local_chat_title(
                request.session_id, 
                request.message, 
                request.model_slug, 
                provider, 
                api_key
            ))
        
        # Invoke LangGraph agent
        result = await graph.ainvoke(initial_state)
        
        # Get the last message
        last_message = result["messages"][-1]
        
        # Save messages to history file
        user_msg = {
            "id": f"msg_user_{int(datetime.utcnow().timestamp() * 1000)}",
            "sender": "user",
            "content": request.message,
            "created_at": datetime.utcnow().isoformat()
        }
        bot_msg = {
            "id": f"msg_bot_{int(datetime.utcnow().timestamp() * 1000)}",
            "sender": "bot",
            "content": last_message.content,
            "workspaceUsed": result.get("workspace_path"),
            "created_at": datetime.utcnow().isoformat()
        }
        past_messages.append(user_msg)
        past_messages.append(bot_msg)
        with open(history_path, "w", encoding="utf-8") as f:
            json.dump({"messages": past_messages}, f, indent=2)
        
        logger.info(f"Chat request succeeded - Session: {request.session_id} - Response length: {len(last_message.content)} chars")
        return {
            "response": last_message.content,
            "workspace_used": result.get("workspace_path")
        }
    except Exception as e:
        logger.error(f"Chat request failed - Session: {request.session_id} - Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

async def generate_local_chat_title(session_id: str, first_message: str, model_slug: str = None, provider: str = None, api_key: str = None):
    """Generates a 3-5 word title using the configured model and saves it."""
    try:
        from backend.agent.llm_factory import get_llm
        from langchain_core.messages import HumanMessage
        
        provider = provider or "local"
        logger.info(f"Generating title for session {session_id} using provider {provider} and model {model_slug}")
        
        llm = get_llm(provider=provider, model=model_slug, api_key=api_key)
        prompt = f"Summarize the following text in a short 3-5 word title. Output ONLY the title, no quotes or prefix.\n\nText: {first_message}"
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        title = response.content.strip().strip('"').strip("'")
        
        if not title:
            title = "New Conversation"
            
        project_workspace = Path("/workspace") / session_id
        project_workspace.mkdir(parents=True, exist_ok=True)
        metadata_path = project_workspace / "metadata.json"
        
        metadata = {}
        if metadata_path.exists():
            with open(metadata_path, "r") as f:
                try:
                    metadata = json.load(f)
                except json.JSONDecodeError:
                    pass
                
        metadata["title"] = title
        metadata["created_at"] = datetime.utcnow().isoformat()
        
        with open(metadata_path, "w") as f:
            json.dump(metadata, f)
            
    except Exception as e:
        logger.error(f"Failed to generate title: {e}")

@app.get("/sessions")
async def list_local_sessions():
    """Returns a list of sessions matching the AICodex ConversationRead schema."""
    sessions = []
    base_workspace = Path("/workspace")
    if not base_workspace.exists():
        return sessions
        
    for d in base_workspace.iterdir():
        if d.is_dir() and d.name.startswith("session_"):
            metadata_path = d / "metadata.json"
            title = d.name
            created_at = datetime.utcnow().isoformat()
            if metadata_path.exists():
                try:
                    with open(metadata_path, "r") as f:
                        meta = json.load(f)
                        title = meta.get("title", title)
                        created_at = meta.get("created_at", created_at)
                except Exception:
                    pass
                    
            sessions.append({
                "id": 0,
                "session_id": d.name,
                "title": title,
                "created_at": created_at,
                "updated_at": created_at,
                "space_type": "local"
            })
            
    # Sort by created_at descending
    sessions.sort(key=lambda x: x["created_at"], reverse=True)
    return sessions

@app.get("/sessions/{session_id}/messages")
async def get_local_session_messages(session_id: str):
    """Loads and returns messages for a local session from chat_history.json."""
    history_path = Path("/workspace") / session_id / "chat_history.json"
    if not history_path.exists():
        return {"messages": []}
    try:
        with open(history_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"messages": []}

@app.post("/export")
async def export_endpoint(request: ExportRequest):
    try:
        base_workspace = Path("/workspace")
        project_workspace = base_workspace / request.session_id
        
        # Prevent directory traversal attacks by forcing the filename to be its basename
        safe_filename = Path(request.filename).name
        file_path = project_workspace / safe_filename
        
        # Ensure directories exist
        project_workspace.mkdir(parents=True, exist_ok=True)
        
        # Save file content
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(request.content)
            
        return {"status": "success", "file_path": str(file_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/files")
def list_files(session_id: str):
    try:
        base_workspace = Path("/workspace")
        project_workspace = base_workspace / session_id
        if not project_workspace.exists():
            return {"files": []}
        
        files = []
        for path in project_workspace.rglob("*"):
            if path.is_file():
                rel_path = path.relative_to(project_workspace)
                files.append({
                    "name": path.name,
                    "path": str(rel_path).replace("\\", "/"),
                    "size": path.stat().st_size
                })
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/file-content")
def get_file_content(session_id: str, path: str):
    try:
        base_workspace = Path("/workspace")
        project_workspace = base_workspace / session_id
        
        # Path traversal mitigation: resolve and verify boundary
        safe_path = (project_workspace / path).resolve()
        if not str(safe_path).startswith(str(project_workspace.resolve())):
            raise HTTPException(status_code=400, detail="Access denied")
            
        if not safe_path.exists() or not safe_path.is_file():
            raise HTTPException(status_code=404, detail="File not found")
            
        with open(safe_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_file(session_id: str, file: UploadFile = File(...)):
    try:
        base_workspace = Path("/workspace")
        project_workspace = base_workspace / session_id
        project_workspace.mkdir(parents=True, exist_ok=True)
        
        safe_filename = Path(file.filename).name
        file_path = project_workspace / safe_filename
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
            
        return {"status": "success", "file_name": safe_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/info")
def get_info():
    model = os.getenv("LLM_MODEL_NAME")
    if not model:
        image = os.getenv("LLM_IMAGE", "ai/mistral:7B-Q4_K_M")
        model = f"docker.io/{image}"
    
    clean_model_name = model
    if "/" in clean_model_name:
        clean_model_name = clean_model_name.split("/")[-1]
    
    # Capitalize cleanly (e.g. gemma4:E4B -> Gemma4 E4B)
    parts = clean_model_name.replace(":", " ").replace("-", " ").split()
    clean_model_name = " ".join([p.upper() if p.lower() in ["e4b", "e2b", "llm", "vl", "awq", "gguf"] else p.capitalize() for p in parts])
    
    return {
        "model_name": clean_model_name,
        "raw_model": model
    }

@app.get("/models/local")
def list_local_models():
    slugs = _read_whitelist()
    # Also add the currently active docker model if present
    model = os.getenv("LLM_MODEL_NAME")
    if not model:
        image = os.getenv("LLM_IMAGE", "ai/mistral:7B-Q4_K_M")
        model = f"docker.io/{image}"
    
    clean_model_name = model
    if "/" in clean_model_name:
        clean_model_name = clean_model_name.split("/")[-1]
    
    parts = clean_model_name.replace(":", " ").replace("-", " ").split()
    clean_model_name = " ".join([p.upper() if p.lower() in ["e4b", "e2b", "llm", "vl", "awq", "gguf"] else p.capitalize() for p in parts])
    
    if clean_model_name not in slugs:
        slugs.insert(0, clean_model_name)
        
    return {"models": slugs}


@app.get("/models")
def list_models():
    """List available CodexSpace model slugs (requires CODEXSPACE_API_URL and CODEXSPACE_API_KEY env vars)."""
    api_url = os.getenv("CODEXSPACE_API_URL")
    api_key = os.getenv("CODEXSPACE_API_KEY")
    if not api_url or not api_key:
        return {"models": [], "note": "CODEXSPACE_API_URL or CODEXSPACE_API_KEY not configured"}

    try:
        resp = requests.get(f"{api_url.rstrip('/')}/models", headers={"Authorization": f"Bearer {api_key}"}, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        # Expect data to be a list of model metadata; map to slugs if present
        slugs = []
        for item in data:
            if isinstance(item, dict) and "slug" in item:
                slugs.append(item["slug"])
            elif isinstance(item, str):
                slugs.append(item)

        return {"models": slugs}
    except Exception as e:
        logger.warning(f"Failed to fetch CodexSpace models: {e}")
        return {"models": [], "error": str(e)}


@app.get("/admin/whitelist")
def get_whitelist(request: Request, admin: bool = Header(None)):
    _require_admin(admin)
    slugs = _read_whitelist()
    _audit_log("list", None, request)
    return {"slugs": slugs}


@app.post("/admin/whitelist")
def add_whitelist(item: WhitelistItem, request: Request, admin: bool = Header(None)):
    _require_admin(admin)
    slugs = _read_whitelist()
    if item.slug not in slugs:
        slugs.append(item.slug)
        _write_whitelist(slugs)
        _audit_log("add", item.slug, request)
    return {"slugs": slugs}


@app.delete("/admin/whitelist")
def remove_whitelist(item: WhitelistItem, request: Request, admin: bool = Header(None)):
    _require_admin(admin)
    slugs = _read_whitelist()
    if item.slug in slugs:
        slugs = [s for s in slugs if s != item.slug]
        _write_whitelist(slugs)
        _audit_log("remove", item.slug, request)
    return {"slugs": slugs}


@app.put("/admin/whitelist")
def replace_whitelist(body: WhitelistReplace, request: Request, admin: bool = Header(None)):
    _require_admin(admin)
    # sanitize to list of strings
    slugs = [s for s in body.slugs if isinstance(s, str)]
    _write_whitelist(slugs)
    _audit_log("replace", None, request)
    return {"slugs": slugs}


@app.get("/admin/whitelist/audit")
def get_audit_log(request: Request, admin: bool = Header(None), limit: int = 100):
    _require_admin(admin)
    audit_path = Path(os.getenv("LLM_AUDIT_DIR", "./backend")) / "admin_audit.log"
    if not audit_path.exists():
        return {"entries": []}
    try:
        lines = audit_path.read_text(encoding="utf-8").strip().splitlines()
        entries = [json.loads(l) for l in lines if l.strip()]
        return {"entries": entries[-limit:]}
    except Exception as e:
        logger.warning(f"Failed to read audit log: {e}")
        return {"entries": []}


@app.websocket("/ws/terminal")
async def terminal_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    if not HAS_PTY:
        await websocket.send_text("\r\n[AIDock] Terminal error: PTY is not supported on this host operating system.\r\n")
        await websocket.close()
        return
        
    import struct
    try:
        import termios
        import fcntl
        HAS_TERMIOS = True
    except ImportError:
        HAS_TERMIOS = False
        
    master_fd, slave_fd = pty.openpty()
    
    workspace_dir = Path("/workspace") / session_id
    workspace_dir.mkdir(parents=True, exist_ok=True)
    
    # Defaults to our CLI Tool, drops to bash if exited
    cmd = ["bash", "-c", "python3 /app/cli/aidock.py; exec bash"]
    
    if HAS_TERMIOS:
        try:
            winsize = struct.pack("HHHH", 24, 80, 0, 0)
            fcntl.ioctl(master_fd, termios.TIOCSWINSZ, winsize)
        except Exception:
            pass
            
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=slave_fd,
        stdout=slave_fd,
        stderr=slave_fd,
        cwd=str(workspace_dir),
        env={
            **os.environ,
            "TERM": "xterm-color",
            "WORKSPACE_DIR": str(workspace_dir),
            "PYTHONPATH": "/app",
            "CONTAINER_MODE": "true"
        },
        preexec_fn=os.setsid
    )
    
    os.close(slave_fd)
    
    async def read_from_pty():
        loop = asyncio.get_event_loop()
        try:
            while True:
                data = await loop.run_in_executor(None, os.read, master_fd, 4096)
                if not data:
                    break
                await websocket.send_bytes(data)
        except Exception:
            pass
            
    async def write_to_pty():
        try:
            while True:
                msg = await websocket.receive()
                if "text" in msg:
                    text_data = msg["text"]
                    if text_data.startswith("{") and text_data.endswith("}"):
                        try:
                            parsed = json.loads(text_data)
                            if parsed.get("event") == "resize" and HAS_TERMIOS:
                                rows = parsed.get("rows", 24)
                                cols = parsed.get("cols", 80)
                                winsize = struct.pack("HHHH", rows, cols, 0, 0)
                                fcntl.ioctl(master_fd, termios.TIOCSWINSZ, winsize)
                                continue
                        except Exception:
                            pass
                    
                    os.write(master_fd, text_data.encode('utf-8'))
                elif "bytes" in msg:
                    os.write(master_fd, msg["bytes"])
        except Exception:
            pass

    read_task = asyncio.create_task(read_from_pty())
    write_task = asyncio.create_task(write_to_pty())
    
    try:
        await proc.wait()
    except Exception:
        pass
    finally:
        read_task.cancel()
        write_task.cancel()
        try:
            os.close(master_fd)
        except OSError:
            pass
        try:
            proc.terminate()
        except ProcessLookupError:
            pass
