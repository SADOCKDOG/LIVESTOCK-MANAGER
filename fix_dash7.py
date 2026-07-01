import re
content = open("js/views/dashboard-view.js", encoding="utf-8").read()
content = content.replace("<div style=\"font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px; color: var(--header-neon-color, var(--p-gold));\">PIENSO (g/L)</div>", "<div class=\"text-grey\" style=\"font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;\">PIENSO (g/L)</div>")
open("js/views/dashboard-view.js", "w", encoding="utf-8").write(content)
