import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
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

class ExportRequest(BaseModel):
    session_id: str
    filename: str
    content: str

class LogRequest(BaseModel):
    level: str
    message: str

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
        # Initialize state with user message and session_id
        initial_state = {
            "messages": [HumanMessage(content=request.message)],
            "session_id": request.session_id
        }
        
        # Invoke LangGraph agent
        result = await graph.ainvoke(initial_state)
        
        # Get the last message
        last_message = result["messages"][-1]
        
        logger.info(f"Chat request succeeded - Session: {request.session_id} - Response length: {len(last_message.content)} chars")
        return {
            "response": last_message.content,
            "workspace_used": result.get("workspace_path")
        }
    except Exception as e:
        logger.error(f"Chat request failed - Session: {request.session_id} - Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

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
