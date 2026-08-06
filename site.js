/* wynter.ai — the whole site's JavaScript.
 *
 * Every page loads this deferred. It is external rather than inline so the CSP
 * in netlify.toml can refuse `unsafe-inline` scripts outright, and each block
 * below no-ops on pages that don't contain the element it's for.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------ copyright year */

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* --------------------------------------------------- the "Learn" dropdown */

  /* Pure enhancement. The nav is a <details>, so it already opens, closes and
     takes the keyboard with scripting off — all this adds is the dismissal a
     pointer user expects and <details> does not give you: clicking away, and
     Escape. If this file never loads, the menu still works; it just wants a
     second click on the trigger to shut.

     Closing the phone menu closes any dropdown inside it too, so reopening
     "Menu" doesn't restore a panel from two pages ago. */
  var drops = document.querySelectorAll(".nav-drop");

  if (drops.length) {
    document.addEventListener("click", function (e) {
      for (var i = 0; i < drops.length; i++) {
        if (drops[i].open && !drops[i].contains(e.target)) drops[i].open = false;
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      for (var i = 0; i < drops.length; i++) {
        if (!drops[i].open) continue;
        drops[i].open = false;
        var toggle = drops[i].querySelector(".nav-drop-toggle");
        if (toggle) toggle.focus();
      }
    });

    var menu = document.querySelector(".nav-menu");
    if (menu) {
      menu.addEventListener("toggle", function () {
        if (menu.open) return;
        for (var i = 0; i < drops.length; i++) drops[i].open = false;
      });
    }
  }

  /* ------------------------------------------ /history: scroll-reveal fallback */

  /* The reveal is CSS: history.css drives it off a view() timeline, which the
     compositor runs without waking this thread at all. Firefox does not ship
     scroll-driven animations, so this recreates the same entry effect there and
     ONLY there.
     Three conditions before a single entry is allowed to start hidden — the
     browser lacks the native feature, the user has not asked for less motion,
     and IntersectionObserver exists to bring them back. If any fails we do
     nothing, and the CSS leaves every entry visible. Content that needs a
     script to appear is content that disappears when the script doesn't. */
  var revealables = document.querySelectorAll(".hx-item");

  if (revealables.length) {
    var native =
      window.CSS &&
      CSS.supports &&
      CSS.supports("(animation-timeline: view()) and (animation-range: entry)");
    var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!native && !calm && "IntersectionObserver" in window) {
      document.documentElement.classList.add("js-reveal");

      var seen = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (!entries[i].isIntersecting) continue;
            entries[i].target.classList.add("is-in");
            /* Once revealed it stays revealed — nothing on this page fades back
               out, so there is no reason to keep watching it. */
            seen.unobserve(entries[i].target);
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
      );

      for (var r = 0; r < revealables.length; r++) seen.observe(revealables[r]);
    }
  }

})();
