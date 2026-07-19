import json

transcript = r'C:\Users\LENOVO\.gemini\antigravity-ide\brain\8da86db2-1f28-49cf-b320-20af21d6d784\.system_generated\logs\transcript_full.jsonl'
target_file = r'd:\Challenge4\PulsePoint\frontend\src\components\dashboard\CommanderDashboardUI.tsx'

with open(transcript, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in lines:
    step = json.loads(line)
    if 'tool_calls' in step:
        for tc in step['tool_calls']:
            if tc['name'] == 'multi_replace_file_content':
                args = tc['args']
                if 'CommanderDashboardUI.tsx' in args.get('TargetFile', '') and 'chart' in args.get('Description', '').lower():
                    print("Found chart call to apply!")
                    try:
                        chunks = args['ReplacementChunks']
                        if isinstance(chunks, str):
                            chunks = json.loads(chunks)
                        
                        with open(target_file, 'r', encoding='utf-8') as f_out:
                            content = f_out.read()
                            
                        success = True
                        for chunk in chunks:
                            target = chunk['TargetContent']
                            repl = chunk['ReplacementContent']
                            if target in content:
                                content = content.replace(target, repl)
                            else:
                                print("Target not found:", repr(target[:50]))
                                success = False
                                
                        if success:
                            with open(target_file, 'w', encoding='utf-8') as f_out:
                                f_out.write(content)
                            print("Applied successfully.")
                        else:
                            print("Failed to apply all chunks for this call.")
                    except Exception as e:
                        print("Error:", e)
