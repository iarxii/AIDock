from langgraph.graph import StateGraph, END
from backend.agent.state import AgentState
from backend.agent.nodes import init_node, reason_node

def create_agent_graph():
    """
    Creates and compiles the AIDock agent graph.
    """
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("init", init_node)
    workflow.add_node("reason", reason_node)
    
    # Set entry point
    workflow.set_entry_point("init")
    
    # Init -> Reason
    workflow.add_edge("init", "reason")
    
    # Reason -> END (Simplified for now)
    workflow.add_edge("reason", END)
    
    # In a production environment, we would pass AsyncPostgresSaver here
    # from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
    
    return workflow.compile()
