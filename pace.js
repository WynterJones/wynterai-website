/* wynter.ai — behaviour for /pace/protocol/.
 *
 * Loaded alongside /site.js (which owns the footer year) rather than folded
 * into it: nothing else on the site has a code block or a tab strip, and this
 * file is dead weight on the other five pages.
 *
 * External, not inline, because netlify.toml serves `script-src 'self'` with no
 * `unsafe-inline` — an inline handler here would take the whole site's CSP down
 * a notch.
 *
 * Two rules govern everything below:
 *
 *   1. It injects no content. The protocol text, every adapter filename, and
 *      every "put this at" line are already in the HTML. This file toggles
 *      `hidden` and reads `textContent`; it never writes page copy. That is
 *      what keeps the page whole for crawlers and answer engines.
 *
 *   2. It degrades. Copy buttons ship `hidden` in the markup and are unhidden
 *      here, so with scripting off nobody is offered a button that cannot work
 *      — the <pre> is still there to select. Tab panels ship with the first
 *      one visible and the rest `hidden`, so scripting off leaves a correct
 *      page showing the Claude Code path.
 */
(function () {
  "use strict";

  /* --------------------------------------------------------- copy buttons
   *
   * The clipboard has to receive the ORIGINAL markdown — leading `##` intact,
   * `&`/`<`/`>` unescaped — while the HTML source has to carry those three
   * characters escaped or it isn't parseable. `textContent` is exactly that
   * round trip: the parser decodes the entities, so what comes back out is the
   * byte-for-byte source text. Never read innerHTML here.
   */

  var COPIED_MS = 2000;

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Older Safari and any non-secure context. execCommand is deprecated but
    // it is the only fallback, and failing silently would leave the button
    // saying "Copied" over an empty clipboard.
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.setAttribute("aria-hidden", "true");
      ta.className = "offscreen";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-copy]"),
    function (btn) {
      var source = document.getElementById(btn.getAttribute("data-copy"));
      if (!source) return;

      // The button is only offered once we know we can act on it.
      btn.hidden = false;

      var idle = btn.textContent;
      var timer = null;

      btn.addEventListener("click", function () {
        copyText(source.textContent).then(function () {
          btn.textContent = "Copied";
          btn.setAttribute("data-state", "copied");
        }, function () {
          btn.textContent = "Press ⌘C";
          btn.setAttribute("data-state", "failed");
        }).then(function () {
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            btn.textContent = idle;
            btn.removeAttribute("data-state");
          }, COPIED_MS);
        });
      });
    }
  );

  /* ---------------------------------------------------------- adapter tabs
   *
   * Only the filename and the "put this at" line differ between adapters — the
   * protocol itself is identical in all four, so it lives outside the panels
   * and is never touched. Switching tabs swaps a path, not the payload.
   *
   * Keyboard follows the APG tabs pattern: arrows move and activate, Home/End
   * jump to the ends, and a roving tabindex keeps the strip a single stop in
   * the tab order rather than four.
   */

  Array.prototype.forEach.call(
    document.querySelectorAll("[role='tablist']"),
    function (list) {
      var tabs = Array.prototype.slice.call(
        list.querySelectorAll("[role='tab']")
      );
      if (tabs.length < 2) return;

      function select(index, moveFocus) {
        tabs.forEach(function (tab, i) {
          var on = i === index;
          tab.setAttribute("aria-selected", on ? "true" : "false");
          tab.tabIndex = on ? 0 : -1;

          var panel = document.getElementById(tab.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;

          // The filename in the code block's own bar tracks the tab, so the
          // thing you are about to paste and the place it goes never disagree.
          var name = tab.getAttribute("data-filename");
          var slot = document.getElementById(tab.getAttribute("data-names"));
          if (on && slot && name) slot.textContent = name;
        });
        if (moveFocus) tabs[index].focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { select(i, false); });

        tab.addEventListener("keydown", function (event) {
          var next = null;
          switch (event.key) {
            case "ArrowRight": case "ArrowDown": next = (i + 1) % tabs.length; break;
            case "ArrowLeft":  case "ArrowUp":   next = (i - 1 + tabs.length) % tabs.length; break;
            case "Home": next = 0; break;
            case "End":  next = tabs.length - 1; break;
            default: return;
          }
          event.preventDefault();
          select(next, true);
        });
      });

      // Normalise from whatever the HTML shipped, so the roving tabindex is
      // correct even though the markup only carries the selected state.
      var start = tabs.indexOf(list.querySelector("[aria-selected='true']"));
      select(start < 0 ? 0 : start, false);
    }
  );

})();
