(() => {
  'use strict';

  const LIMITS = Object.freeze({
    name: 80,
    email: 254,
    message: 2000
  });

  // Layer 1: remove C0/C1 control characters while preserving whitespace controls.
  const stripControlChars = (str) =>
    str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  // Layer 2: collapse all whitespace to one space and trim.
  const collapseWhitespace = (str) =>
    str.replace(/\s+/g, ' ').trim();

  // Layer 3: clip by Unicode code points, preserving emoji/surrogate pairs.
  const clipByCodePoint = (str, max) =>
    Array.from(str).slice(0, max).join('');

  const sanitizeField = (value, max) =>
    clipByCodePoint(
      collapseWhitespace(
        stripControlChars(String(value))
      ),
      max
    );

  const sanitizeFormData = (formData) => ({
    name: sanitizeField(formData.get('name') ?? '', LIMITS.name),
    email: sanitizeField(formData.get('email') ?? '', LIMITS.email),
    message: sanitizeField(formData.get('message') ?? '', LIMITS.message)
  });

  let inFlight = false;

  const withSubmitGuard = async (action) => {
    if (inFlight) {
      return { skipped: true };
    }

    inFlight = true;

    try {
      return await action();
    } finally {
      inFlight = false;
    }
  };

  window.__sanitizeFormData = sanitizeFormData;
  window.__withSubmitGuard = withSubmitGuard;

  Object.freeze(window.__sanitizeFormData);
  Object.freeze(window.__withSubmitGuard);
})();
