import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  VNPT_EKYC_MODES,
  accessTokenHasBearerPrefix,
  buildVnptEkycConfig,
  getVnptEkycMode,
  getVnptEnv,
  summarizeVnptResult,
  type VnptEkycModeValue,
} from './vnptEkycConfig';
import './VnptEkycTestPage.css';

const LAST_FINAL_RESULT_STORAGE_KEY = 'vnpt_ekyc_last_result';
const LAST_DOCUMENT_RESULT_STORAGE_KEY = 'vnpt_ekyc_last_document_result';

const troubleshootingNotes = [
  'SDK not loaded: check frontend/public/web-sdk-version-3.2.1.0.js and frontend/public/lib/*.',
  '401/403: check BACKEND_URL, TOKEN_ID, TOKEN_KEY, ACCESS_TOKEN. ACCESS_TOKEN must not include "bearer"; BACKEND_URL must not end with "/"; token may be expired.',
  '404 asset: check public/lib file names.',
  'No camera: use CCCD OCR Upload Only.',
  'Document type mismatch: try Auto Detect Upload so VNPT classifies front/back before validation.',
  'No callback: check CALL_BACK, CALL_BACK_END_FLOW, CALL_BACK_DOCUMENT_RESULT.',
  'CORS: check VNPT sandbox allowed origin for http://127.0.0.1:5173 or http://localhost:5173.',
];

