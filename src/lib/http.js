// fetch() + JSON with a mandatory timeout and one error shape for every widget.
// Bridges answer errors as { error: { code, retryable, retryAfter } } (see public/_bridge.php).
export class HttpError extends Error {
  constructor(message, { status = 0, code = 'NETWORK', retryAfter } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export async function fetchJson(url, { timeout = 8000, signal, headers, ...init } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeout);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...headers },
    });
    const body = await response.json().catch(() => null);

    if (!response.ok || (body && typeof body.error === 'object' && body.error !== null)) {
      const error = body?.error ?? {};
      throw new HttpError(error.message || `HTTP ${response.status}`, {
        status: response.status,
        code: error.code || (response.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM'),
        retryAfter: error.retryAfter,
      });
    }
    if (body === null) throw new HttpError('Invalid JSON', { status: response.status, code: 'INVALID_RESPONSE' });
    return body;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    const aborted = signal?.aborted;
    throw new HttpError(aborted ? 'aborted' : controller.signal.aborted ? 'timeout' : 'network', {
      code: aborted ? 'ABORTED' : controller.signal.aborted ? 'TIMEOUT' : 'NETWORK',
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
