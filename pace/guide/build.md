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

**Divider plates are tuned per image, not globally.** The five files in
`assets/pace/` were generated separately and their line work differs by more
than 3x in luminance, so `.plate--01` … `.plate--05` in `print.css` carry
different opacities chosen to land the brightest strokes on every divider at
roughly the same value over the ink-950 ground. Swapping a plate means
re-measuring: crop the middle 39% of the new file (that is all a portrait page
shows under `object-fit: cover`), take the 99th-percentile luminance, and pick
an opacity that puts it near L=55. Do not assume the number from the file it
replaced. The plates go in as `<img>` rather than `background-image` on
purpose — Chrome embeds an image XObject regardless of print-colour settings,
where a CSS background is dropped unless `print-color-adjust: exact`.

**Figures are inline SVG and their unit is the point.** Each figure's viewBox
is authored so one user unit is one point at final size: a viewBox 448 wide set
into the 158mm text block measures 447.87pt, so `font-size="8"` really is 8pt
on paper. Keep that convention if you add one, and keep nothing below 7.5.
Fills and strokes come in as classes (`.fs-*`, `.st-*`) because presentation
attributes cannot resolve `var()`, so the figures stay on the document's
tokens. Every paired series is separated by dash pattern, stroke weight or
fill as well as by colour, so the figures survive a greyscale printer.

**Small filled rects rasterise unevenly.** The list marker is a 1.6mm square
rather than the thin dash it started as. A marker sits at a fractional device
offset that differs from item to item and the rasteriser snaps it to whole
pixels, so a 1.2pt bar came out 2, 3 or 4 pixels tall down one list and read as
an alternating red/grey pattern nobody had written. The error is one pixel
whatever the thickness, so the only fix is a shape big enough in its short
dimension for one pixel not to matter. If you change the marker, verify by
measuring the pixel height of consecutive markers at `-r 110`, not by looking
at it — pages 7 and 24 are the two worst cases in the document.

**The protocol block is canonical.** Pages 24–25 reproduce it verbatim, so
`white-space: pre` is deliberate: under `pre-wrap` a line a millimetre too long
soft-wraps and the extracted text gains a newline the source never had. Its
longest line is 90 characters, which is why those two pages run a wider grid.
Ligatures are switched off in every monospace context for the same reason —
JetBrains Mono's `calt` was rendering the `---` rule as one glyph.

Verify after any change to that block:

```sh
pdftotext -layout -f 24 -l 25 assets/pace-field-guide.pdf - | less
```
