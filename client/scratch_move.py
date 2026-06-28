import re

with open(r"c:\AppDev\My_Linkdin\projects\iarxii\AIDock\client\src\App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Locate Chat Area block
chat_marker = "        {/* Middle column: Chat Area */}"
chat_idx = content.find(chat_marker)

# Locate Text Editor Pane block
editor_marker = "        {/* Right column: Text Editor Pane */}"
editor_idx = content.find(editor_marker)

# Locate the end of the Text Editor Pane block (it's right before </main>)
main_end_idx = content.find("      </main>")

if chat_idx != -1 and editor_idx != -1 and main_end_idx != -1:
    # Extract Editor Pane
    editor_pane = content[editor_idx:main_end_idx]
    
    # Remove Editor Pane from original location
    content = content[:editor_idx] + content[main_end_idx:]
    
    # Insert Editor Pane before Chat Area
    content = content[:chat_idx] + editor_pane + "\n" + content[chat_idx:]
    
    # Update col-spans
    content = content.replace(
        "className={`${isTextEditorOpen ? 'lg:col-span-5' : 'lg:col-span-9'} flex flex-col",
        "className={`${isTextEditorOpen ? 'lg:col-span-3' : 'lg:col-span-9'} flex flex-col"
    )
    content = content.replace(
        "<section className=\"lg:col-span-4 flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-[#1A1D2E]",
        "<section className=\"lg:col-span-6 flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-[#1A1D2E]"
    )

    with open(r"c:\AppDev\My_Linkdin\projects\iarxii\AIDock\client\src\App.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully moved Text Editor Pane and updated spans!")
else:
    print(f"Could not find markers. chat: {chat_idx}, editor: {editor_idx}, main_end: {main_end_idx}")
