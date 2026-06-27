import os
from pathlib import Path

models_dir = Path(str(Path.home() / ".docker/models"))
print("Scanning models directory:", models_dir)
if not models_dir.exists():
    print("Directory does not exist.")
    exit(0)

# List all files and sizes
files = []
for root, _, filenames in os.walk(models_dir):
    for filename in filenames:
        filepath = Path(root) / filename
        try:
            stat = filepath.stat()
            files.append((filepath, stat.st_size))
        except Exception as e:
            pass

# Sort by size descending
files.sort(key=lambda x: x[1], reverse=True)

print("\nTop 15 largest files in .docker/models:")
for filepath, size in files[:15]:
    size_gb = size / (1024**3)
    print(f"- {filepath.name}: {size_gb:.2f} GB ({filepath.relative_to(models_dir)})")

# Total size
total_size = sum(f[1] for f in files)
print(f"\nTotal models storage: {total_size / (1024**3):.2f} GB")

# Clean up .incomplete files
print("\nCleaning up .incomplete files...")
cleaned_space = 0
for filepath, size in files:
    if filepath.suffix == ".incomplete":
        try:
            print(f"Deleting incomplete download: {filepath.name} ({size / (1024**2):.2f} MB)")
            filepath.unlink()
            cleaned_space += size
        except Exception as e:
            print(f"Failed to delete {filepath.name}: {e}")

print(f"\nReclaimed: {cleaned_space / (1024**3):.2f} GB of space.")
