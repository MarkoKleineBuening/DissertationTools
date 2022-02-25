#!/usr/bin/env python

import webbrowser

DEFAULT_PORT = 8000

# Try to use Python 2 imports and operations.
# If that does not work we can conclude using Python 3.
# 
# Note: This is a dirty (but working) hack and will
#       be deprecated as soon as we use the Electron framework.
try:
	# Try using Python 2 `SimpleHTTPServer`.
	from SimpleHTTPServer import SimpleHTTPRequestHandler
	from SocketServer import TCPServer
	# port = int(raw_input('Input Port where server should accept requests (e.g. 8000): '))

except ImportError:
	# Try using Python 3 instead.
	from http.server import SimpleHTTPRequestHandler
	from socketserver import TCPServer
	# port = int(input('Input Port where server should accept requests (e.g. 8000): '))

# Just use the `DEFAULT_PORT`.
port = DEFAULT_PORT

Handler = SimpleHTTPRequestHandler
webbrowser.open('http://127.0.0.1:' + str(port) + '/html/summary.html', 2)
httpd = TCPServer(("localhost", port), Handler)

print("Serving at port ", str(port), ".")
print('Connect as localhost with: http://127.0.0.1:', str(port), '/html/summary.html')

httpd.serve_forever()