function hasValue(value: string) {
  return value.trim().length > 0;
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

function parseStoredResult(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function VnptEkycTestPage() {
  const vnptEnv = useMemo(() => getVnptEnv(), []);
  const [selectedModeValue, setSelectedModeValue] = useState<VnptEkycModeValue>(() => vnptEnv.defaultMode);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [documentResult, setDocumentResult] = useState<unknown>(null);
  const [result, setResult] = useState<unknown>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const selectedMode = useMemo(() => getVnptEkycMode(selectedModeValue), [selectedModeValue]);
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const isFileProtocol = window.location.protocol === 'file:';

  const handleModeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedModeValue(getVnptEkycMode(event.target.value).value);
  }, []);

  const handleDocumentResult = useCallback(async (callbackResult: unknown) => {
    console.log('VNPT eKYC document result:', callbackResult);
    setDocumentResult(callbackResult);

    try {
      localStorage.setItem(LAST_DOCUMENT_RESULT_STORAGE_KEY, JSON.stringify(callbackResult));
    } catch (error) {
      setLastError(`Could not persist document callback result: ${getErrorMessage(error)}`);
    }
  }, []);

  const handleEkycResult = useCallback(async (callbackResult: unknown) => {
    console.log('VNPT eKYC final result:', callbackResult);
    setResult(callbackResult);

    try {
      localStorage.setItem(LAST_FINAL_RESULT_STORAGE_KEY, JSON.stringify(callbackResult));
    } catch (error) {
      setLastError(`Could not persist final callback result: ${getErrorMessage(error)}`);
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
    setDocumentResult(parseStoredResult(localStorage.getItem(LAST_DOCUMENT_RESULT_STORAGE_KEY)));
    setResult(parseStoredResult(localStorage.getItem(LAST_FINAL_RESULT_STORAGE_KEY)));
  }, []);

  const launchVnptEkyc = useCallback(() => {
    setLastError(null);
    refreshSdkStatus();

    if (!window.SDK?.launch) {
      setLastError('VNPT SDK is not loaded. Check public SDK files and index.html scripts.');
      return;
    }

    if (!vnptEnv.enabled) {
      setLastError('VNPT eKYC SDK test is disabled. Set VITE_VNPT_EKYC_ENABLED=true.');
      return;
    }

    const missingConfig = [
      { label: 'BACKEND_URL', value: vnptEnv.backendUrl },
      { label: 'TOKEN_ID', value: vnptEnv.tokenId },
      { label: 'TOKEN_KEY', value: vnptEnv.tokenKey },
      { label: 'ACCESS_TOKEN', value: vnptEnv.accessToken },
    ].filter((item) => !hasValue(item.value));

    if (missingConfig.length > 0) {
      setLastError(`Missing VNPT env values: ${missingConfig.map((item) => item.label).join(', ')}. Create frontend/.env.local and restart Vite.`);
      return;
    }

    const dataConfig = buildVnptEkycConfig(selectedMode, vnptEnv, {
      handleEkycResult,
      handleDocumentResult,
    });

    try {
      window.SDK.launch(dataConfig);
    } catch (error) {
      console.error('VNPT eKYC launch error:', error);
      setLastError(getErrorMessage(error));
    }
  }, [handleDocumentResult, handleEkycResult, refreshSdkStatus, selectedMode, vnptEnv]);

  const clearResult = useCallback(() => {
    setDocumentResult(null);
    setResult(null);
    setLastError(null);
    localStorage.removeItem(LAST_DOCUMENT_RESULT_STORAGE_KEY);
    localStorage.removeItem(LAST_FINAL_RESULT_STORAGE_KEY);
  }, []);

  const copyResultJson = useCallback(async () => {
    const copyTarget = result ?? documentResult;

    if (copyTarget === null) {
      setLastError('No VNPT result JSON to copy yet.');
      return;
    }

    try {
      await navigator.clipboard.writeText(safeStringify(copyTarget));
      setLastError(null);
    } catch (error) {
      setLastError(`Could not copy result JSON: ${getErrorMessage(error)}`);
    }
  }, [documentResult, result]);

  const checklist = useMemo(
    () => [
      { label: 'SDK script loaded', value: sdkLoaded ? 'yes' : 'no', ok: sdkLoaded },
      { label: 'BACKEND_URL exists', value: hasValue(vnptEnv.backendUrl) ? 'yes' : 'no', ok: hasValue(vnptEnv.backendUrl) },
      { label: 'TOKEN_ID exists', value: hasValue(vnptEnv.tokenId) ? 'yes' : 'no', ok: hasValue(vnptEnv.tokenId) },
      { label: 'TOKEN_KEY exists', value: hasValue(vnptEnv.tokenKey) ? 'yes' : 'no', ok: hasValue(vnptEnv.tokenKey) },
      { label: 'ACCESS_TOKEN exists', value: hasValue(vnptEnv.accessToken) ? 'yes' : 'no', ok: hasValue(vnptEnv.accessToken) },
      {
        label: 'ACCESS_TOKEN has no bearer prefix',
        value: accessTokenHasBearerPrefix(vnptEnv.rawAccessToken) ? 'no' : 'yes',
        ok: !accessTokenHasBearerPrefix(vnptEnv.rawAccessToken),
      },
      { label: 'Browser uses localhost/127.0.0.1', value: isLocalhost && !isFileProtocol ? 'yes' : 'no', ok: isLocalhost && !isFileProtocol },
      { label: 'Test mode', value: selectedMode.label },
      { label: 'Camera required', value: selectedMode.useWebcam ? 'yes' : 'no' },
    ],
    [isFileProtocol, isLocalhost, sdkLoaded, selectedMode.label, selectedMode.useWebcam, vnptEnv],
  );

  const summary = useMemo(() => summarizeVnptResult(result ?? documentResult), [documentResult, result]);
  const summaryItems = useMemo(
    () => [
      { label: 'Document type', value: summary.documentType },
      { label: 'OCR returned', value: summary.ocrReturned ? 'yes' : 'no' },
      { label: 'Card front liveness returned', value: summary.cardFrontLivenessReturned ? 'yes' : 'no' },
      { label: 'Card back liveness returned', value: summary.cardBackLivenessReturned ? 'yes' : 'no' },
      { label: 'Face liveness returned', value: summary.faceLivenessReturned ? 'yes' : 'no' },
      { label: 'Masked face returned', value: summary.maskedFaceReturned ? 'yes' : 'no' },
      { label: 'Face compare returned', value: summary.faceCompareReturned ? 'yes' : 'no' },
      { label: 'QR returned', value: summary.qrReturned ? 'yes' : 'no' },
    ],
    [summary],
  );

  const documentResultJson = documentResult === null ? 'No document callback result yet.' : safeStringify(documentResult);
  const finalResultJson = result === null ? 'No final callback result yet.' : safeStringify(result);

  return (
    <main className="vnpt-test-page">
      <div className="vnpt-test-shell">
        <header className="vnpt-test-header">
          <p className="vnpt-test-eyebrow">Dev sandbox</p>
          <div className="vnpt-test-header-row">
            <div>
              <h1 className="vnpt-test-title">VNPT eKYC SDK Test</h1>
              <p className="vnpt-test-description">
                This page only checks the VNPT CCCD sandbox flow. It does not call ManabiHub backend or store KYC data.
              </p>
            </div>
            <div className="vnpt-test-actions">
              <button
                className="vnpt-test-button vnpt-test-button-primary"
                disabled={!vnptEnv.enabled}
                type="button"
                onClick={launchVnptEkyc}
              >
                Launch VNPT eKYC
              </button>
              <button className="vnpt-test-button vnpt-test-button-secondary" type="button" onClick={clearResult}>
                Clear Result
              </button>
              <button className="vnpt-test-button vnpt-test-button-secondary" type="button" onClick={copyResultJson}>
                Copy Result JSON
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
          <h2 className="vnpt-test-card-title">Test mode</h2>
          <div className="vnpt-test-mode-row">
            <label className="vnpt-test-field">
              <span>Mode selector</span>
              <select className="vnpt-test-select" value={selectedModeValue} onChange={handleModeChange}>
                {VNPT_EKYC_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="vnpt-test-mode-meta">
              <strong>{selectedMode.label}</strong>
              <span>{selectedMode.description}</span>
              <span>
                SDK_FLOW={selectedMode.sdkFlow}, USE_METHOD={selectedMode.useMethod}, DOCUMENT_TYPE_START=
                {selectedMode.documentTypeStart}, HAS_QR_SCAN={String(selectedMode.hasQrScan)}
              </span>
            </div>
          </div>
        </section>

        <div className="vnpt-test-warning">
          Máy hiện không có camera. Hãy dùng CCCD OCR Upload Only để test OCR trước. Full face/liveness có thể yêu cầu
          camera thật tùy cấu hình sandbox VNPT.
        </div>

        <section className="vnpt-test-card">
          <h2 className="vnpt-test-card-title">Debug checklist</h2>
          <div className="vnpt-test-checklist">
            {checklist.map((item) => (
              <div key={item.label} className="vnpt-test-checklist-item">
                <span>{item.label}</span>
                <span className={item.ok === undefined ? 'vnpt-test-muted' : item.ok ? 'vnpt-test-ok' : 'vnpt-test-bad'}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="vnpt-test-card">
          <h2 className="vnpt-test-card-title">Result summary</h2>
          <div className="vnpt-test-summary-grid">
            {summaryItems.map((item) => (
              <div key={item.label} className="vnpt-test-summary-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="vnpt-test-card">
          <h2 className="vnpt-test-card-title">Last document callback result</h2>
          <pre className="vnpt-test-code vnpt-test-code-result">
            {documentResultJson}
          </pre>
        </section>

        <section className="vnpt-test-card">
          <h2 className="vnpt-test-card-title">Last final callback result</h2>
          <pre className="vnpt-test-code vnpt-test-code-result">
            {finalResultJson}
          </pre>
        </section>

        <section className="vnpt-test-card">
          <h2 className="vnpt-test-card-title">Local token guide</h2>
          <p className="vnpt-test-copy">
            Create <code>frontend/.env.local</code>, then restart Vite after any change. Do not commit real token values.
            ACCESS_TOKEN may expire after several hours and must not include bearer.
          </p>
          <pre className="vnpt-test-code vnpt-test-code-small">
            {`VITE_VNPT_EKYC_BACKEND_URL=https://sandbox-idg.vnpt.vn
VITE_VNPT_EKYC_TOKEN_ID=...
VITE_VNPT_EKYC_TOKEN_KEY=...
VITE_VNPT_EKYC_ACCESS_TOKEN=...
VITE_VNPT_EKYC_ENABLED=true
VITE_VNPT_EKYC_DEFAULT_MODE=CCCD_OCR_UPLOAD`}
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
