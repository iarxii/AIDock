import logging
import os
from typing import Optional
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger("aidock.agent.llm_factory")

def get_llm(provider: str, model: str, api_key: Optional[str] = None, temperature: float = 0.3):
    """
    Unified LLM factory for AIDock agent execution.
    Supports local Ollama, Gemini, Groq, and OpenRouter.
    """
    provider = (provider or "local").lower().strip()
    model_name = (model or "").strip()

    # Normalization: Map google to gemini
    if provider == "google":
        provider = "gemini"

    # Default fallback models
    if not model_name:
        if provider == "local":
            model_name = os.getenv("LLM_MODEL_NAME")
            if not model_name:
                image = os.getenv("LLM_IMAGE", "ai/mistral:7B-Q4_K_M")
                model_name = f"docker.io/{image}"
        elif provider == "gemini":
            model_name = "gemini-1.5-flash"
        elif provider == "groq":
            model_name = "llama-3.3-70b-versatile"
        elif provider == "openrouter":
            model_name = "meta-llama/llama-3-8b-instruct"
        else:
            model_name = "gemma"

    logger.info(f"Initializing LLM: provider={provider}, model={model_name}, temperature={temperature}")

    if provider == "local":
        in_docker = os.getenv("CONTAINER_MODE") == "true" or os.path.exists('/.dockerenv') or os.path.exists('/workspace')
        default_base_url = "http://model-runner.docker.internal" if in_docker else "http://localhost:12434"
        base_url = os.getenv("LLM_BASE_URL", default_base_url)
        return ChatOllama(
            model=model_name,
            base_url=base_url,
            temperature=temperature
        )

    elif provider == "groq":
        key = api_key or os.getenv("GROQ_API_KEY")
        if not key:
            raise ValueError("Groq API key is missing. Set GROQ_API_KEY environment variable or pass it in settings.")
        return ChatOpenAI(
            model=model_name,
            openai_api_key=key,
            openai_api_base="https://api.groq.com/openai/v1",
            temperature=temperature
        )

    elif provider == "openrouter":
        key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not key:
            raise ValueError("OpenRouter API key is missing. Set OPENROUTER_API_KEY environment variable or pass it in settings.")
        return ChatOpenAI(
            model=model_name,
            openai_api_key=key,
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=temperature
        )

    elif provider == "gemini":
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise ValueError("Gemini API key is missing. Set GEMINI_API_KEY environment variable or pass it in settings.")
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=key,
            temperature=temperature
        )

    else:
        logger.warning(f"Unknown LLM provider: {provider}. Falling back to Local Ollama.")
        in_docker = os.getenv("CONTAINER_MODE") == "true" or os.path.exists('/.dockerenv') or os.path.exists('/workspace')
        default_base_url = "http://model-runner.docker.internal" if in_docker else "http://localhost:12434"
        base_url = os.getenv("LLM_BASE_URL", default_base_url)
        return ChatOllama(
            model="docker.io/ai/gemma4:E4B",
            base_url=base_url,
            temperature=temperature
        )
