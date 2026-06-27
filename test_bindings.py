import questionary
from prompt_toolkit.key_binding import KeyBindings
from prompt_toolkit.keys import Keys
import sys

kb = KeyBindings()
@kb.add(Keys.Left)
def _(event):
    event.app.exit(result="BACK")

try:
    result = questionary.select("Test:", choices=["A", "B"]).ask()
    print("Normal select works.")
except Exception as e:
    print("Normal select error:", e)

try:
    # See if kwargs accept key_bindings
    result = questionary.select("Test:", choices=["A", "B"], key_bindings=kb).ask()
    print("Result:", result)
except Exception as e:
    print("Error:", e)
