import re
content = open("js/views/dashboard-view.js", encoding="utf-8").read()
content = re.sub(r"(<h3[^>]*>)([^<]*)(</h3>)", r"\g<1><span style=\"color: var(--header-neon-color, #CCFF00); margin-right: 4px;\">|</span> \g<2>\g<3>", content)
open("js/views/dashboard-view.js", "w", encoding="utf-8").write(content)
