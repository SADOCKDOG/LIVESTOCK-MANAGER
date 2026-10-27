"""
Servidor local de desarrollo para validacion visual de Livestock Manager
Puerto: 8080
"""
import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def guess_type(self, path):
        if path.endswith(".js"):
            return "application/javascript"
        if path.endswith(".mjs"):
            return "application/javascript"
        if path.endswith(".css"):
            return "text/css"
        if path.endswith(".json"):
            return "application/json"
        if path.endswith(".webmanifest"):
            return "application/manifest+json"
        return super().guess_type(path)

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    with ReusableTCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"Servidor de desarrollo activo en http://localhost:{PORT}")
        print(f"Panel de trazabilidad porcina: http://localhost:{PORT}/preview-trazabilidad.html")
        print(f"Aplicacion principal: http://localhost:{PORT}/index.html")
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
