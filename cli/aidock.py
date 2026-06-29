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

def check_docker():
    """Check if Docker daemon is running."""
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
    pass

@cli.command()
def setup():
    """Interactive setup for workspace and profile."""
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
    check_docker()
    console.print("[blue]Stopping AIDock...[/]")
    subprocess.run(["docker", "compose", "down"], cwd=ROOT_DIR)
    console.print("[green]✓ AIDock stopped.[/]")

@cli.command()
def prune():
    """Prune unused Docker images and models."""
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

if __name__ == "__main__":
    cli()
