import json

target_file = r'd:\Challenge4\PulsePoint\frontend\src\components\dashboard\CommanderDashboardUI.tsx'

with open('daily_briefing_chunks.json', 'r', encoding='utf-8') as f:
    chunks = json.load(f)

with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

success = True
for i, chunk in enumerate(chunks):
    target = chunk['TargetContent']
    repl = chunk['ReplacementContent']
    if target in content:
        content = content.replace(target, repl)
        print(f"Applied chunk {i+1}")
    else:
        print(f"Failed to find target for chunk {i+1}:\n{repr(target[:100])}...")
        success = False

if success:
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("All applied successfully!")
else:
    print("Aborted due to missing targets.")
