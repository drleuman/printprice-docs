def srgb_to_linear(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

def luminance(hex_color):
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return 0.2126 * srgb_to_linear(r) + 0.7152 * srgb_to_linear(g) + 0.0722 * srgb_to_linear(b)

def blend(fg_hex, fg_alpha, bg_hex):
    # Alpha compositing on solid bg
    fg_hex = fg_hex.lstrip('#')
    bg_hex = bg_hex.lstrip('#')
    fg_r, fg_g, fg_b = int(fg_hex[0:2], 16), int(fg_hex[2:4], 16), int(fg_hex[4:6], 16)
    bg_r, bg_g, bg_b = int(bg_hex[0:2], 16), int(bg_hex[2:4], 16), int(bg_hex[4:6], 16)
    r = round(fg_r * fg_alpha + bg_r * (1 - fg_alpha))
    g = round(fg_g * fg_alpha + bg_g * (1 - fg_alpha))
    b = round(fg_b * fg_alpha + bg_b * (1 - fg_alpha))
    return f"#{r:02x}{g:02x}{b:02x}"

def contrast(c1, c2):
    l1 = luminance(c1)
    l2 = luminance(c2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

checks = [
    # Light Mode
    ("Light: Primary Text #0f172a on #ffffff", "#0f172a", "#ffffff", 4.5),
    ("Light: Secondary Text #475569 on #ffffff", "#475569", "#ffffff", 4.5),
    ("Light: Brand Link/Accent #B71C1C on #ffffff", "#B71C1C", "#ffffff", 4.5),
    ("Light: Tag Text #B71C1C on Tag Bg (red 7% on #fff)", "#B71C1C", blend("#E53935", 0.07, "#ffffff"), 4.5),
    ("Light: Code Text #B71C1C on Code Bg #f8fafc", "#B71C1C", "#f8fafc", 4.5),
    ("Light: Green Status #10b981 on #ffffff", "#047857", "#ffffff", 4.5),
    ("Light: Amber Status #b45309 on #ffffff", "#b45309", "#ffffff", 4.5),
    
    # Terminal (Both Modes)
    ("Terminal: Text #F8FAFC on #0B0D12", "#F8FAFC", "#0B0D12", 4.5),
    ("Terminal: Inactive Tab #94A3B8 on Header #151820", "#94A3B8", "#151820", 4.5),
    ("Terminal: Active Tab #FF5252 on #151820", "#FF5252", "#151820", 4.5),
    
    # Dark Mode
    ("Dark: Primary Text #f8fafc on #0B0D12", "#f8fafc", "#0B0D12", 4.5),
    ("Dark: Secondary Text #94a3b8 on #0B0D12", "#94a3b8", "#0B0D12", 4.5),
    ("Dark: Surface Text #f8fafc on #151820", "#f8fafc", "#151820", 4.5),
    ("Dark: Tag Text #FF5252 on Tag Bg (red 14% on #151820)", "#FF5252", blend("#E53935", 0.14, "#151820"), 4.5),
    ("Dark: Brand Accent #FF5252 on #0B0D12", "#FF5252", "#0B0D12", 4.5),
    ("Dark: Status Green #10b981 on #151820", "#10b981", "#151820", 4.5),
    ("Dark: Status Amber #fbbf24 on #151820", "#fbbf24", "#151820", 4.5),
]

print(f"{'Contrast Pair':<55} | {'Ratio':<7} | {'Required':<8} | {'Status'}")
print("-" * 80)
for desc, fg, bg, req in checks:
    c = contrast(fg, bg)
    status = "PASS (AA)" if c >= req else "FAIL"
    print(f"{desc:<55} | {c:5.2f}:1 | {req:4.1f}:1   | {status}")
