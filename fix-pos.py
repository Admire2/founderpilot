import re

fpath = "app/karakata/page.tsx"

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File size before: {len(content)} chars")

# Remove ALL broken POS fragments using aggressive patterns
# Pattern 1: The orphaned type tail "y: number; s: number; ... }[] = [ ... ];"
content = re.sub(
    r'\s*y:\s*number;\s*s:\s*number;\s*d:\s*number;\s*delay:\s*number\s*\}\s*\[\]\s*=\s*\[[\s\S]*?\];',
    '\n',
    content
)

# Pattern 2: Partial "const POS: { x: number;" left hanging
content = re.sub(r'const\s+POS\s*:\s*\{\s*x:\s*number;\s*', '', content)

# Pattern 3: Any other malformed POS attempts
content = re.sub(r'const\s+POS[^=]*=\s*\[[\s\S]*?\];\s*', '', content)

print(f"File size after cleanup: {len(content)} chars")

# Inject clean POS definition if missing
if 'const POS:' not in content and 'const POS =' not in content:
    clean_pos = """const POS: { x: number; y: number; s: number; d: number; delay: number }[] = [
  { x: 4, y: 10, s: 104, d: 6, delay: 0 },
  { x: 80, y: 6, s: 118, d: 7, delay: 0.4 },
  { x: 88, y: 52, s: 92, d: 5.5, delay: 0.8 },
  { x: 10, y: 58, s: 86, d: 6.5, delay: 1.2 },
  { x: 58, y: 66, s: 78, d: 7.5, delay: 0.2 },
  { x: 34, y: 4, s: 72, d: 6, delay: 1.6 }
];

"""
    if 'function Card({' in content:
        content = content.replace('function Card({', clean_pos + 'function Card({', 1)
        print("✓ POS injected before function Card")
    elif 'export default function KaraMarket()' in content:
        content = content.replace('export default function KaraMarket()', clean_pos + 'export default function KaraMarket()', 1)
        print("✓ POS injected before export default function")

# Fix implicit any types
content = content.replace('POS.map((pos, i) =>', 'POS.map((pos: any, i: number) =>')
content = content.replace('DEMO.map((d) =>', 'DEMO.map((d: any) =>')
content = content.replace('CATS.find((c) =>', 'CATS.find((c: any) =>')

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
with open(fpath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("\n=== POS definition in file: ===")
for i, line in enumerate(lines):
    if 'const POS' in line:
        for j in range(i, min(i+10, len(lines))):
            print(f"{j+1}: {lines[j]}", end='')
        break

print("\n\n✓ Fix complete! Run: npm run build")
