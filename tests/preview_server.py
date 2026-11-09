"""Local QA server: never load the live Supabase SDK; disable all HTTP caching."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
from pathlib import Path
class Handler(SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Cache-Control','no-store');super().end_headers()
 def do_GET(self):
  if urlsplit(self.path).path in ('/','/index.html'):
   html=Path('index.html').read_text().replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>','<!-- SDK omitted only by QA server: no cloud access -->').encode()
   self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(html)));self.end_headers();self.wfile.write(html)
  else:super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8766),Handler).serve_forever()
