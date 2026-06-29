import os
import subprocess
import sys
from pathlib import Path
import click
import questionary
from rich.console import Console
from dotenv import set_key

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
        result = subprocess.run(["docker", "info"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if result.returncode != 0:
            console.print("[bold red]Error:[/] Docker is not running. Please start Docker Desktop.", style="red")
            sys.exit(1)
        console.print("[green]✓[/] Docker is running.")
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

@click.group()
def cli():
    """AIDock CLI: Streamlined Local LLM Workspace Manager"""
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

@cli.command()
def setup():
    """Interactive setup for workspace and profile."""
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

    # Loop to allow going back
    while True:
        # Select CodexSpace Agent
        agent_choice = questionary.select(
            "Select a CodexSpace Agent:",
            choices=list(PROFILES.keys())
        ).ask()
        
        if not agent_choice:
            sys.exit(1)
            
        # Select Model from bundle
        models_bundle = PROFILES[agent_choice]
        back_option = "⬅ Back to Agents"
        
        model_choice = questionary.select(
            f"Select a Model for {agent_choice}:",
            choices=[back_option] + models_bundle
        ).ask()
        
        if model_choice == back_option:
            continue # Loop restarts, going back to Agent selection
        elif not model_choice:
            sys.exit(1)
            
        break # Valid model selected, break the loop
        
    set_key(str(ENV_FILE), "LLM_IMAGE", model_choice)
    # Provide simple model name for backend inference references without the ai/ prefix
    simple_model_name = model_choice.split('/')[-1].split(':')[0]
    set_key(str(ENV_FILE), "LLM_MODEL_NAME", simple_model_name)
    
    console.print(f"[green]✓ Profile '{agent_choice}' selected. Docker will pull and run '{model_choice}'[/]")
    console.print("\n[bold green]Setup Complete![/] Run `./aidock.bat start` (Windows) or `./aidock.sh start` (Mac/Linux) to spin up the environment.")

@cli.command()
def start():
    """Start the AIDock Docker Compose stack."""
    assert_host_only("start")
    check_docker()
    if not ENV_FILE.exists():
        console.print("[red]Error:[/] .env file not found. Please run `aidock setup` first.")
        sys.exit(1)
        
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
        return

    console.print("\n[bold blue]Reloading AIDock...[/]")
    ctx.invoke(stop)
    ctx.invoke(start)

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
    session_id = session or get_active_session_id()
    
    console.print(f"[bold blue]AIDock Developer Harness - Interactive Chat[/]")
    console.print(f"Active Session: [green]{session_id}[/]")
    console.print("Type [bold yellow]/help[/] to view slash commands, [bold yellow]/exit[/] or [bold yellow]/quit[/] to quit.\n")
    
    # Try fetching model info from backend
    active_model = "Unknown"
    try:
        r = requests.get("http://localhost:8080/info", timeout=2)
        if r.status_code == 200:
            active_model = r.json().get("model_name", "Unknown")
    except Exception:
        pass
        
    console.print(f"Agent Model: [cyan]{active_model}[/]\n")
    
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
                    continue
                elif cmd == "/model":
                    try:
                        info_r = requests.get("http://localhost:8080/info", timeout=2)
                        active = info_r.json().get("model_name", "Unknown")
                        console.print(f"Active Model: [cyan]{active}[/]")
                        
                        models_r = requests.get("http://localhost:8080/models/local", timeout=2)
                        available = models_r.json().get("models", [])
                        console.print("Available Models:")
                        for m in available:
                            console.print(f"  - {m}")
                    except Exception as e:
                        console.print(f"[red]Error fetching models: {e}[/]")
                    continue
                elif cmd == "/files":
                    try:
                        r = requests.get(f"http://localhost:8080/files?session_id={session_id}", timeout=2)
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
                elif cmd == "/help":
                    console.print("[bold cyan]Slash Commands:[/]")
                    console.print("  /model  - Show active and available models")
                    console.print("  /files  - List files in current workspace session")
                    console.print("  /clear  - Clear the screen")
                    console.print("  /exit   - Exit the interactive chat")
                    continue
                else:
                    console.print(f"[red]Unknown command: {cmd}. Type /help for assistance.[/]")
                    continue
            
            with console.status("[blue]Agent is thinking...[/]"):
                try:
                    res = requests.post(
                        "http://localhost:8080/chat",
                        json={"message": user_input, "session_id": session_id},
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
    console.print(f"[bold blue]Running task on session '{session_id}':[/] {prompt}")
    
    with console.status("[blue]Executing...[/]"):
        try:
            res = requests.post(
                "http://localhost:8080/chat",
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
    console.print("[bold blue]AIDock System Status[/]")
    console.print(f"Current Workspace Session ID: [green]{session_id}[/]")
    
    try:
        r = requests.get("http://localhost:8080/health", timeout=2)
        health = r.json().get("status", "unknown")
        console.print(f"Backend API Status: [green]Active ({health})[/]")
    except Exception:
        console.print("Backend API Status: [red]Offline / Unreachable[/]")
        
    try:
        r = requests.get("http://localhost:8080/info", timeout=2)
        if r.status_code == 200:
            model = r.json().get("model_name", "Unknown")
            console.print(f"Active LLM Model: [cyan]{model}[/]")
    except Exception:
        pass
        
    try:
        r = requests.get(f"http://localhost:8080/files?session_id={session_id}", timeout=2)
        files_list = r.json().get("files", [])
        console.print(f"Workspace Files count: [yellow]{len(files_list)}[/]")
    except Exception:
        pass

if __name__ == "__main__":
    cli()
