import re
content = open("js/views/dashboard-view.js", encoding="utf-8").read()
content = content.replace("style=\"background: #111; border: 1px solid #333; height: 60px;\"", "style=\"height: 60px;\"")
content = content.replace("background: #111; border: 1px solid #333; height: 60px;", "height: 60px;")
open("js/views/dashboard-view.js", "w", encoding="utf-8").write(content)
