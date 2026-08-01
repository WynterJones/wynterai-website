# Building `assets/pace-field-guide.pdf`

Run from the repo root. Headless Chrome renders `print.html` straight to A4 — no
build step, no server, no toolchain:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=20000 \
  --print-to-pdf="$PWD/assets/pace-field-guide.pdf" \
  "file://$PWD/pace/guide/print.html"
```

Then check it, because the renderer will not tell you when it goes wrong:

```sh
pdffonts assets/pace-field-guide.pdf     # every font: "CID TrueType", emb+sub = yes
pdftoppm -png -r 110 assets/pace-field-guide.pdf /tmp/pg && open /tmp/pg-*.png
```

---

## Things that will bite you

**Pagination is manual.** One `.sheet` is one physical page, and the page
numbers in the footers and on the contents page are typed in by hand — Chrome
does not support CSS counters in `@page` margin boxes, so there is no way to
generate them. Add or remove a page and you must renumber both, then look at
every page again. `.sheet` is `overflow: hidden`, so anything that no longer
fits is silently cropped rather than pushed to a new page. The PNG pass above
is not optional.

**Fonts must be static, not variable.** They are base64-inlined at the bottom of
`print.css`. Skia, the PDF backend in headless Chrome, cannot embed a variable
font as a real CID-keyed font — it writes every glyph out as a Type 3 procedure
instead, which is larger, slower in some readers and rejected by some print
RIPs. Google Fonts now serves Inter only as a variable font, so the faces here
come from the upstream static releases (rsms/inter v4.1, JetBrains/JetBrainsMono
v2.304, both OFL) subsetted with `fonttools`. If `pdffonts` ever prints
`Type 3`, that is what regressed.

To change glyph coverage, re-subset from those releases and replace the
`@font-face` rules — the current set is latin + Latin-1 + general punctuation +
U+2192, which is everything the guide sets. A character outside it silently
falls back to a system font and shows up in `pdffonts` as `.SFNS-Regular`.

**The protocol block is canonical.** Pages 20–21 reproduce it verbatim, so
`white-space: pre` is deliberate: under `pre-wrap` a line a millimetre too long
soft-wraps and the extracted text gains a newline the source never had. Its
longest line is 90 characters, which is why those two pages run a wider grid.
Ligatures are switched off in every monospace context for the same reason —
JetBrains Mono's `calt` was rendering the `---` rule as one glyph.

Verify after any change to that block:

```sh
pdftotext -layout -f 20 -l 21 assets/pace-field-guide.pdf - | less
```
