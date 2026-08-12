import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { launchVnptIdentitySdk, resetVnptIdentitySdkRuntime } from './vnptIdentitySdk';

type SdkConfig = Record<string, unknown>;

describe('VNPT identity SDK bridge', () => {
  const launch = vi.fn();

  beforeEach(() => {
    vi.stubEnv('VITE_VNPT_EKYC_ENABLED', 'true');
    vi.stubEnv('VITE_VNPT_EKYC_BACKEND_URL', 'https://api.idg.vnpt.vn/');
    vi.stubEnv('VITE_VNPT_EKYC_TOKEN_ID', 'browser-token-id');
    vi.stubEnv('VITE_VNPT_EKYC_TOKEN_KEY', 'browser-token-key');
    vi.stubEnv('VITE_VNPT_EKYC_ACCESS_TOKEN', 'Bearer browser-access-token');
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
});

async function callback(config: SdkConfig, name: string, result: unknown) {
  const handler = config[name] as ((value: unknown) => Promise<void> | void);
  await handler(result);
}
