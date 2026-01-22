import http.server
import socketserver
import mimetypes
import os

PORT = 8000

# 确保在正确的目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# 显式添加 mp3 MIME 类型支持
mimetypes.init()
mimetypes.add_type('audio/mpeg', '.mp3')

class MyHandler(http.server.SimpleHTTPRequestHandler):
    # 移除错误的 do_GET 重写，避免在状态行之前发送 header
    
    def end_headers(self):
        # 在结束 header 前添加自定义 header
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    
    # 确保扩展名能正确映射
    def guess_type(self, path):
        if path.endswith('.mp3'):
            return 'audio/mpeg'
        return super().guess_type(path)

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print(f"Serving at port {PORT}")
    print(f"Current directory: {os.getcwd()}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
