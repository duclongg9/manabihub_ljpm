import { useCallback, useEffect, useMemo, useState } from 'react';
import './VnptEkycTestPage.css';

const LAST_RESULT_STORAGE_KEY = 'vnpt_ekyc_last_result';

const troubleshootingNotes = [
  'SDK does not initialize: check public/web-sdk-version-3.2.1.0.js and public/lib/* file locations.',
  'Unauthorized 401: check BACKEND_URL, TOKEN_ID, TOKEN_KEY, ACCESS_TOKEN; BACKEND_URL must not end with "/" and ACCESS_TOKEN must not include "Bearer".',
  'Camera does not open: check browser camera permission and run the app on localhost.',
  'Asset 404: check the expected SDK files are present in public/lib.',
  'No callback result: pass both CALL_BACK_END_FLOW and CALL_BACK to the same handler.',
];

function sanitizeBackendUrl(value: string | undefined) {
  return (value ?? '').trim().replace(/\/+$/, '');
}

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function VnptEkycTestPage() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const backendUrl = sanitizeBackendUrl(import.meta.env.VITE_VNPT_EKYC_BACKEND_URL);
  const tokenId = import.meta.env.VITE_VNPT_EKYC_TOKEN_ID;
  const tokenKey = import.meta.env.VITE_VNPT_EKYC_TOKEN_KEY;
  const accessToken = import.meta.env.VITE_VNPT_EKYC_ACCESS_TOKEN;
  const isEnabled = import.meta.env.VITE_VNPT_EKYC_ENABLED !== 'false';

  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const isFileProtocol = window.location.protocol === 'file:';

  const handleEkycResult = useCallback(async (callbackResult: unknown) => {
    console.log('VNPT eKYC result:', callbackResult);
    setResult(callbackResult);

    try {
      localStorage.setItem(LAST_RESULT_STORAGE_KEY, JSON.stringify(callbackResult));
    } catch (error) {
      setLastError(`Could not persist callback result: ${getErrorMessage(error)}`);
    }
  }, []);

  const refreshSdkStatus = useCallback(() => {
    setSdkLoaded(Boolean(window.SDK?.launch));
  }, []);

  useEffect(() => {
    refreshSdkStatus();

    const intervalId = window.setInterval(refreshSdkStatus, 1000);

    return () => window.clearInterval(intervalId);
  }, [refreshSdkStatus]);

  useEffect(() => {
    const storedResult = localStorage.getItem(LAST_RESULT_STORAGE_KEY);

    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult));
      } catch {
        setResult(storedResult);
      }
    }
  }, []);

  const launchVnptEkyc = useCallback(() => {
    setLastError(null);
    refreshSdkStatus();

    if (!window.SDK?.launch) {
      setLastError('VNPT SDK is not loaded. Check public SDK files and index.html scripts.');
      return;
    }

    if (!isEnabled) {
      setLastError('VNPT eKYC SDK test is disabled. Set VITE_VNPT_EKYC_ENABLED=true.');
      return;
    }

    const dataConfig = {
      BACKEND_URL: backendUrl,
      TOKEN_KEY: tokenKey,
      TOKEN_ID: tokenId,
      ACCESS_TOKEN: accessToken,

      HAS_RESULT_SCREEN: true,
      HAS_BACKGROUND_IMAGE: true,
      MAX_SIZE_IMAGE: 1,

      LIST_TYPE_DOCUMENT: [-1, 4, 5, 6, 7, 9],
      DOCUMENT_TYPE_START: 999,

      SDK_FLOW: 'DOCUMENT_TO_FACE',
      FLOW_TAKEN: 'DOCUMENT_TO_FACE',

      ENABLE_API_LIVENESS_DOCUMENT: true,
      ENABLE_API_LIVENESS_FACE: true,
      ENABLE_API_MASKED_FACE: true,
      ENABLE_API_COMPARE_FACE: true,
      ENABLE_API_UPLOAD_IMAGE: true,
      ENABLE_API_OCR_DOCUMENT: true,

      SHOW_STEP: true,
      HAS_QR_SCAN: true,
      DEFAULT_LANGUAGE: 'vi',
      USE_METHOD: 'BOTH',

      CALL_BACK_END_FLOW: handleEkycResult,
      CALL_BACK: handleEkycResult,
    };

    try {
      window.SDK.launch(dataConfig);
    } catch (error) {
      console.error('VNPT eKYC launch error:', error);
      setLastError(getErrorMessage(error));
    }
  }, [accessToken, backendUrl, handleEkycResult, isEnabled, refreshSdkStatus, tokenId, tokenKey]);

  const clearResult = useCallback(() => {
    setResult(null);
    setLastError(null);
    localStorage.removeItem(LAST_RESULT_STORAGE_KEY);
  }, []);

  const checklist = useMemo(
    () => [
      { label: 'SDK script loaded', ok: sdkLoaded },
      { label: 'BACKEND_URL exists', ok: hasValue(backendUrl) },
      { label: 'TOKEN_ID exists', ok: hasValue(tokenId) },
      { label: 'TOKEN_KEY exists', ok: hasValue(tokenKey) },
      { label: 'ACCESS_TOKEN exists', ok: hasValue(accessToken) },
      { label: 'Browser uses localhost, not file://', ok: isLocalhost && !isFileProtocol },
      { label: 'Camera permission is required for webcam mode', ok: true },
    ],
    [accessToken, backendUrl, isFileProtocol, isLocalhost, sdkLoaded, tokenId, tokenKey],
  );

  const resultJson = result === null ? 'No callback result yet.' : safeStringify(result);

  return (
    <main className="vnpt-test-page">
      <div className="vnpt-test-shell">
        <header className="vnpt-test-header">
          <p className="vnpt-test-eyebrow">Dev sandbox</p>
          <div className="vnpt-test-header-row">
            <div>
              <h1 className="vnpt-test-title">VNPT eKYC SDK Test</h1>
              <p className="vnpt-test-description">
                This page only checks the VNPT Web SDK integration. It does not call ManabiHub backend or store KYC data.
              </p>
            </div>
            <div className="vnpt-test-actions">
              <button
                className="vnpt-test-button vnpt-test-button-primary"
                disabled={!isEnabled}
                type="button"
                onClick={launchVnptEkyc}
              >
                Launch VNPT eKYC
              </button>
              <button
                className="vnpt-test-button vnpt-test-button-secondary"
                type="button"
                onClick={clearResult}
              >
                Clear Result
              </button>
            </div>
          </div>
        </header>

        <section className="vnpt-test-status-grid">
          <div className="vnpt-test-card">
            <h2 className="vnpt-test-card-title">SDK status</h2>
            <p className={`vnpt-test-status ${sdkLoaded ? 'vnpt-test-ok' : 'vnpt-test-bad'}`}>
              {sdkLoaded ? 'loaded' : 'not loaded'}
            </p>
          </div>

          <div className="vnpt-test-card vnpt-test-card-wide">
            <h2 className="vnpt-test-card-title">Last error</h2>
            <pre className="vnpt-test-code vnpt-test-code-small">
              {lastError ?? 'No error.'}
            </pre>
          </div>
        </section>

        <section className="vnpt-test-card">
          <h2 className="vnpt-test-card-title">Debug checklist</h2>
          <div className="vnpt-test-checklist">
            {checklist.map((item) => (
              <div key={item.label} className="vnpt-test-checklist-item">
                <span>{item.label}</span>
                <span className={item.ok ? 'vnpt-test-ok' : 'vnpt-test-bad'}>
                  {item.ok ? 'yes' : 'no'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="vnpt-test-card">
          <h2 className="vnpt-test-card-title">Last callback result</h2>
          <pre className="vnpt-test-code vnpt-test-code-result">
            {resultJson}
          </pre>
        </section>

        <section className="vnpt-test-card">
          <h2 className="vnpt-test-card-title">Troubleshooting</h2>
          <ul className="vnpt-test-notes">
            {troubleshootingNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>

        <div id="ekyc_sdk_intergrated" className="vnpt-test-sdk-host" />
      </div>
    </main>
  );
}
