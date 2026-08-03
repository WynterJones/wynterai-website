#!/usr/bin/env python3
"""Local preview server that behaves the way Netlify does.

    python3 serve.py [port]        # default 8899

`python3 -m http.server` is not good enough for previewing this site: every
internal link is extensionless (`/about`, not `/about.html`) because that is
what Netlify serves, so a plain file server 404s on the whole nav. This adds
the three behaviours that matter and nothing else:

  * `/about`      -> serves `about.html`
  * `/about.html` -> 301 to `/about`, so the clean URL stays canonical here too
  * anything missing -> `404.html`, with a real 404 status

Development only. Netlify does all of this in production; this file is never
deployed (it just sits in the publish directory, unreferenced).
"""

import os
import sys
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.abspath(__file__))


class NetlifyLikeHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]

        # `/about.html` -> `/about`. Netlify redirects rather than serving both,
        # so a stray .html link in the markup shows up here as a redirect in the
        # network tab instead of silently working.
        if path.endswith(".html") and path != "/404.html":
            clean = path[: -len(".html")]
            if os.path.isfile(os.path.join(ROOT, path.lstrip("/"))):
                self.send_response(301)
                self.send_header("Location", clean)
                self.end_headers()
                return None

        # `/about` -> `about.html`.
        if not os.path.splitext(path)[1] and path != "/":
            candidate = path.lstrip("/") + ".html"
            if os.path.isfile(os.path.join(ROOT, candidate)):
                self.path = "/" + candidate

        return super().send_head()

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(ROOT, "404.html")

        if code == 404 and os.path.isfile(page):
            with open(page, "rb") as handle:
                body = handle.read()

            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()

            if self.command != "HEAD":
                self.wfile.write(body)
            return

        super().send_error(code, message, explain)

    # Nothing is cached, so every refresh shows the current file.
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    handler = partial(NetlifyLikeHandler, directory=ROOT)

    print(f"wynter.ai preview -> http://127.0.0.1:{port}")
    print("Ctrl-C to stop.")

    HTTPServer(("127.0.0.1", port), handler).serve_forever()


if __name__ == "__main__":
    main()
