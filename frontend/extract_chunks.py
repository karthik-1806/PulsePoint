import json

transcript = r'C:\Users\LENOVO\.gemini\antigravity-ide\brain\8da86db2-1f28-49cf-b320-20af21d6d784\.system_generated\logs\transcript_full.jsonl'

with open(transcript, 'r', encoding='utf-8') as f:
    for line in f:
        step = json.loads(line)
        if 'tool_calls' in step:
            for tc in step['tool_calls']:
                if tc['name'] == 'multi_replace_file_content':
                    args = tc['args']
                    if 'CommanderDashboardUI.tsx' in args.get('TargetFile', '') and 'briefing' in args.get('Description', '').lower():
                        chunks = json.loads(args['ReplacementChunks']) if isinstance(args['ReplacementChunks'], str) else args['ReplacementChunks']
                        with open('daily_briefing_chunks.json', 'w', encoding='utf-8') as out_f:
                            json.dump(chunks, out_f, indent=2)
                        print("Saved daily_briefing_chunks.json!")
