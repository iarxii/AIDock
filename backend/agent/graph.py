from langgraph.graph import StateGraph, END
from langgraph.prebuilt import tools_condition
from backend.agent.state import AgentState
from backend.agent.nodes import init_node, reason_node, call_tools_node

def create_agent_graph():
    """
    Creates and compiles the AIDock agent graph.
    """
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("init", init_node)
    workflow.add_node("reason", reason_node)
    workflow.add_node("tools", call_tools_node)
    
    # Set entry point
    workflow.set_entry_point("init")
    
    # Init -> Reason
    workflow.add_edge("init", "reason")
    
    # Reason -> tools or END based on tools condition
    workflow.add_conditional_edges(
        "reason",
        tools_condition,
        {
            "tools": "tools",
            END: END
        }
    )
    
    # tools -> Reason
    workflow.add_edge("tools", "reason")
    
    # In a production environment, we would pass AsyncPostgresSaver here
    # from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
    
    return workflow.compile()
