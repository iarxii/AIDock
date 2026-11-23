import os
import subprocess
import sys
from pathlib import Path
import click
import questionary
from rich.console import Console
from dotenv import set_key
import requests

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

console = Console()
ROOT_DIR = Path(__file__).parent.parent
ENV_FILE = ROOT_DIR / ".env"
PULL_LIST_FILE = ROOT_DIR / "DockerModel_PullList.txt"

def get_locally_available_models() -> set:
    """
    Fetch all locally available docker images and docker models in batch,
    returning a set of normalized tags/identifiers for instant lookup.
    """
    available = set()
    try:
        res = subprocess.run(
            ["docker", "images", "--format", "{{.Repository}}:{{.Tag}}"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if res.returncode == 0:
            for line in res.stdout.splitlines():
                t = line.strip().lower()
                if t and "<none>" not in t:
                    available.add(t)
                    if "/" in t:
                        available.add(t.split("/")[-1])
    except Exception:
        pass

    try:
        res_m = subprocess.run(
            ["docker", "model", "ls"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if res_m.returncode == 0:
            for line in res_m.stdout.splitlines()[1:]:
                parts = line.split()
                if parts and parts[0] != "<none>":
                    name = parts[0].strip().lower()
                    available.add(name)
                    available.add(f"ai/{name}")
                    available.add(f"docker.io/{name}")
                    available.add(f"docker.io/ai/{name}")
    except Exception:
        pass

    return available

def is_model_in_available_set(image: str, available_set: set) -> bool:
    """Check if a model image tag is present in the pre-fetched available set."""
    img = image.lower().strip()
    if img in available_set:
        return True
    for prefix in ["docker.io/", "ai/"]:
        if img.startswith(prefix) and img[len(prefix):] in available_set:
            return True
    tag = img.split("/")[-1]
    if tag in available_set:
        return True
    return False

def is_model_pulled(image: str) -> bool:
    """Check if a docker image or docker model is already available locally (single image lookup)."""
    available_set = get_locally_available_models()
    return is_model_in_available_set(image, available_set)

def print_active_model_banner(prefix: str = "Active Docker LLM Model Engine"):
    """Display a clear, prominent panel detailing the loaded LLM model and engine configuration."""
    import dotenv
    from rich.panel import Panel
    from rich.table import Table

    dotenv.load_dotenv(str(ENV_FILE), override=True)
    llm_image = os.getenv("LLM_IMAGE", "ai/mistral:7B-Q4_K_M")
    llm_model_name = os.getenv("LLM_MODEL_NAME", llm_image.split("/")[-1].split(":")[0])
    llm_base_url = os.getenv("LLM_BASE_URL", "http://model-runner.docker.internal")

    running_models = []
    try:
        res = subprocess.run(["docker", "model", "ls"], capture_output=True, text=True, timeout=3)
        if res.returncode == 0:
            for line in res.stdout.splitlines()[1:]:
                parts = line.split()
                if parts and parts[0] != "<none>":
                    running_models.append(parts[0])
    except Exception:
        pass

    if running_models:
        runner_detail = f"[bold green]Active in Runner:[/] {', '.join(running_models)}"
    else:
        runner_detail = "[dim]Standby (loaded in Docker Model Runner on container start)[/]"

    table = Table.grid(padding=(0, 2))
    table.add_column("Field", style="bold cyan")
    table.add_column("Value", style="white")

    table.add_row("Service Target:", "models: llm (docker-compose.yml)")
    table.add_row("Configured Image:", f"[bold green]{llm_image}[/]  (LLM_IMAGE in .env)")
    table.add_row("Resolved Model Tag:", f"[bold yellow]{llm_model_name}[/]  (LLM_MODEL_NAME in .env)")
    table.add_row("Runner Endpoint:", f"[blue]{llm_base_url}[/]  (Port 12434 internal)")
    table.add_row("Context Window:", "2048 tokens")
    table.add_row("Model Runner State:", runner_detail)
    table.add_row("Backend Mapping:", f"LLM_MODEL_NAME=docker.io/{llm_image}")

    console.print(Panel(table, title=f"[bold cyan]{prefix}[/]", border_style="cyan"))

def categorize_model(image: str) -> str:
    """Infer functional category for model tags."""
    img = image.lower()
    if "diffusion" in img:
        return "IMAGE-GEN"
    if any(k in img for k in ["vl", "omni", "moondream", "smolvlm"]):
        return "VISION/MM"
    if "medgemma" in img:
        return "MEDICAL"
    if any(k in img for k in ["thinking", "reasoning", "r1"]):
        return "REASONING"
    if any(k in img for k in ["nano", "micro", "tiny", "1.7b", "2b"]):
        return "LIGHTWEIGHT"
    if "coder" in img or "coding" in img:
        return "CODING"
    return "GENERAL"

def load_docker_models_list():
    """Parse DockerModel_PullList.txt and extract structured model entries."""
    if not PULL_LIST_FILE.exists():
        return []
    
    entries = []
    lines = PULL_LIST_FILE.read_text(encoding="utf-8").splitlines()
    for line in lines:
        cleaned = line.strip()
        if not cleaned or cleaned.startswith("#"):
            continue
        cmd_type = "docker"
        image = cleaned
        if cleaned.startswith("docker model pull"):
            cmd_type = "model"
            image = cleaned[len("docker model pull"):].strip()
        elif cleaned.startswith("docker pull"):
            cmd_type = "docker"
            image = cleaned[len("docker pull"):].strip()
            
        parts = image.split("/")[-1]
        short_name = parts.split(":")[0]
        entries.append({
            "raw": cleaned,
            "cmd_type": cmd_type,
            "image": image,
            "tag": parts,
            "short_name": short_name,
            "category": categorize_model(image)
        })
    return entries

def pull_docker_model(target_image: str, cmd_type: str = "docker") -> bool:
    """Execute docker model pull with fallback to standard docker pull."""
    pull_cmd = ["docker", "model", "pull", target_image] if cmd_type == "model" else ["docker", "pull", target_image]
    console.print(f"\n[bold blue]Pulling Docker Model:[/] [cyan]{' '.join(pull_cmd)}[/]")
    pull_proc = subprocess.run(pull_cmd)
    if pull_proc.returncode != 0:
        alt_cmd = ["docker", "pull", target_image] if cmd_type == "model" else ["docker", "model", "pull", target_image]
        console.print(f"[yellow]Retrying with alternative command:[/] {' '.join(alt_cmd)}")
        pull_proc = subprocess.run(alt_cmd)

    if pull_proc.returncode == 0:
        console.print(f"[green]✓ Successfully verified/pulled model:[/] [bold]{target_image}[/]")
        return True
    else:
        console.print(f"[bold red]Warning:[/] Model pull returned non-zero code. Proceeding with configuration update...")
        return False

def get_model_profiles():
    """Build dynamic agent / category model bundles reading directly from DockerModel_PullList.txt."""
    entries = load_docker_models_list()
    pull_list_imgs = [e["image"] for e in entries]

    profiles = {
        "all": {
            "title": "All Models (Full Docker PullList - 37 models)",
            "models": pull_list_imgs
        },
        "general": {
            "title": "General Purpose / Instruct",
            "models": [e["image"] for e in entries if e["category"] == "GENERAL"] + [m for m in ["ai/gemma4:E4B", "ai/mistral:7B-Q4_K_M"] if m not in pull_list_imgs]
        },
        "reasoning": {
            "title": "Reasoning & Thinking (Qwen Thinking, Ministral Reasoning)",
            "models": [e["image"] for e in entries if e["category"] == "REASONING"]
        },
        "coding": {
            "title": "Coding & Software Engineering",
            "models": [e["image"] for e in entries if e["category"] in ["CODING", "REASONING"] or any(k in e["image"].lower() for k in ["code", "granite"])]
        },
        "lightweight": {
            "title": "Lightweight & Edge (1.7B - 4B, LFM, Nano, Micro)",
            "models": [e["image"] for e in entries if e["category"] == "LIGHTWEIGHT"]
        },
        "vision": {
            "title": "Vision & Multimodal (LFM Omni/VL, SmolVLM, Moondream)",
            "models": [e["image"] for e in entries if e["category"] == "VISION/MM"]
        },
        "medical": {
            "title": "Medical & Clinical (MedGemma)",
            "models": [e["image"] for e in entries if e["category"] == "MEDICAL"]
        },
        "image_gen": {
            "title": "Image Generation (Stable Diffusion)",
            "models": [e["image"] for e in entries if e["category"] == "IMAGE-GEN"]
        },
    }
    return profiles

PROFILES = {
    "general": ["ai/mistral:7B-Q4_K_M", "ai/gemma4:E4B"],
    "coding": ["ai/deepseek-r1-distill-llama:8B-Q4_0", "ai/granite-4.0-h-tiny:7B"],
    "data_analyst": ["ai/qwen3.5:9B-UD-Q4_K_XL"],
    "business_analyst": ["ai/ministral3:8B"],
    "fin_trader": ["ai/qwen3-reranker-vllm:4B"],
    "sci_tech": ["ai/qwen3-vl:8B"],
    "art_gen": ["ai/stable-diffusion:Q4"],
    "researcher": ["ai/mistral:7B-Q4_K_M"]
}

def is_in_container() -> bool:
    return os.getenv("CONTAINER_MODE") == "true" or os.path.exists("/.dockerenv")

def assert_host_only(command_name: str):
    if is_in_container():
        console.print(f"[bold red]Error:[/] The command '{command_name}' is host-only and cannot be executed inside the AIDock container.", style="red")
        sys.exit(1)

def get_active_session_id() -> str:
    cwd = Path.cwd()
    if cwd.name.startswith("session_"):
        return cwd.name
    if cwd.parent.name.startswith("session_"):
        return cwd.parent.name
    return "session_cli_harness"

def check_docker():
    """Check if Docker daemon is running."""
    if is_in_container():
        return
    try:
        result = subprocess.run(["docker", "info"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
        if result.returncode != 0:
            console.print("[bold red]Error:[/] Docker is not running. Please start Docker Desktop.", style="red")
            sys.exit(1)
        console.print("[green]✓[/] Docker is running.")
    except subprocess.TimeoutExpired:
        console.print("[bold red]Error:[/] Docker Desktop is unresponsive (timed out). Please restart Docker Desktop.", style="red")
        sys.exit(1)
    except FileNotFoundError:
        console.print("[bold red]Error:[/] Docker is not installed or not in PATH.", style="red")
        sys.exit(1)

def get_service_url(service_name, container_port):
    """Resolve the host-mapped URL for a docker-compose service."""
    try:
        result = subprocess.run(
            ["docker", "compose", "port", service_name, str(container_port)],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True
        )
        if result.returncode == 0 and result.stdout.strip():
            output = result.stdout.strip()
            if ":" in output:
                port = output.split(":")[-1]
                return f"http://localhost:{port}"
    except Exception:
        pass
    return None

@click.group(invoke_without_command=True)
@click.pass_context
def cli(ctx):
    """AIDock CLI: Streamlined Local LLM Workspace Manager"""
    if ctx.invoked_subcommand is None:
        interactive_menu(ctx)

@cli.command()
@click.pass_context
def setup(ctx):
    """Interactive setup for workspace and profile with dynamic Docker models."""
    assert_host_only("setup")
    console.print("[bold blue]Welcome to AIDock Setup[/]")
    check_docker()

    default_workspace = str(Path.home() / "spiritbird_aidock")
    workspace_path = questionary.text(
        "Enter the absolute path for your Authoritative Workspace Root:",
        default=default_workspace
    ).ask()
    
    if not workspace_path:
        sys.exit(1)

    workspace_dir = Path(workspace_path)
    if not workspace_dir.exists():
        if questionary.confirm(f"Directory {workspace_path} does not exist. Create it?").ask():
            workspace_dir.mkdir(parents=True, exist_ok=True)
            console.print(f"[green]✓ Created directory:[/] {workspace_path}")
        else:
            console.print("[red]Setup aborted.[/]")
            sys.exit(1)
    
    if not ENV_FILE.exists():
        ENV_FILE.touch()
    
    set_key(str(ENV_FILE), "WORKSPACE_MOUNT_PATH", str(workspace_dir.absolute()))
    console.print(f"[green]✓ Workspace path saved to .env[/]")

    with console.status("[bold cyan]Scanning local Docker models and images...[/]"):
        available_set = get_locally_available_models()

    entries = load_docker_models_list()
    profiles = get_model_profiles()

    selected_model = None
    agent_choice = None

    # Loop to allow going back between Category and Model selection
    while True:
        category_choices = [
            questionary.Choice(title=f"{data['title']} ({len(data['models'])} models)", value=cat_key)
            for cat_key, data in profiles.items()
        ]

        agent_choice = questionary.select(
            "Select a CodexSpace Agent / Category:",
            choices=category_choices
        ).ask()
        
        if not agent_choice:
            sys.exit(1)
            
        models_bundle = profiles[agent_choice]["models"]
        back_option = "⬅ Back to Categories"
        
        model_choices = [questionary.Choice(back_option, value="__back__")]
        for img in models_bundle:
            pulled = is_model_in_available_set(img, available_set)
            status_tag = "[Pulled]" if pulled else "[Available]"
            cat_tag = categorize_model(img)
            label = f"{img:<40} [{cat_tag:<11}] {status_tag}"
            model_choices.append(questionary.Choice(title=label, value=img))

        model_choice = questionary.select(
            f"Select a Model for {profiles[agent_choice]['title']}:",
            choices=model_choices
        ).ask()
        
        if model_choice == "__back__":
            continue # Loop restarts, going back to Agent selection
        elif not model_choice:
            sys.exit(1)
            
        selected_model = model_choice
        break # Valid model selected, break the loop

    matching_entry = next((e for e in entries if e["image"].lower() == selected_model.lower()), None)
    cmd_type = matching_entry["cmd_type"] if matching_entry else ("model" if "docker model" in selected_model else "docker")

    is_already_pulled = is_model_in_available_set(selected_model, available_set)
    if not is_already_pulled:
        if questionary.confirm(f"Model '{selected_model}' is not yet pulled locally. Pull now?", default=True).ask():
            pull_docker_model(selected_model, cmd_type)
        
    set_key(str(ENV_FILE), "LLM_IMAGE", selected_model)
    simple_model_name = selected_model.split('/')[-1].split(':')[0]
    set_key(str(ENV_FILE), "LLM_MODEL_NAME", simple_model_name)
    
    console.print(f"[green]✓ Profile '{agent_choice}' selected. Configured active model: [bold]{selected_model}[/][/]\n")
    print_active_model_banner("AIDock Setup - Configured Model Engine")

    boot_now = questionary.confirm("Start / Boot AIDock containers now with this configuration?", default=True).ask()
    if boot_now:
        ctx.invoke(start)
    else:
        console.print("\n[bold green]Setup Complete![/] Run `./aidock.bat start` (Windows) or `./aidock.sh start` (Mac/Linux) to spin up the environment.")

@cli.command()
def start():
    """Start the AIDock Docker Compose stack."""
    assert_host_only("start")
    check_docker()
    if not ENV_FILE.exists():
        console.print("[red]Error:[/] .env file not found. Please run `aidock setup` first.")
        sys.exit(1)
        
    print_active_model_banner("Starting AIDock Stack with Active Model Engine")
    console.print("[blue]Starting AIDock...[/]")
    result = subprocess.run(["docker", "compose", "up", "-d", "--build"], cwd=ROOT_DIR)
    
    if result.returncode != 0:
        console.print("[bold red]Error:[/] Failed to start the Docker Compose stack. Please review the output above for errors.", style="red")
        sys.exit(1)
        
    console.print("[blue]Waiting for services to initialize...[/]")
    import time
    time.sleep(3)
    
    client_url = get_service_url("client", 80)
    backend_url = get_service_url("backend", 8080)
    
    if not client_url or not backend_url:
        console.print("[bold red]Error:[/] Some services failed to start or expose ports. See status below:")
        subprocess.run(["docker", "compose", "ps"], cwd=ROOT_DIR)
        sys.exit(1)
        
    console.print("[green]✓ AIDock is running successfully![/]")
    console.print(f"  - [bold]Frontend UI:[/] {client_url}")
    console.print(f"  - [bold]Backend API:[/] {backend_url}")
    print_active_model_banner("Active Docker Model Engine Loaded")

@cli.command()
def stop():
    """Stop the AIDock Docker Compose stack."""
    assert_host_only("stop")
    check_docker()
    console.print("[blue]Stopping AIDock...[/]")
    subprocess.run(["docker", "compose", "down"], cwd=ROOT_DIR)
    console.print("[green]✓ AIDock stopped.[/]")

@cli.command()
def prune():
    """Prune unused Docker images and models."""
    assert_host_only("prune")
    check_docker()
    if questionary.confirm("This will remove unused Docker images to free up disk space. Continue?").ask():
        subprocess.run(["docker", "image", "prune", "-a", "-f"])
        console.print("[green]✓ Pruning complete.[/]")

@cli.command()
@click.option('--fe', is_flag=True, help="Reload only the frontend container (client)")
@click.option('--be', is_flag=True, help="Reload only the backend container")
@click.option('--db', is_flag=True, help="Reload only the database container")
@click.pass_context
def reload(ctx, fe, be, db):
    """Reload AIDock: Stop containers, rebuild, and restart (or reload specific service)."""
    assert_host_only("reload")
    check_docker()
    print_active_model_banner("Reloading AIDock Services")
    if fe or be or db:
        service_name = None
        service_label = None
        if fe:
            service_name = "client"
            service_label = "Frontend (client)"
        elif be:
            service_name = "backend"
            service_label = "Backend"
        elif db:
            service_name = "db"
            service_label = "Database (db)"
            
        console.print(f"\n[bold blue]Reloading {service_label} service...[/]")
        subprocess.run(["docker", "compose", "stop", service_name], cwd=ROOT_DIR)
        subprocess.run(["docker", "compose", "up", "-d", "--build", service_name], cwd=ROOT_DIR)
        console.print(f"[green]✓ {service_label} service reloaded successfully.[/]")
        print_active_model_banner(f"{service_label} Reloaded - Active Engine Status")
        return

    console.print("\n[bold blue]Reloading AIDock...[/]")
    ctx.invoke(stop)
    ctx.invoke(start)

@cli.command(name="dockerbuild")
@click.argument("service", required=False, default=None)
@click.option("--no-cache", is_flag=True, help="Do not use cache when building the image.")
@click.option("--boot", is_flag=True, help="Boot (start) the stack immediately after build completes.")
@click.pass_context
def dockerbuild_cmd(ctx, service, no_cache, boot):
    """Build Docker Compose service images with options for target, cache, and auto-boot."""
    assert_host_only("dockerbuild")
    check_docker()

    target_service = service
    use_no_cache = no_cache
    auto_boot = boot

    if not target_service:
        target_service = questionary.select(
            "Which service would you like to build?",
            choices=[
                questionary.Choice("All Services (client + backend + db)", value="all"),
                questionary.Choice("Frontend Client (client)", value="client"),
                questionary.Choice("Backend Engine (backend)", value="backend"),
                questionary.Choice("Database (db)", value="db")
            ]
        ).ask()
        if not target_service:
            console.print("[yellow]Build cancelled.[/]")
            return

        if not no_cache:
            use_no_cache = questionary.confirm("Clean build without cache (--no-cache)?", default=False).ask()

        if not boot:
            auto_boot = questionary.confirm("Boot / start containers immediately after build?", default=True).ask()

    # Map aliases
    if target_service in ["fe", "frontend"]:
        target_service = "client"
    elif target_service in ["be"]:
        target_service = "backend"

    print_active_model_banner("Active Docker LLM Model Engine for Build")

    build_cmd = ["docker", "compose", "build"]
    if use_no_cache:
        build_cmd.append("--no-cache")
    if target_service and target_service != "all":
        build_cmd.append(target_service)

    console.print(f"\n[bold blue]Executing Docker Build:[/] [cyan]{' '.join(build_cmd)}[/]")
    proc = subprocess.run(build_cmd, cwd=ROOT_DIR)
    if proc.returncode != 0:
        console.print("[bold red]Error:[/] Docker build failed. Review output above.", style="red")
        sys.exit(1)

    console.print("[bold green]✓ Docker build completed successfully![/]")

    if auto_boot:
        console.print("\n[blue]Booting containers with updated images...[/]")
        up_cmd = ["docker", "compose", "up", "-d"]
        if target_service and target_service != "all":
            up_cmd.append(target_service)
        subprocess.run(up_cmd, cwd=ROOT_DIR)
        console.print("[bold green]✓ Containers are up and running.[/]")

        client_url = get_service_url("client", 80)
        backend_url = get_service_url("backend", 8080)
        if client_url:
            console.print(f"  - [bold]Frontend UI:[/] {client_url}")
        if backend_url:
            console.print(f"  - [bold]Backend API:[/] {backend_url}")

    print_active_model_banner("Docker LLM Model Engine Status")

@cli.command(name="models")
@click.argument("model_name", required=False, default=None)
@click.option("--boot", is_flag=True, help="Boot (start) the AIDock stack after setting the model.")
@click.option("--reboot", is_flag=True, help="Reboot (rebuild & restart) the AIDock stack after setting the model.")
@click.pass_context
def models_cmd(ctx, model_name, boot, reboot):
    """Select and pull models from DockerModel_PullList.txt, then boot or reboot."""
    assert_host_only("models")
    check_docker()

    entries = load_docker_models_list()
    if not entries:
        console.print("[red]Error:[/] DockerModel_PullList.txt not found or empty in project root.")
        sys.exit(1)

    selected_entry = None
    if model_name:
        req = model_name.strip().lower()
        for e in entries:
            if req in [e["image"].lower(), e["tag"].lower(), e["short_name"].lower()]:
                selected_entry = e
                break
        if not selected_entry:
            console.print(f"[yellow]Note:[/] '{model_name}' not in PullList. Using custom image tag '{model_name}'.")
            selected_entry = {
                "raw": f"docker pull {model_name}",
                "cmd_type": "docker",
                "image": model_name,
                "tag": model_name.split("/")[-1],
                "short_name": model_name.split("/")[-1].split(":")[0],
                "category": categorize_model(model_name)
            }
    else:
        with console.status("[bold cyan]Scanning local Docker models and images...[/]"):
            available_set = get_locally_available_models()

        choices = []
        for e in entries:
            pulled = is_model_in_available_set(e["image"], available_set)
            status_tag = "[Pulled]" if pulled else "[Available]"
            label = f"{e['image']:<38} [{e['category']:<11}] {status_tag}"
            choices.append(questionary.Choice(title=label, value=e))

        selected_entry = questionary.select(
            "Select a Docker Model from PullList:",
            choices=choices
        ).ask()

        if not selected_entry:
            console.print("[yellow]Model selection cancelled.[/]")
            return

    target_image = selected_entry["image"]
    cmd_type = selected_entry["cmd_type"]
    pull_docker_model(target_image, cmd_type)

    if not ENV_FILE.exists():
        ENV_FILE.touch()
    set_key(str(ENV_FILE), "LLM_IMAGE", target_image)
    simple_model_name = selected_entry["short_name"]
    set_key(str(ENV_FILE), "LLM_MODEL_NAME", simple_model_name)
    console.print(f"[green]✓ Updated .env: LLM_IMAGE={target_image}, LLM_MODEL_NAME={simple_model_name}[/]\n")
    print_active_model_banner("Active Docker LLM Model Engine Updated")

    action = None
    if boot:
        action = "boot"
    elif reboot:
        action = "reboot"
    else:
        action = questionary.select(
            "What would you like to do next?",
            choices=[
                questionary.Choice("Boot (Start Docker Compose stack now)", value="boot"),
                questionary.Choice("Reboot (Rebuild and restart stack)", value="reboot"),
                questionary.Choice("Stay current (Just save to .env, do not restart)", value="stay")
            ]
        ).ask()

    if action == "boot":
        ctx.invoke(start)
    elif action == "reboot":
        ctx.invoke(reload)
    else:
        console.print("[green]Configuration saved. You can start AIDock whenever you're ready with `aidock start` or `aidock reload`.[/]")

@cli.command(name="docker-models", hidden=True)
@click.pass_context
def docker_models_alias(ctx, **kwargs):
    """Alias for 'models'."""
    ctx.forward(models_cmd)

@cli.command(name="cli")
@click.option('--session', default=None, help="Specific session ID to bind to.")
@click.pass_context
def launch_cli(ctx, session):
    """Launch the interactive Harness CLI (alias for chat)."""
    ctx.invoke(chat, session=session)

@cli.command()
@click.option('--session', default=None, help="Specific session ID to bind to.")
def chat(session):
    """Start an interactive agent chat session harness."""
    import dotenv
    dotenv.load_dotenv(str(ENV_FILE))
    
    try:
        art_path = ROOT_DIR / "cli" / "spiritbird-ascii-art.txt"
        if art_path.exists():
            art = art_path.read_text(encoding="utf-8")
            console.print(f"[bold blue]{art}[/]")
            console.print("[bold cyan]========================================================================[/]")
            console.print("[bold cyan]            AIDOCK - Isolated LLM Workspace Harness[/]")
            console.print("[bold cyan]========================================================================[/]")
    except Exception:
        pass

    session_id = session or get_active_session_id()
    backend_url = get_service_url("backend", 8080) or "http://localhost:8080"
    
    console.print(f"[bold blue]AIDock Developer Harness - Interactive Chat[/]")
    console.print(f"Active Session: [green]{session_id}[/]")
    console.print("Type [bold yellow]/help[/] to view slash commands, [bold yellow]/exit[/] or [bold yellow]/quit[/] to quit.\n")
    
    # Try fetching model info from backend
    active_model = "Unknown"
    try:
        r = requests.get(f"{backend_url}/info", timeout=2)
        if r.status_code == 200:
            active_model = r.json().get("model_name", "Unknown")
    except Exception:
        pass
        
    current_provider = os.getenv("LLM_PROVIDER", "local")
    current_model = active_model
    
    console.print(f"Agent Model: [cyan]{current_model}[/]")
    console.print(f"Active Provider: [cyan]{current_provider}[/]\n")
    
    while True:
        try:
            user_input = questionary.text("User >").ask()
            if user_input is None:
                break
            user_input = user_input.strip()
            if not user_input:
                continue
                
            if user_input.startswith("/"):
                parts = user_input.split()
                cmd = parts[0].lower()
                if cmd in ["/exit", "/quit"]:
                    console.print("[yellow]Exiting chat session.[/]")
                    break
                elif cmd == "/clear":
                    click.clear()
                    console.print(f"[bold blue]AIDock Developer Harness - Interactive Chat[/]")
                    console.print(f"Active Session: [green]{session_id}[/]")
                    console.print(f"Agent Model: [cyan]{current_model}[/]")
                    console.print(f"Active Provider: [cyan]{current_provider}[/]\n")
                    continue
                elif cmd == "/provider":
                    if len(parts) < 2:
                        console.print(f"Current Provider: [cyan]{current_provider}[/]")
                        console.print("To change: /provider <local|gemini|groq|openrouter>")
                    else:
                        new_prov = parts[1].lower().strip()
                        if new_prov in ["local", "gemini", "google", "groq", "openrouter"]:
                            current_provider = "gemini" if new_prov == "google" else new_prov
                            console.print(f"[green]✓ Provider switched to:[/] {current_provider}")
                        else:
                            console.print("[red]Invalid provider. Available: local, gemini, groq, openrouter[/]")
                    continue
                elif cmd == "/model":
                    if len(parts) < 2:
                        console.print(f"Current Model: [cyan]{current_model or 'Default'}[/]")
                        console.print("To change: /model <model_slug>")
                        try:
                            models_r = requests.get(f"{backend_url}/models/local", timeout=2)
                            available = models_r.json().get("models", [])
                            console.print("Available Local Models Whitelist:")
                            for m in available:
                                console.print(f"  - {m}")
                        except Exception:
                            pass
                    else:
                        current_model = parts[1].strip()
                        console.print(f"[green]✓ Model switched to:[/] {current_model}")
                    continue
                elif cmd == "/token":
                    if len(parts) < 2:
                        token_preview = (os.getenv("CLOUD_TOKEN") or "None")[:15] + "..." if os.getenv("CLOUD_TOKEN") else "None"
                        console.print(f"Current Cloud Token: [cyan]{token_preview}[/]")
                        console.print("To set: /token <jwt_token>")
                    else:
                        new_token = parts[1].strip()
                        os.environ["CLOUD_TOKEN"] = new_token
                        from dotenv import set_key
                        set_key(str(ENV_FILE), "CLOUD_TOKEN", new_token)
                        console.print("[green]✓ Cloud token updated and saved to .env[/]")
                    continue
                elif cmd == "/api_url":
                    if len(parts) < 2:
                        console.print(f"Current Cloud API URL: [cyan]{os.getenv('CLOUD_API_URL') or 'None'}[/]")
                        console.print("To set: /api_url <url>")
                    else:
                        new_url = parts[1].strip()
                        os.environ["CLOUD_API_URL"] = new_url
                        from dotenv import set_key
                        set_key(str(ENV_FILE), "CLOUD_API_URL", new_url)
                        console.print("[green]✓ Cloud API URL updated and saved to .env[/]")
                    continue
                elif cmd == "/files":
                    try:
                        r = requests.get(f"{backend_url}/files?session_id={session_id}", timeout=2)
                        files_list = r.json().get("files", [])
                        if not files_list:
                            console.print("[yellow]Workspace is empty.[/]")
                        else:
                            console.print("[bold green]Workspace Files:[/]")
                            for f in files_list:
                                console.print(f"  - {f['path']} ({f['size']} bytes)")
                    except Exception as e:
                        console.print(f"[red]Error listing files: {e}[/]")
                    continue
                elif cmd == "/skills":
                    skills_dir = ROOT_DIR / "backend" / "agent" / "skills" / "situational"
                    if not skills_dir.exists():
                        console.print("[yellow]No situational skills directory found.[/]")
                    else:
                        console.print("[bold green]Available Agent Skills:[/]")
                        for f in skills_dir.glob("*.md"):
                            console.print(f"  - {f.stem}")
                        console.print("\nTo invoke a skill, type: [bold yellow]/skill <skill_name> [optional instructions][/]")
                    continue
                elif cmd == "/skill":
                    if len(parts) < 2:
                        console.print("Usage: /skill <skill_name> [optional instructions]")
                        continue
                    skill_name = parts[1].strip()
                    extra_instructions = " ".join(parts[2:]).strip()
                    
                    skills_dir = ROOT_DIR / "backend" / "agent" / "skills" / "situational"
                    skill_file = skills_dir / f"{skill_name}.md"
                    if not skill_file.exists():
                        console.print(f"[red]Skill '{skill_name}' not found. Type /skills to see available skills.[/]")
                        continue
                        
                    try:
                        skill_content = skill_file.read_text(encoding="utf-8")
                        prompt = f"Invoke Skill: {skill_name}\n\n{skill_content}"
                        if extra_instructions:
                            prompt += f"\n\nAdditional user instructions:\n{extra_instructions}"
                            
                        console.print(f"[blue]Invoking skill '{skill_name}'...[/]")
                        user_input = prompt
                    except Exception as e:
                        console.print(f"[red]Error loading skill: {e}[/]")
                        continue
                elif cmd == "/help":
                    console.print("[bold cyan]Slash Commands:[/]")
                    console.print("  /provider <name> - Show or set active CodexSpace provider (local, gemini, groq, openrouter)")
                    console.print("  /model <name>    - Show or set active model")
                    console.print("  /token <jwt>     - Show or set cloud JWT auth token")
                    console.print("  /api_url <url>   - Show or set cloud base API URL")
                    console.print("  /skills          - List all available situational agent skills")
                    console.print("  /skill <name> [inst] - Invoke a specific skill with optional instructions")
                    console.print("  /files           - List files in current workspace session")
                    console.print("  /clear           - Clear the screen")
                    console.print("  /exit            - Exit the interactive chat")
                    continue
                else:
                    console.print(f"[red]Unknown command: {cmd}. Type /help for assistance.[/]")
                    continue
            
            with console.status("[blue]Agent is thinking...[/]"):
                try:
                    payload = {
                        "message": user_input,
                        "session_id": session_id,
                        "provider": current_provider,
                        "model_slug": current_model if current_model != "Unknown" else None
                    }
                    cloud_token = os.getenv("CLOUD_TOKEN")
                    cloud_api_url = os.getenv("CLOUD_API_URL", "https://api.aicodex.dev")
                    
                    if current_provider != "local":
                        if cloud_token:
                            payload["cloud_token"] = cloud_token
                        payload["cloud_api_url"] = cloud_api_url
                        
                    res = requests.post(
                        f"{backend_url}/chat",
                        json=payload,
                        timeout=120
                    )
                    if res.status_code == 200:
                        data = res.json()
                        response_text = data.get("response", "")
                        console.print("\n[bold cyan]AIDock Agent:[/]")
                        from rich.markdown import Markdown
                        console.print(Markdown(response_text))
                        console.print()
                    else:
                        console.print(f"[bold red]Error:[/] Server returned code {res.status_code}: {res.text}", style="red")
                except Exception as e:
                    console.print(f"[bold red]Error:[/] Failed to reach backend: {e}", style="red")
        except (KeyboardInterrupt, EOFError):
            console.print("\n[yellow]Exiting chat session.[/]")
            break

@cli.command()
@click.argument('prompt')
@click.option('--session', default=None, help="Session ID to use.")
def run(prompt, session):
    """Execute a single prompt/task with the active agent harness."""
    session_id = session or get_active_session_id()
    backend_url = get_service_url("backend", 8080) or "http://localhost:8080"
    console.print(f"[bold blue]Running task on session '{session_id}':[/] {prompt}")
    
    with console.status("[blue]Executing...[/]"):
        try:
            res = requests.post(
                f"{backend_url}/chat",
                json={"message": prompt, "session_id": session_id},
                timeout=120
            )
            if res.status_code == 200:
                data = res.json()
                response_text = data.get("response", "")
                console.print("\n[bold cyan]Response:[/]")
                from rich.markdown import Markdown
                console.print(Markdown(response_text))
            else:
                console.print(f"[bold red]Error:[/] Server returned code {res.status_code}: {res.text}", style="red")
                sys.exit(1)
        except Exception as e:
            console.print(f"[bold red]Error:[/] Failed to reach backend: {e}", style="red")
            sys.exit(1)

@cli.command()
@click.option('--session', default=None, help="Session ID to inspect.")
def status(session):
    """Display the active workspace status and configurations."""
    session_id = session or get_active_session_id()
    backend_url = get_service_url("backend", 8080) or "http://localhost:8080"
    console.print("[bold blue]AIDock System Status[/]")
    console.print(f"Current Workspace Session ID: [green]{session_id}[/]")
    print_active_model_banner("Active Docker LLM Model Engine")
    
    try:
        r = requests.get(f"{backend_url}/health", timeout=2)
        health = r.json().get("status", "unknown")
        console.print(f"Backend API Status: [green]Active ({health})[/]")
    except Exception:
        console.print("Backend API Status: [red]Offline / Unreachable[/]")
        
    try:
        r = requests.get(f"{backend_url}/info", timeout=2)
        if r.status_code == 200:
            model = r.json().get("model_name", "Unknown")
            console.print(f"Active LLM Model: [cyan]{model}[/]")
    except Exception:
        pass
        
    try:
        r = requests.get(f"{backend_url}/files?session_id={session_id}", timeout=2)
        files_list = r.json().get("files", [])
        console.print(f"Workspace Files count: [yellow]{len(files_list)}[/]")
    except Exception:
        pass

def find_pi_binary() -> Path:
    env_bin = os.getenv("PI_CLI_PATH")
    if env_bin and Path(env_bin).exists():
        return Path(env_bin)

    bin_name = "pi-cli.exe" if os.name == "nt" else "pi-cli"
    candidate_paths = [
        ROOT_DIR.parent / "AI_Codex" / "cli" / "packages" / "coding-agent" / "dist" / bin_name,
        ROOT_DIR / "bin" / bin_name,
    ]
    for candidate in candidate_paths:
        if candidate.exists():
            return candidate.absolute()

    import shutil
    sys_path = shutil.which("pi-cli") or shutil.which("pi-cli.exe")
    if sys_path:
        return Path(sys_path)

    return None

@cli.command(context_settings=dict(ignore_unknown_options=True), name="agent")
@click.argument('args', nargs=-1, type=click.UNPROCESSED)
def agent_cmd(args):
    """Launch the standalone Pi-CLI Coding Agent executable."""
    pi_bin = find_pi_binary()
    if not pi_bin:
        console.print("[bold red]Error:[/] Could not locate pi-cli executable. Please build it first or set PI_CLI_PATH.", style="red")
        sys.exit(1)

    import dotenv
    dotenv.load_dotenv(str(ENV_FILE))

    env = os.environ.copy()

    # Configure state directories
    global_home = os.getenv("AICODEX_HOME") or str(Path.home() / ".aicodex")
    local_cache = os.getenv("AICODEX_LOCAL_CACHE") or str(Path.cwd() / ".aidock_cache")

    Path(global_home).mkdir(parents=True, exist_ok=True)
    Path(local_cache).mkdir(parents=True, exist_ok=True)

    env["AICODEX_HOME"] = global_home
    env["AICODEX_LOCAL_CACHE"] = local_cache

    cmd = [str(pi_bin)] + list(args)
    console.print(f"[bold blue]Spawning Pi-CLI Agent:[/] {' '.join(cmd)}")
    console.print(f"  [cyan]AICODEX_HOME:[/] {global_home}")
    console.print(f"  [cyan]AICODEX_LOCAL_CACHE:[/] {local_cache}\n")

    try:
        proc = subprocess.run(cmd, env=env, cwd=os.getcwd())
        sys.exit(proc.returncode)
    except Exception as e:
        console.print(f"[bold red]Error executing pi-cli:[/] {e}", style="red")
        sys.exit(1)

@cli.command(context_settings=dict(ignore_unknown_options=True), name="pi")
@click.argument('args', nargs=-1, type=click.UNPROCESSED)
@click.pass_context
def pi_cmd(ctx, args):
    """Alias for 'agent' - Launch Pi-CLI binary."""
    ctx.invoke(agent_cmd, args=args)

def interactive_menu(ctx):
    """Looping interactive categorized menu launched when no CLI arguments are provided."""
    assert_host_only("interactive_menu")

    try:
        art_path = ROOT_DIR / "cli" / "spiritbird-ascii-art.txt"
        if art_path.exists():
            art = art_path.read_text(encoding="utf-8")
            console.print(f"[bold blue]{art}[/]")
    except Exception:
        pass

    while True:
        try:
            import dotenv
            dotenv.load_dotenv(str(ENV_FILE), override=True)
            active_model = os.getenv("LLM_IMAGE", "ai/mistral:7B-Q4_K_M")
            workspace = os.getenv("WORKSPACE_MOUNT_PATH", "Not configured")

            console.print("\n[bold cyan]========================================================================[/]")
            console.print("[bold cyan]                 AIDOCK - Local AI Workspace Manager[/]")
            console.print("[bold cyan]========================================================================[/]")
            console.print(f"Active Model: [bold green]{active_model}[/] | Workspace: [bold yellow]{workspace}[/]\n")

            choices = [
                questionary.Separator("── DOCKER MANAGEMENT ──────────────────────────"),
                questionary.Choice("Start Stack (start)               - Bring up AIDock containers", value="start"),
                questionary.Choice("Stop Stack (stop)                 - Stop all running AIDock containers", value="stop"),
                questionary.Choice("Build Containers (dockerbuild)    - Build Docker images (all, fe, be)", value="dockerbuild"),
                questionary.Choice("Reload Services (reload)          - Rebuild and restart containers", value="reload"),
                questionary.Choice("System Status (status)            - Check health, active model, and files", value="status"),

                questionary.Separator("── DOCKER MODELS (MODEL RUNNER) ───────────────"),
                questionary.Choice("Docker Models (models)            - Pick from PullList & Boot / Reboot", value="models"),

                questionary.Separator("── AGENT CHAT & HARNESS ───────────────────────"),
                questionary.Choice("Interactive Chat (chat / cli)     - Full interactive terminal chat session", value="chat"),
                questionary.Choice("Run Single Prompt (run)           - Execute a single prompt and exit", value="run"),
                questionary.Choice("Pi-CLI Coding Agent (agent / pi)  - Launch standalone Pi-CLI binary", value="agent"),

                questionary.Separator("── SETUP & MAINTENANCE ────────────────────────"),
                questionary.Choice("Setup Workspace (setup)           - Interactive workspace & profile setup", value="setup"),
                questionary.Choice("Prune Cache (prune)               - Remove unused Docker images & cache", value="prune"),
                questionary.Choice("Exit                              - Exit AIDock CLI", value="exit"),
            ]

            action = questionary.select(
                "Select an AIDock action to run:",
                choices=choices
            ).ask()

            if not action or action == "exit":
                console.print("[yellow]Exiting AIDock CLI. Goodbye![/]")
                break

            try:
                if action == "start":
                    ctx.invoke(start)
                elif action == "stop":
                    ctx.invoke(stop)
                elif action == "dockerbuild":
                    ctx.invoke(dockerbuild_cmd)
                elif action == "reload":
                    ctx.invoke(reload)
                elif action == "status":
                    ctx.invoke(status)
                elif action == "models":
                    ctx.invoke(models_cmd)
                elif action == "chat":
                    ctx.invoke(chat)
                elif action == "run":
                    prompt = questionary.text("Enter prompt/task to run:").ask()
                    if prompt:
                        ctx.invoke(run, prompt=prompt)
                elif action == "agent":
                    ctx.invoke(agent_cmd, args=())
                elif action == "setup":
                    ctx.invoke(setup)
                elif action == "prune":
                    ctx.invoke(prune)
            except SystemExit:
                pass
            except KeyboardInterrupt:
                console.print("\n[yellow]Action cancelled by user.[/]")

            console.print("\n[dim]─" * 72 + "[/dim]")
            questionary.press_any_key_to_continue("Press any key to return to menu...").ask()

        except (KeyboardInterrupt, EOFError):
            console.print("\n[yellow]Exiting AIDock CLI. Goodbye![/]")
            break

if __name__ == "__main__":
    cli()

