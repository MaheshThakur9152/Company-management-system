export const initClientErrorLogger = () => {
  try {
    window.addEventListener('error', (e: ErrorEvent) => {
      try {
        const payload = { message: e.message, stack: (e.error && e.error.stack) || null, time: Date.now() };
        localStorage.setItem('last_client_error', JSON.stringify(payload));
      } catch (err) { /* ignore */ }
    });

    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
      try {
        const reason: any = e.reason || {};
        const payload = { message: reason.message || String(reason) || 'Unhandled rejection', stack: reason.stack || null, time: Date.now() };
        localStorage.setItem('last_client_error', JSON.stringify(payload));
      } catch (err) { /* ignore */ }
    });
  } catch (err) {
    // noop
  }
};

export const getLastClientError = () => {
  try {
    const raw = localStorage.getItem('last_client_error');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) { return null; }
};
