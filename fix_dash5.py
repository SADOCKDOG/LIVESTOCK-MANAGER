import re
content = open("js/views/dashboard-view.js", encoding="utf-8").read()
content = content.replace("<span style=\"color: var(--header-neon-color, #CCFF00); margin-right: 4px;\">|</span> <span style=\"color: var(--header-neon-color, #CCFF00); margin-right: 4px;\">|</span> KPIs Diarios", "<span style=\"color: var(--header-neon-color, #CCFF00); margin-right: 4px;\">|</span> KPIs Diarios")
open("js/views/dashboard-view.js", "w", encoding="utf-8").write(content)
