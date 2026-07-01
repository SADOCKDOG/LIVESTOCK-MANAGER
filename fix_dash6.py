import re
content = open("js/views/dashboard-view.js", encoding="utf-8").read()
content = content.replace(" border-top: 3px solid var(--header-neon-color, #CCFF00); background: rgba(255,255,255,0.02);", "")
open("js/views/dashboard-view.js", "w", encoding="utf-8").write(content)
