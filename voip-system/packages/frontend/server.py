#!/usr/bin/env python3
import http.server
import socketserver
import os
import urllib.parse

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_GET(self):
        # Parse the URL
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # If it's a file that exists, serve it
        if os.path.exists('.' + path) and not os.path.isdir('.' + path):
            super().do_GET()
            return
        
        # For SPA routing, serve index.html for all non-file requests
        if not path.startswith('/api/') and not path.startswith('/assets/'):
            self.path = '/index.html'
        
        super().do_GET()

if __name__ == "__main__":
    PORT = 5173
    os.chdir('/home/ascozzari/voip/packages/frontend/dist')
    
    with socketserver.TCPServer(("0.0.0.0", PORT), SPAHandler) as httpd:
        print(f"🚀 Frontend server running on http://0.0.0.0:{PORT}")
        print(f"📁 Serving from: {os.getcwd()}")
        print("🌐 SPA routing enabled - all routes will serve index.html")
        httpd.serve_forever()
