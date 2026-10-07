(() => {
  if (
    typeof window.__sanitizeFormData !== 'function' ||
    typeof window.__withSubmitGuard !== 'function'
  ) {
    console.warn('[form-state] sanitize.js must load before form-state.js');
    return;
  }

  const form = document.querySelector('#register-form');
  const submit = document.querySelector('#reg-submit');
  const status = document.querySelector('#form-status');

  if (!form || !submit || !status) {
    return;
  }

  const TRANSITIONS = Object.freeze({
    idle: Object.freeze(['submitting']),
    submitting: Object.freeze(['success', 'error', 'idle']),
    success: Object.freeze(['idle']),
    error: Object.freeze(['idle', 'submitting']),
  });

  let currentState = 'idle';

  const setStatus = (newState, message) => {
    const allowed = TRANSITIONS[currentState].includes(newState);

    if (!allowed) {
      console.warn(`[form-state] Illegal transition: ${currentState} → ${newState}`);
      return false;
    }

    currentState = newState;
    status.dataset.state = newState;
    status.textContent = message;
    submit.disabled = newState === 'submitting';

    return true;
  };

  const resetToIdle = () => {
    window.setTimeout(() => {
      if (currentState === 'success' || currentState === 'error') {
        setStatus('idle', '');
      }
    }, 3000);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();

      // The transition table intentionally keeps idle strict.
      status.dataset.state = 'error';
      status.textContent = 'Please fix the errors above.';
      submit.disabled = false;
      currentState = 'idle';
      return;
    }

    const formData = new FormData(form);
    const clean = window.__sanitizeFormData(formData);

    if (!setStatus('submitting', 'Submitting…')) {
      return;
    }

    try {
      const result = await window.__withSubmitGuard(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 800));
        return { ok: true, data: clean };
      });

      if (result?.skipped) {
        return;
      }

      if (result?.ok) {
        setStatus(
          'success',
          `Thanks, ${clean.name}! Registration received.`
        );
        form.reset();
        resetToIdle();
        return;
      }

      setStatus('error', 'Something went wrong.');
      resetToIdle();
    } catch (error) {
      console.warn('[form-state] Submission failed:', error);
      setStatus('error', 'Something went wrong.');
      resetToIdle();
    }
  });
})();
