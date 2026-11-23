from typing import Annotated, Sequence, TypedDict, Any
import operator
from langchain_core.messages import BaseMessage

class AgentState(TypedDict, total=False):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    session_id: str
    workspace_path: str
    is_complete: bool
    provider: str
    api_key: str
    model_slug: str
    base_url: str
    model_used: str

