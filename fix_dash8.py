import re
content = open("js/views/dashboard-view.js", encoding="utf-8").read()
content = content.replace("<h3 style=\"color: #FF4444;\", "<div class=\"card\" style=\"grid-column: span 2; margin-bottom: 0; padding: 20px; text-align: center; border-top: 3px solid #FF4444;\">
          <h3 style=\"color: #FF4444;\")
open("js/views/dashboard-view.js", "w", encoding="utf-8").write(content)
