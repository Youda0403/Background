/* Canvas classification. Layouts branch on the aspect-ratio tier, which
   is what lets one design reflow from a Watch face to a Fold. Photo
   proportions are the layout's business, not a user setting. */
(function (W) {
  'use strict';

  function tierOf(ar) {
    if (ar >= 1.95) return 'tall';
    if (ar >= 1.6) return 'phone';
    if (ar >= 1.15) return 'tablet';
    if (ar >= 0.92) return 'square';
    return 'wide';
  }

  W.compose = { tierOf: tierOf };
})(window.PT = window.PT || {});
