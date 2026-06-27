import os
from pathlib import Path
from backend.agent.state import AgentState
from langchain_core.messages import AIMessage, ToolMessage
from langchain_ollama import ChatOllama

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
    llm = ChatOllama(
        model=os.getenv("LLM_MODEL_NAME", "mistral"),
        base_url=os.getenv("LLM_BASE_URL", "http://model-runner:8000/v1")
    )
    
    # In a full implementation, bind tools here:
    # llm_with_tools = llm.bind_tools(tools)
    
    response = llm.invoke(state["messages"])
    return {"messages": [response], "is_complete": True} # Placeholder for completeness check
