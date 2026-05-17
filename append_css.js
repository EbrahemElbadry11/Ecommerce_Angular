const fs = require('fs');

const css = `
/* ======================================================
   DARK MODE
====================================================== */
:host-context(.dark-mode) {
  --bg: #0e0d0b;
  --surface: #17150f;
  --surface-2: #1d1b14;
  --ink: #f5f2ec;
  --ink-soft: #c9c4b8;
  --muted: #776f63;
  --stroke: rgba(245, 242, 236, .09);
  --shadow-sm: 0 4px 14px rgba(0, 0, 0, .4);
  --shadow-md: 0 12px 34px rgba(0, 0, 0, .5);
  --shadow-lg: 0 28px 70px rgba(0, 0, 0, .6);
}

:host-context(.dark-mode) .back-btn,
:host-context(.dark-mode) .loading,
:host-context(.dark-mode) .thumbnail,
:host-context(.dark-mode) .purchase-panel,
:host-context(.dark-mode) .stepper-btn,
:host-context(.dark-mode) .btn-outline,
:host-context(.dark-mode) .review-card,
:host-context(.dark-mode) .write-review-form {
  background: var(--surface) !important;
  color: var(--ink) !important;
  border-color: var(--stroke) !important;
}

:host-context(.dark-mode) .product-main,
:host-context(.dark-mode) .related-section,
:host-context(.dark-mode) .reviews-section {
  background: rgba(23, 21, 15, .95) !important;
  border-color: rgba(245, 242, 236, .1) !important;
}

:host-context(.dark-mode) .main-image-container {
  background: linear-gradient(145deg, rgba(224, 120, 64, 0.04), rgba(74, 222, 128, 0.04)) !important;
}

:host-context(.dark-mode) .btn-primary {
  color: #fff !important;
}
`;

fs.appendFileSync('src/app/modules/products/components/product-detail/product-detail.component.css', css);
