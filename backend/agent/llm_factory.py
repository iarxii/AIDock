import logging
import os
from typing import Optional
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger("aidock.agent.llm_factory")

OPENAI_COMPATIBLE_DEFAULTS = {
    "openai": ("https://api.openai.com/v1", "OPENAI_API_KEY", "gpt-4o"),
    "groq": ("https://api.groq.com/openai/v1", "GROQ_API_KEY", "llama-3.3-70b-versatile"),
    "openrouter": ("https://openrouter.ai/api/v1", "OPENROUTER_API_KEY", "meta-llama/llama-3.3-70b-instruct"),
    "deepseek": ("https://api.deepseek.com/v1", "DEEPSEEK_API_KEY", "deepseek-chat"),
    "xai": ("https://api.x.ai/v1", "XAI_API_KEY", "grok-2-1212"),
    "together": ("https://api.together.xyz/v1", "TOGETHER_API_KEY", "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"),
    "fireworks": ("https://api.fireworks.ai/inference/v1", "FIREWORKS_API_KEY", "accounts/fireworks/models/llama-v3p1-70b-instruct"),
    "mistral": ("https://api.mistral.ai/v1", "MISTRAL_API_KEY", "mistral-large-latest"),
    "perplexity": ("https://api.perplexity.ai", "PERPLEXITY_API_KEY", "sonar-pro"),
    "cohere": ("https://api.cohere.com/v1", "COHERE_API_KEY", "command-r-plus"),
    "cerebras": ("https://api.cerebras.ai/v1", "CEREBRAS_API_KEY", "llama3.1-70b"),
    "ollama_cloud": ("https://ollama.com/v1", "OLLAMA_API_KEY", "llama3.3"),
    "azure": ("", "AZURE_OPENAI_API_KEY", "gpt-4o"),
}

def get_llm(provider: str, model: str, api_key: Optional[str] = None, base_url: Optional[str] = None, temperature: float = 0.3):
    """
    Unified LLM factory for AIDock agent execution.
    Supports local Ollama/llama-server and all Cloud BYOK providers (OpenAI, Gemini, Groq, OpenRouter, DeepSeek, Anthropic, etc.).
    """
    provider = (provider or "local").lower().strip()
    model_name = (model or "").strip()

    # Normalization: Map google to gemini
    if provider == "google":
        provider = "gemini"

    logger.info(f"Initializing LLM: provider={provider}, model={model_name}, has_key={bool(api_key)}, base_url={base_url}, temperature={temperature}")

    if provider == "local":
        in_docker = os.getenv("CONTAINER_MODE") == "true" or os.path.exists('/.dockerenv') or os.path.exists('/workspace')
        default_base_url = "http://model-runner.docker.internal" if in_docker else "http://localhost:12434"
        resolved_base_url = base_url or os.getenv("LLM_BASE_URL", default_base_url)
        if not model_name:
            model_name = os.getenv("LLM_MODEL_NAME")
            if not model_name:
                image = os.getenv("LLM_IMAGE", "ai/mistral:7B-Q4_K_M")
                model_name = f"docker.io/{image}"
        return ChatOllama(
            model=model_name,
            base_url=resolved_base_url,
            temperature=temperature
        )

    elif provider == "gemini":
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise ValueError("Gemini API key is missing. Set GEMINI_API_KEY environment variable or pass it in Provider Settings.")
        return ChatGoogleGenerativeAI(
            model=model_name or "gemini-1.5-flash",
            google_api_key=key,
            temperature=temperature
        )

    elif provider == "anthropic":
        key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not key:
            raise ValueError("Anthropic API key is missing. Set ANTHROPIC_API_KEY environment variable or pass it in Provider Settings.")
        # If a custom base_url is supplied (e.g., OpenRouter or gateway proxy), use ChatOpenAI
        if base_url:
            return ChatOpenAI(
                model=model_name or "claude-3-5-sonnet-20241022",
                openai_api_key=key,
                openai_api_base=base_url,
                temperature=temperature
            )
        try:
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                model=model_name or "claude-3-5-sonnet-20241022",
                anthropic_api_key=key,
                temperature=temperature
            )
        except ImportError:
            # Fallback to OpenRouter route for Anthropic if native SDK not installed
            logger.info("langchain_anthropic not present, using OpenRouter gateway for Anthropic")
            return ChatOpenAI(
                model=f"anthropic/{model_name or 'claude-3.5-sonnet'}",
                openai_api_key=key,
                openai_api_base="https://openrouter.ai/api/v1",
                temperature=temperature
            )

    elif provider in OPENAI_COMPATIBLE_DEFAULTS:
        default_url, env_key, default_model = OPENAI_COMPATIBLE_DEFAULTS[provider]
        key = api_key or os.getenv(env_key)
        endpoint = base_url or default_url
        if not key and provider != "ollama_cloud":
            raise ValueError(f"{provider.capitalize()} API key is missing. Set {env_key} environment variable or configure it in Provider Settings.")
        return ChatOpenAI(
            model=model_name or default_model,
            openai_api_key=key or "placeholder",
            openai_api_base=endpoint,
            temperature=temperature
        )

    else:
        logger.warning(f"Unknown or custom LLM provider: '{provider}'. Checking base_url or falling back to Local Ollama.")
        if base_url or api_key:
            return ChatOpenAI(
                model=model_name or "default",
                openai_api_key=api_key or "placeholder",
                openai_api_base=base_url or "http://localhost:8000/v1",
                temperature=temperature
            )
        in_docker = os.getenv("CONTAINER_MODE") == "true" or os.path.exists('/.dockerenv') or os.path.exists('/workspace')
        default_base_url = "http://model-runner.docker.internal" if in_docker else "http://localhost:12434"
        return ChatOllama(
            model=model_name or "docker.io/ai/mistral:7B-Q4_K_M",
            base_url=default_base_url,
            temperature=temperature
        )
