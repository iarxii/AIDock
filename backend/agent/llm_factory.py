import logging
import os
from typing import Optional
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger("aidock.agent.llm_factory")

OPENAI_COMPATIBLE_DEFAULTS = {
    "nvidia": ("https://integrate.api.nvidia.com/v1", "NVIDIA_API_KEY", "meta/llama-3.1-70b-instruct"),
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
    "workers_ai": ("https://api.cloudflare.com/client/v4/accounts", "CLOUDFLARE_API_KEY", "@cf/meta/llama-3-8b-instruct"),
    "cloudflare_ai_gateway": ("https://gateway.ai.cloudflare.com", "CLOUDFLARE_API_KEY", "default"),
}

def normalize_endpoint_url(url: Optional[str]) -> Optional[str]:
    """
    Normalizes local loopback addresses (127.0.0.1, localhost, 0.0.0.0)
    to 'host.docker.internal' when running inside a Docker container,
    so that host services (such as Ollama or vLLM running on the host machine)
    can be reached from the backend container.
    """
    if not url:
        return url
    in_docker = os.getenv("CONTAINER_MODE") == "true" or os.path.exists('/.dockerenv') or os.path.exists('/workspace')
    if not in_docker:
        return url

    try:
        from urllib.parse import urlsplit, urlunsplit
        parts = urlsplit(url)
        if parts.hostname in ("127.0.0.1", "localhost", "0.0.0.0"):
            port_str = f":{parts.port}" if parts.port else ""
            netloc = f"host.docker.internal{port_str}"
            if parts.username or parts.password:
                auth = parts.username or ""
                if parts.password:
                    auth += f":{parts.password}"
                netloc = f"{auth}@{netloc}"
            return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))
    except Exception as e:
        logger.debug(f"Failed to normalize endpoint url '{url}': {e}")
    return url

def resolve_local_model_tag(requested_name: str, base_url: str) -> str:
    """
    Resolves a display name (like 'Gemma4 E4B') or short tag to the actual model tag registered in the local engine.
    """
    active_env_image = os.getenv("LLM_IMAGE", "").strip()
    active_env_model = os.getenv("LLM_MODEL_NAME", "").strip()

    if not requested_name:
        if active_env_model:
            return active_env_model
        if active_env_image:
            return f"docker.io/{active_env_image}" if not active_env_image.startswith("docker.io/") else active_env_image
        return "docker.io/ai/mistral:7B-Q4_K_M"
        
    try:
        import requests
        base_url_norm = normalize_endpoint_url(base_url) or base_url
        url = base_url_norm.rstrip('/') + '/api/tags'
        r = requests.get(url, timeout=2)
        if r.status_code == 200:
            models = r.json().get("models", [])
            # 1. Exact match
            for m in models:
                tag = m.get("name") or m.get("model")
                if tag == requested_name:
                    return tag
            # 2. Normalized match (e.g. "Gemma4 E4B" -> "docker.io/ai/gemma4:E4B")
            req_norm = requested_name.lower().replace(" ", "").replace(":", "").replace("-", "").replace("_", "")
            for m in models:
                tag = m.get("name") or m.get("model") or ""
                tag_norm = tag.lower().replace(" ", "").replace(":", "").replace("-", "").replace("_", "")
                if req_norm in tag_norm or tag_norm in req_norm:
                    return tag
            # 3. If single model exists in tags
            if len(models) == 1:
                return models[0].get("name") or models[0].get("model")
    except Exception as e:
        logger.debug(f"Failed querying local tags: {e}")
        
    # If no local tag match, fall back to active configured image if it matches requested name
    if active_env_image and (requested_name.lower() in active_env_image.lower() or active_env_image.lower() in requested_name.lower()):
        return f"docker.io/{active_env_image}" if not active_env_image.startswith("docker.io/") else active_env_image

    return requested_name

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
        raw_base_url = base_url or os.getenv("LLM_BASE_URL", default_base_url)
        resolved_base_url = normalize_endpoint_url(raw_base_url)
        resolved_model = resolve_local_model_tag(model_name, resolved_base_url)
        logger.info(f"Local LLM resolved model tag: '{resolved_model}' from request: '{model_name}' on {resolved_base_url}")
        return ChatOllama(
            model=resolved_model,
            base_url=resolved_base_url,
            temperature=temperature,
            client_kwargs={"timeout": 120.0}
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
                openai_api_base=normalize_endpoint_url(base_url),
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
        raw_endpoint = base_url or default_url
        endpoint = normalize_endpoint_url(raw_endpoint)
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
        if base_url:
            return ChatOpenAI(
                model=model_name or "default",
                openai_api_key=api_key or "placeholder",
                openai_api_base=normalize_endpoint_url(base_url),
                temperature=temperature
            )
        elif api_key:
            raise ValueError(f"Custom provider '{provider}' requires an endpoint base_url to be configured.")
        in_docker = os.getenv("CONTAINER_MODE") == "true" or os.path.exists('/.dockerenv') or os.path.exists('/workspace')
        default_base_url = "http://model-runner.docker.internal" if in_docker else "http://localhost:12434"
        return ChatOllama(
            model=model_name or "docker.io/ai/mistral:7B-Q4_K_M",
            base_url=default_base_url,
            temperature=temperature
        )
