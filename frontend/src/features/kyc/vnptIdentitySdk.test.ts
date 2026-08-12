import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { launchVnptIdentitySdk, resetVnptIdentitySdkRuntime } from './vnptIdentitySdk';
import { type MockInstance } from 'vitest';

type SdkConfig = Record<string, unknown>;

let errorListeners: EventListener[] = [];
let originalAddEventListener: typeof window.addEventListener;
let originalRemoveEventListener: typeof window.removeEventListener;

beforeAll(() => {
  originalAddEventListener = window.addEventListener;
  originalRemoveEventListener = window.removeEventListener;
});

beforeEach(() => {
  errorListeners = [];
  vi.spyOn(window, 'addEventListener').mockImplementation(function (this: any, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (type === 'error') {
      errorListeners.push(listener as EventListener);
    }
    return originalAddEventListener.call(this, type, listener, options);
  });
  vi.spyOn(window, 'removeEventListener').mockImplementation(function (this: any, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
    if (type === 'error') {
      errorListeners = errorListeners.filter((l) => l !== listener);
    }
    return originalRemoveEventListener.call(this, type, listener, options);
  });
});

/**
 * Helper: dispatch a vendor crash ErrorEvent that our handler will catch.
 * We manually invoke the listeners instead of window.dispatchEvent to avoid
 * Vitest's uncaught exception tracking.
 */
function simulateVnptVendorCrash(message = "Cannot read properties of undefined (reading 'hash')", stack = "web-sdk-version-3.2.1.0.js:10") {
  const event = new ErrorEvent('error', {
    message: message,
    cancelable: true,
  });
  Object.defineProperty(event, 'error', {
    value: { message: message, stack: stack },
  });
  errorListeners.forEach((listener) => listener(event));
}

function simulateUnrelatedError() {
  const event = new ErrorEvent('error', {
    message: "Cannot read properties of undefined (reading 'hashCode')",
    cancelable: true,
  });
  Object.defineProperty(event, 'error', {
    value: { message: "Cannot read properties of undefined (reading 'hashCode')" },
  });
  errorListeners.forEach((listener) => listener(event));
}

/**
 * Helper: dispatch a Chrome-style hash error that is NOT from VNPT vendor code.
 * After the isVnptVendorCrash fix, this must NOT be caught.
 */
function simulateNonVnptHashError() {
  const event = new ErrorEvent('error', {
    message: "Cannot read properties of undefined (reading 'hash')",
    cancelable: true,
  });
  Object.defineProperty(event, 'error', {
    value: {
      message: "Cannot read properties of undefined (reading 'hash')",
      stack: "app-router.js:42\n    at handleNavigation (app-router.js:38)",
    },
  });
  errorListeners.forEach((listener) => listener(event));
}

