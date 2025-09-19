#!/usr/bin/env python3
# Fix broken emoji characters in HTML file

# Read the HTML file
with open('web/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix broken emojis - use safe alternatives
fixes = [
    ('âš ï¸', '⚡'),  # Warning -> Lightning
    ('âœ"', '✓'),    # Check mark
]

for old, new in fixes:
    content = content.replace(old, new)

# Write the fixed content back
with open('web/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed broken emoji characters!")