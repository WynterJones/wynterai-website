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

})();