describe('VNPT identity SDK bridge', () => {
  const launch = vi.fn();

  beforeEach(() => {
    vi.stubEnv('VITE_VNPT_EKYC_ENABLED', 'true');
    vi.stubEnv('VITE_VNPT_EKYC_BACKEND_URL', 'https://api.idg.vnpt.vn/');
    vi.stubEnv('VITE_VNPT_EKYC_TOKEN_ID', 'browser-token-id');
    vi.stubEnv('VITE_VNPT_EKYC_TOKEN_KEY', 'browser-token-key');
    vi.stubEnv('VITE_VNPT_EKYC_ACCESS_TOKEN', 'Bearer browser-access-token');
    vi.stubEnv('VITE_VNPT_EKYC_CHALLENGE_CODE', 'VALID_CHALLENGE');
    window.SDK = { launch };
    launch.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    resetVnptIdentitySdkRuntime();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it('waits for a terminal callback, strips binary/auth data and preserves identity/risk fields', async () => {
    const onResult = vi.fn();
    const onError = vi.fn();
    await launchVnptIdentitySdk(onResult, { onError });

    const config = launch.mock.calls[0][0] as SdkConfig;
    await callback(config, 'CALL_BACK', { status: 'OCR_IN_PROGRESS' });
    expect(onResult).not.toHaveBeenCalled();

    await callback(config, 'CALL_BACK_DOCUMENT_RESULT', {
      data: {
        idNumber: '012345678901',
        fullName: 'Nguyen Van A',
        dateOfBirth: '01/01/2000',
        fake_print_photo: true,
        fake_print_photo_prob: 0.95,
        frontImage: `data:image/jpeg;base64,${'a'.repeat(10_000)}`,
        ACCESS_TOKEN: 'must-not-leak',
        clientSecret: 'server-secret-must-not-leak',
        headers: { Authorization: 'Bearer must-not-leak' },
      },
    });
    await callback(config, 'CALL_BACK_END_FLOW', {
      session_id: 'session-1',
      transactionId: 'transaction-1',
      tokenKey: 'must-not-leak-either',
    });

    await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(1));
    const result = onResult.mock.calls[0][0];
    expect(result.providerSessionId).toBe('session-1');
    expect(result.providerTransactionId).toBe('transaction-1');
    expect(result.sdkResult.documentResult.data).toMatchObject({
      idNumber: '012345678901',
      fullName: 'Nguyen Van A',
      dateOfBirth: '01/01/2000',
      fake_print_photo: true,
      fake_print_photo_prob: 0.95,
    });
    const serialized = JSON.stringify(result.sdkResult);
    expect(serialized).not.toContain('data:image');
    expect(serialized).not.toContain('must-not-leak');
    expect(serialized).not.toContain('server-secret');
    expect(onError).not.toHaveBeenCalled();
  });

  it('allows a direct-sdk demo result without provider identifiers', async () => {
    const onResult = vi.fn();
    const onError = vi.fn();
    await launchVnptIdentitySdk(onResult, { onError });

    const config = launch.mock.calls[0][0] as SdkConfig;
    await callback(config, 'CALL_BACK_DOCUMENT_RESULT', { id: '012345678901', fullName: 'Nguyen Van A' });
    await callback(config, 'CALL_BACK_END_FLOW', { status: 'SUCCESS' });

    await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(1));
    expect(onResult.mock.calls[0][0].providerSessionId).toBeNull();
    expect(onResult.mock.calls[0][0].providerTransactionId).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  it('submits a terminal result once when SDK emits both callback variants', async () => {
    const onResult = vi.fn();
    await launchVnptIdentitySdk(onResult);

    const config = launch.mock.calls[0][0] as SdkConfig;
    await callback(config, 'CALL_BACK', { sessionId: 'session-1', requestId: 'transaction-1' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onResult).not.toHaveBeenCalled();
    await callback(config, 'CALL_BACK_END_FLOW', { sessionId: 'session-1', requestId: 'transaction-1' });
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(1));

    expect(window.__MANABIHUB_LAST_VNPT_CONFIG__).toMatchObject({
      BACKEND_URL: 'https://api.idg.vnpt.vn',
      TOKEN_ID_EXISTS: true,
      TOKEN_KEY_EXISTS: true,
      ACCESS_TOKEN_EXISTS: true,
      CHALLENGE_CODE_EXISTS: true,
    });
    expect(JSON.stringify(window.__MANABIHUB_LAST_VNPT_CONFIG__)).not.toContain('browser-access-token');
  });

  it('removes legacy persisted KYC payloads when runtime is reset', () => {
    localStorage.setItem('vnpt_ekyc_last_document_result', 'legacy-document');
    localStorage.setItem('vnpt_ekyc_last_result', 'legacy-result');
    resetVnptIdentitySdkRuntime();
    expect(localStorage.getItem('vnpt_ekyc_last_document_result')).toBeNull();
    expect(localStorage.getItem('vnpt_ekyc_last_result')).toBeNull();
  });

  it('fails fast if required config is missing', async () => {
    vi.stubEnv('VITE_VNPT_EKYC_TOKEN_ID', '');
    const onResult = vi.fn();
    await expect(launchVnptIdentitySdk(onResult)).rejects.toThrow(/Thiếu cấu hình VNPT eKYC/);
    expect(launch).not.toHaveBeenCalled();
  });

  it('fails fast if access token is an expired JWT (standard base64)', async () => {
    // Generate a dummy expired JWT with standard base64
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 360 }));
    const signature = 'dummy-signature';
    vi.stubEnv('VITE_VNPT_EKYC_ACCESS_TOKEN', `Bearer ${header}.${payload}.${signature}`);

    const onResult = vi.fn();
    await expect(launchVnptIdentitySdk(onResult)).rejects.toThrow(/Phiên xác thực VNPT đã hết hạn/);
    expect(launch).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────
  // New required tests
  // ──────────────────────────────────────────────────────────────────

  it('fails fast if access token is an expired JWT encoded with base64url', async () => {
    // Build a JWT where the base64url payload ACTUALLY contains - and _.
    // We add a field whose value forces btoa to produce + and / characters,
    // which are then replaced with - and _ by base64url encoding.
    const headerObj = { alg: 'HS256', typ: 'JWT' };
    // The bytes 0xFB and 0xFF produce + and / in standard base64.
    // Adding a string field with characters that map to those bytes guarantees it.
    const payloadObj = {
      exp: Math.floor(Date.now() / 1000) - 360,
      sub: 'test-user',
      // This string contains bytes that produce + and / in base64 encoding
      nonce: '\u00fb\u00ff\u003e\u003f',
    };
    const toBase64Url = (obj: unknown) =>
      btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const payloadB64Url = toBase64Url(payloadObj);
    // Assert the token payload actually contains base64url-specific characters
    expect(payloadB64Url).toMatch(/[-_]/);
    const token = `${toBase64Url(headerObj)}.${payloadB64Url}.dummysig`;
    vi.stubEnv('VITE_VNPT_EKYC_ACCESS_TOKEN', token);

    await expect(launchVnptIdentitySdk(vi.fn())).rejects.toThrow(/Phiên xác thực VNPT đã hết hạn/);
    expect(launch).not.toHaveBeenCalled();
  });

  it('does not fail if JWT is expired by less than 5 minutes (clock skew)', async () => {
    const headerObj = { alg: 'HS256', typ: 'JWT' };
    // Set exp to 3 minutes in the past (within 5m clock skew)
    const payloadObj = { exp: Math.floor(Date.now() / 1000) - 180, sub: 'test-user' };
    const toBase64Url = (obj: unknown) =>
      btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const token = `${toBase64Url(headerObj)}.${toBase64Url(payloadObj)}.dummysig`;
    vi.stubEnv('VITE_VNPT_EKYC_ACCESS_TOKEN', token);

    const onResult = vi.fn();
    await launchVnptIdentitySdk(onResult);
    expect(launch).toHaveBeenCalledTimes(1);
  });

  it('does not reject opaque (non-JWT) access tokens', async () => {
    vi.stubEnv('VITE_VNPT_EKYC_ACCESS_TOKEN', 'opaque-server-issued-token-no-dots');

    const onResult = vi.fn();
    await launchVnptIdentitySdk(onResult);
    expect(launch).toHaveBeenCalledTimes(1);
  });

  it('fails fast if challenge code is missing', async () => {
    vi.stubEnv('VITE_VNPT_EKYC_CHALLENGE_CODE', '');

    await expect(launchVnptIdentitySdk(vi.fn())).rejects.toThrow(/Thiếu VITE_VNPT_EKYC_CHALLENGE_CODE/);
    expect(launch).not.toHaveBeenCalled();
  });

  it('does not catch an unrelated app error containing "hash" in its message', async () => {
    const onResult = vi.fn();
    const onError = vi.fn();
    await launchVnptIdentitySdk(onResult, { onError });

    // Simulate an unrelated error with "hash" in the message
    simulateUnrelatedError();

    // VNPT handler should NOT have fired
    expect(onError).not.toHaveBeenCalled();
    // SDK should still be present (not reset)
    expect(window.SDK).toBeDefined();
  });

  it('does not catch a Chrome hash error that lacks VNPT stack origin', async () => {
    const onResult = vi.fn();
    const onError = vi.fn();
    await launchVnptIdentitySdk(onResult, { onError });

    // This error has the EXACT Chrome message but its stack is from app code, not VNPT
    simulateNonVnptHashError();

    expect(onError).not.toHaveBeenCalled();
    expect(window.SDK).toBeDefined();
  });

  it('handles Safari/Firefox error messages if they originate from VNPT SDK', async () => {
    const onError = vi.fn();
    await launchVnptIdentitySdk(vi.fn(), { onError });

    // Safari error with VNPT stack
    simulateVnptVendorCrash("undefined is not an object (evaluating 'e.dataConfig.hash')", "web-sdk-version-3.2.1.0.js:50");

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('two consecutive launches call their own onError callbacks separately', async () => {
    const onError1 = vi.fn();
    const onError2 = vi.fn();

    // Launch 1
    await launchVnptIdentitySdk(vi.fn(), { onError: onError1 });

    // Launch 2 — should clean up launch 1's listener
    await launchVnptIdentitySdk(vi.fn(), { onError: onError2 });

    // Simulate VNPT crash
    simulateVnptVendorCrash();

    // Only the second launch's callback should fire
    expect(onError1).not.toHaveBeenCalled();
    expect(onError2).toHaveBeenCalledTimes(1);
  });

  it('handles vendor hash crash during active launch exactly once', async () => {
    const onError = vi.fn();
    await launchVnptIdentitySdk(vi.fn(), { onError });

    // First crash
    simulateVnptVendorCrash();
    // Second crash (should be ignored — already fired once)
    simulateVnptVendorCrash();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toMatch(/Phiên xác thực VNPT đã hết hạn/);
  });

  it('happy path END_FLOW submits result exactly once and cleans up listener', async () => {
    const onResult = vi.fn();
    const onError = vi.fn();
    await launchVnptIdentitySdk(onResult, { onError });

    const config = launch.mock.calls[0][0] as SdkConfig;

    // Terminal event
    await callback(config, 'CALL_BACK_END_FLOW', { status: 'SUCCESS', transactionId: 'tx-1' });

    await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(1));

    // A second END_FLOW should be ignored
    await callback(config, 'CALL_BACK_END_FLOW', { status: 'SUCCESS', transactionId: 'tx-1' });
    expect(onResult).toHaveBeenCalledTimes(1);

    // Listener should have been cleaned up — vendor crash should not trigger onError
    simulateVnptVendorCrash();
    expect(onError).not.toHaveBeenCalled();
  });

  it('cleans up legacy localStorage PII at bootstrap', () => {
    localStorage.setItem('vnpt_ekyc_last_document_result', '{"cccd":"PII_DATA"}');
    localStorage.setItem('vnpt_ekyc_last_result', '{"photo":"base64..."}');

    // Import-time cleanup is called in main.tsx; we test the exported function directly.
    resetVnptIdentitySdkRuntime();

    expect(localStorage.getItem('vnpt_ekyc_last_document_result')).toBeNull();
    expect(localStorage.getItem('vnpt_ekyc_last_result')).toBeNull();
  });

  it('passes CHALLENGE_CODE correctly in dataConfig', async () => {
    vi.stubEnv('VITE_VNPT_EKYC_CHALLENGE_CODE', 'MY_REAL_CHALLENGE');
    const onResult = vi.fn();
    await launchVnptIdentitySdk(onResult);

    const config = launch.mock.calls[0][0] as SdkConfig;
    expect(config.CHALLENGE_CODE).toBe('MY_REAL_CHALLENGE');
  });
});

async function callback(config: SdkConfig, name: string, result: unknown) {
  const handler = config[name] as ((value: unknown) => Promise<void> | void);
  await handler(result);
}
