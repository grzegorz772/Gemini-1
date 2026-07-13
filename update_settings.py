import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Remove the APKG upload block from Settings
apkg_pattern = r'<div className="space-y-2">\s*<label className="text-xs font-medium text-white/60">Importuj plik \.apkg.*?</div>\s*</div>\s*</div>\s*<div className="grid grid-cols-2 gap-4">'
content = re.sub(apkg_pattern, '<div className="grid grid-cols-2 gap-4">', content, flags=re.DOTALL)

# 2. Add worldMemory to Anki Section Settings
# Find:
# <div className="space-y-2">
#   <label className="text-xs font-medium text-white/60">Ostatnio widziane (dni)</label>
# ...
# </div>
# And replace with worldMemory next to it if there's room, but it's currently in a grid-cols-2
# Let's just find the end of that grid and add a new row.

world_memory_settings = """
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Limit słówek (World Memory)</label>
                    <input 
                      type="number"
                      value={settings.worldMemory}
                      onChange={(e) => setSettings({...settings, worldMemory: parseInt(e.target.value) || 1000})}
                      className="w-full bg-[#151515]/30 border border-white/10 rounded-xl p-3 outline-none text-sm focus:border-blue-500/50"
                    />
                  </div>
"""

# Let's insert worldMemory after `<option value="reviewed">Powtórzone (Review)</option>... </select> </div>`
filter_pattern = r'(<option value="reviewed">Powtórzone \(Review\)</option>\s*</select>\s*</div>)'
content = re.sub(filter_pattern, r'\1' + world_memory_settings, content, count=1)


# 3. Remove worldMemory from old location (Algorytm i Pamięć)
# <div className="space-y-2">
#   <label className="text-xs font-medium text-white/60">WorldMemory (Ograniczenie ilości słówek)</label>
#   <input 
#     type="number"
#     value={settings.worldMemory}
# ...
# </div>

old_wm_pattern = r'<div className="space-y-2">\s*<label className="text-xs font-medium text-white/60">WorldMemory \(Ograniczenie ilości słówek\)</label>[\s\S]*?</p>\s*</div>'
content = re.sub(old_wm_pattern, '', content, count=1)

with open('src/App.tsx', 'w') as f:
    f.write(content)
