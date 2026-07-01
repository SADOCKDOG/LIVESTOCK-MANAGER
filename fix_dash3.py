import re
content = open("js/views/dashboard-view.js", encoding="utf-8").read()
content = content.replace("style=\"grid-column: span 2; margin-bottom: 0; padding: 24px; text-align: center;\"", "style=\"grid-column: span 2; margin-bottom: 0; padding: 24px; text-align: center; border-top: 3px solid var(--header-neon-color, #CCFF00); background: rgba(255,255,255,0.02);\"")
content = content.replace("style=\"grid-column: span 2; margin-bottom: 0; padding: 20px; text-align: center;\"", "style=\"grid-column: span 2; margin-bottom: 0; padding: 20px; text-align: center; border-top: 3px solid var(--header-neon-color, #CCFF00); background: rgba(255,255,255,0.02);\"")
open("js/views/dashboard-view.js", "w", encoding="utf-8").write(content)
