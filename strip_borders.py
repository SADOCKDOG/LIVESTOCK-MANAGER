import os
import re
import glob

files = glob.glob('js/views/*.js')
count = 0
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = re.sub(r'border-top:\s*\d+px\s+solid\s+[^;\"\'\>]+;?', '', content, flags=re.IGNORECASE)
    new_content = re.sub(r'style=\"\s*\"', '', new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Stripped border-top from {filepath}')
        count += 1
print(f'Done! Modified {count} files.')
