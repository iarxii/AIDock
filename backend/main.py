import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.db.session import init_db
from backend.agent.graph import create_agent_graph
from langchain_core.messages import HumanMessage

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

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
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
        
        return {
            "response": last_message.content,
            "workspace_used": result.get("workspace_path")
        }
    except Exception as e:
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

@app.get("/health")
def health_check():
    return {"status": "ok"}
