import os
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

@app.get("/health")
def health_check():
    return {"status": "ok"}
