import os
import logging
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
    
    # Resolve the model name
    model = os.getenv("LLM_MODEL_NAME")
    if not model:
        # Fall back to constructed name using LLM_IMAGE from .env if available
        image = os.getenv("LLM_IMAGE", "ai/mistral:7B-Q4_K_M")
        model = f"docker.io/{image}"
        
    llm = ChatOllama(
        model=model,
        base_url=base_url
    )
    
    # In a full implementation, bind tools here:
    # llm_with_tools = llm.bind_tools(tools)
    
    logger.info(f"LLM Reasoning - invoking model: {model} with {len(state['messages'])} messages...")
    response = llm.invoke(state["messages"])
    logger.info(f"LLM Reasoning - model response received (length: {len(response.content)} chars)")
    return {"messages": [response], "is_complete": True} # Placeholder for completeness check
