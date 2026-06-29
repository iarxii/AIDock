from typing import Annotated, Sequence, TypedDict, Any
import operator
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    session_id: str
    workspace_path: str
    is_complete: bool
    provider: str
    api_key: str

