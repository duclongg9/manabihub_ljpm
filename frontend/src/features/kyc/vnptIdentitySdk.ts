type VnptSdkCallback = (result: unknown) => Promise<void> | void;

const DEFAULT_VNPT_SDK_SCRIPT_URLS = [
  '/web-sdk-version-3.2.1.0.js',
  '/lib/VNPTQRBrowserApp.js',
  '/lib/VNPTBrowserSDKAppV4.1.0.js',
];

const PROVIDER_SESSION_ID_ALIASES = ['providersessionid', 'sessionid', 'clientsession'];
const PROVIDER_TRANSACTION_ID_ALIASES = [
  'providertransactionid',
  'transactionid',
  'requestid',
  'txid',
];
const MAX_SDK_RESULT_DEPTH = 8;
const MAX_SDK_ARRAY_ITEMS = 50;
const MAX_SDK_STRING_LENGTH = 4_096;
const OMITTED = Symbol('omitted');

declare global {
  interface Window {
    SDK?: {
      launch: (config: Record<string, unknown>) => void;
    };
    __MANABIHUB_LAST_VNPT_CONFIG__?: Record<string, unknown>;
  }
}

export interface VnptIdentityResult {
  providerSessionId?: string | null;
  providerTransactionId?: string | null;
  sdkResult: Record<string, unknown>;
}

export interface VnptIdentitySdkOptions {
  /** Receives terminal SDK/callback errors because VNPT does not await async callbacks. */
  onError?: (error: Error) => void;
}

const LEGACY_VNPT_STORAGE_KEYS = ['vnpt_ekyc_last_document_result', 'vnpt_ekyc_last_result'];

/** Remove raw CCCD/provider payloads written by pre-release SDK bridges. */
export function cleanupLegacyVnptIdentityStorage() {
  try {
    LEGACY_VNPT_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage can be unavailable in private browsing; never block KYC startup.
  }
}

export function resetVnptIdentitySdkRuntime() {
  delete window.SDK;
  delete window.__MANABIHUB_LAST_VNPT_CONFIG__;
  document.querySelectorAll<HTMLScriptElement>('script[data-vnpt-sdk]').forEach((script) => script.remove());
  cleanupLegacyVnptIdentityStorage();
}

export async function launchVnptIdentitySdk(
  onResult: (result: VnptIdentityResult) => Promise<void> | void,
  options: VnptIdentitySdkOptions = {},
) {
  const env = getVnptEnv();

  if (!env.enabled) {
    throw new Error('VNPT eKYC SDK đang tắt. Hãy đặt VITE_VNPT_EKYC_ENABLED=true trong môi trường chạy.');
  }

  await loadVnptScripts(env.scriptUrls);

  if (!window.SDK?.launch) {
    throw new Error('Không tải được VNPT eKYC SDK. Kiểm tra frontend/public/web-sdk-version-3.2.1.0.js và frontend/public/lib/.');
  }

  const missingConfig = [
    { label: 'VITE_VNPT_EKYC_BACKEND_URL', value: env.backendUrl },
    { label: 'VITE_VNPT_EKYC_TOKEN_ID', value: env.tokenId },
    { label: 'VITE_VNPT_EKYC_TOKEN_KEY', value: env.tokenKey },
    { label: 'VITE_VNPT_EKYC_ACCESS_TOKEN', value: env.accessToken },
  ].filter((item) => !item.value);

  if (missingConfig.length > 0) {
    throw new Error(`Thiếu cấu hình VNPT eKYC: ${missingConfig.map((item) => item.label).join(', ')}`);
  }

  let documentResult: Record<string, unknown> | null = null;
  let callbackResult: Record<string, unknown> | null = null;
  let finalResultHandled = false;

  const reportCallbackError = (error: unknown) => {
    options.onError?.(toError(error));
  };

  const submitTerminalResult = async (terminalResult: Record<string, unknown>) => {
    if (finalResultHandled) {
      return;
    }

    const compactResult = mergeSdkResults(documentResult, callbackResult, terminalResult);
    const providerSessionId = findExactValue(compactResult, PROVIDER_SESSION_ID_ALIASES);
    const providerTransactionId = findExactValue(compactResult, PROVIDER_TRANSACTION_ID_ALIASES);

    finalResultHandled = true;
    await onResult({
      providerSessionId,
      providerTransactionId,
      sdkResult: compactResult,
    });
  };

  const handleDocumentResult: VnptSdkCallback = (sdkResult) => {
    documentResult = compactSdkResult(sdkResult);
  };

  // CALL_BACK is an intermediate OCR/liveness event. Correlation IDs may already be
  // present there, but they do not prove that the flow is complete. Only END_FLOW is
  // terminal so partial evidence is never submitted.
  const handleCallbackResult: VnptSdkCallback = (sdkResult) => {
    callbackResult = compactSdkResult(sdkResult);
  };

  const handleEndFlowResult: VnptSdkCallback = (sdkResult) => {
    void submitTerminalResult(compactSdkResult(sdkResult)).catch(reportCallbackError);
  };

  // Config follows VNPT eKYC Web SDK 3.2.1 docs. Callbacks stay in-process; this
  // flow never reuses the OAuth /auth/callback route.
  const dataConfig = {
    BACKEND_URL: env.backendUrl,
    TOKEN_KEY: env.tokenKey,
    TOKEN_ID: env.tokenId,
    ACCESS_TOKEN: env.accessToken,
    CALL_BACK: handleCallbackResult,
    CALL_BACK_END_FLOW: handleEndFlowResult,
    CALL_BACK_DOCUMENT_RESULT: handleDocumentResult,
    HAS_BACKGROUND_IMAGE: true,
    HAS_RESULT_SCREEN: true,
    SHOW_STEP: true,
    MAX_SIZE_IMAGE: 1,
    DEFAULT_LANGUAGE: 'vi',
    LIST_TYPE_DOCUMENT: [9],
    HAS_QR_SCAN: false,
    SDK_FLOW: 'DOCUMENT_TO_FACE',
    FLOW_TAKEN: 'DOCUMENT_TO_FACE',
    USE_METHOD: 'PHOTO_AND_UPLOAD',
    ENABLE_API_UPLOAD_IMAGE: true,
    ENABLE_API_OCR_DOCUMENT: true,
    ENABLE_API_LIVENESS_DOCUMENT: true,
    ENABLE_API_LIVENESS_FACE: true,
    ENABLE_API_MASKED_FACE: true,
    ENABLE_API_COMPARE_FACE: true,
    CHECK_LIVENESS_CARD: true,
    CHECK_LIVENESS_FACE: true,
    CHECK_MASKED_FACE: true,
    COMPARE_FACE: true,
    SHOW_TAB_RESULT_INFORMATION: true,
    SHOW_TAB_RESULT_VALIDATION: true,
    SHOW_TAB_RESULT_QRCODE: true,
  };

  // Deliberately expose only booleans for browser credentials. Raw SDK results,
  // CCCD images and access tokens must never be written to browser storage/debug state.
  window.__MANABIHUB_LAST_VNPT_CONFIG__ = safeDebugConfig(dataConfig);
  window.SDK.launch(dataConfig);
}

function getVnptEnv() {
  return {
    enabled: String(import.meta.env.VITE_VNPT_EKYC_ENABLED ?? '').trim().toLowerCase() === 'true',
    scriptUrls: resolveScriptUrls(import.meta.env.VITE_VNPT_EKYC_SDK_SCRIPT_URLS),
    backendUrl: normalizeBackendUrl(import.meta.env.VITE_VNPT_EKYC_BACKEND_URL),
    tokenId: (import.meta.env.VITE_VNPT_EKYC_TOKEN_ID ?? '').trim(),
    tokenKey: (import.meta.env.VITE_VNPT_EKYC_TOKEN_KEY ?? '').trim(),
    accessToken: sanitizeAccessToken(import.meta.env.VITE_VNPT_EKYC_ACCESS_TOKEN),
  };
}

async function loadVnptScripts(scriptUrls: string[]) {
  if (window.SDK?.launch) {
    return;
  }

  for (const url of scriptUrls) {
    await loadScript(url);
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existingScript = findLoadedScript(src);

    if (existingScript?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script = existingScript ?? document.createElement('script');
    script.dataset.vnptSdk = src;
    script.async = true;
    script.src = src;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Không tải được VNPT SDK script: ${src}`));

    if (!existingScript) {
      document.head.appendChild(script);
    }
  });
}

function findLoadedScript(src: string) {
  return Array.from(document.querySelectorAll<HTMLScriptElement>('script[data-vnpt-sdk]')).find(
    (script) => script.dataset.vnptSdk === src,
  );
}

function compactSdkResult(value: unknown): Record<string, unknown> {
  const compacted = compactSdkValue(value, 0, new WeakSet<object>());

  if (compacted && compacted !== OMITTED && typeof compacted === 'object' && !Array.isArray(compacted)) {
    return compacted as Record<string, unknown>;
  }

  return compacted === OMITTED ? {} : { rawResult: compacted };
}

function compactSdkValue(value: unknown, depth: number, seen: WeakSet<object>): unknown | typeof OMITTED {
  if (value == null || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (looksLikeEmbeddedMedia(trimmed) || trimmed.length > MAX_SDK_STRING_LENGTH) {
      return OMITTED;
    }
    return trimmed;
  }

  if (typeof value !== 'object' || depth > MAX_SDK_RESULT_DEPTH || seen.has(value)) {
    return OMITTED;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_SDK_ARRAY_ITEMS)
      .map((item) => compactSdkValue(item, depth + 1, seen))
      .filter((item) => item !== OMITTED);
  }

  const result: Record<string, unknown> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
    if (isSensitiveOrBinaryKey(key)) {
      return;
    }

    const compacted = compactSdkValue(nestedValue, depth + 1, seen);
    if (compacted !== OMITTED) {
      result[key] = compacted;
    }
  });
  return result;
}

function mergeSdkResults(
  documentResult: Record<string, unknown> | null,
  callbackResult: Record<string, unknown> | null,
  endFlowResult: Record<string, unknown> | null,
) {
  const result: Record<string, unknown> = {};
  if (documentResult && Object.keys(documentResult).length > 0) result.documentResult = documentResult;
  if (callbackResult && Object.keys(callbackResult).length > 0) result.callbackResult = callbackResult;
  if (endFlowResult && Object.keys(endFlowResult).length > 0) result.endFlowResult = endFlowResult;
  return result;
}

function findExactValue(source: Record<string, unknown>, aliases: string[]) {
  const entries = flattenEntries(source);

  for (const alias of aliases) {
    const match = entries.find((entry) => normalizeKey(entry.key) === alias && isScalarValue(entry.value));
    if (match) {
      return String(match.value).trim();
    }
  }

  return null;
}

function flattenEntries(source: unknown) {
  const entries: Array<{ key: string; value: unknown }> = [];
  const seen = new WeakSet<object>();

  function walk(current: unknown, depth: number) {
    if (current === null || typeof current !== 'object' || depth > MAX_SDK_RESULT_DEPTH || seen.has(current)) {
      return;
    }

    seen.add(current);
    if (Array.isArray(current)) {
      current.forEach((item) => walk(item, depth + 1));
      return;
    }

    Object.entries(current as Record<string, unknown>).forEach(([key, value]) => {
      entries.push({ key, value });
      walk(value, depth + 1);
    });
  }

  walk(source, 0);
  return entries;
}

function isScalarValue(value: unknown) {
  return (typeof value === 'string' || typeof value === 'number') && String(value).trim().length > 0;
}

function isSensitiveOrBinaryKey(key: string) {
  const normalized = normalizeKey(key);
  if (
    normalized.includes('authorization')
    || normalized.includes('accesstoken')
    || normalized.includes('accesskey')
    || normalized.includes('tokenkey')
    || normalized.includes('tokenid')
    || normalized.includes('secret')
    || normalized.includes('apikey')
    || normalized.includes('password')
    || normalized.includes('cookie')
    || normalized === 'header'
    || normalized === 'headers'
    || normalized.includes('headersrequest')
    || normalized.includes('signature')
  ) {
    return true;
  }

  return normalized.includes('base64')
    || normalized.includes('blob')
    || normalized.includes('filecontent')
    || normalized.includes('filedata')
    || normalized.includes('videodata');
}

function looksLikeEmbeddedMedia(value: string) {
  return /^data:(image|video|application)\//i.test(value) || /^[A-Za-z0-9+/]{8_000,}={0,2}$/.test(value);
}

function normalizeKey(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error('VNPT eKYC không trả về kết quả hợp lệ. Vui lòng thử lại.');
}

function safeDebugConfig(config: Record<string, unknown>) {
  return {
    BACKEND_URL: config.BACKEND_URL,
    TOKEN_ID_EXISTS: Boolean(config.TOKEN_ID),
    TOKEN_KEY_EXISTS: Boolean(config.TOKEN_KEY),
    ACCESS_TOKEN_EXISTS: Boolean(config.ACCESS_TOKEN),
    ACCESS_TOKEN_HAS_BEARER_PREFIX: String(config.ACCESS_TOKEN ?? '').toLowerCase().startsWith('bearer '),
    SDK_FLOW: config.SDK_FLOW,
    FLOW_TAKEN: config.FLOW_TAKEN,
    USE_METHOD: config.USE_METHOD,
    HAS_QR_SCAN: config.HAS_QR_SCAN,
    LIST_TYPE_DOCUMENT: config.LIST_TYPE_DOCUMENT,
    CHECK_LIVENESS_CARD: config.CHECK_LIVENESS_CARD,
    CHECK_LIVENESS_FACE: config.CHECK_LIVENESS_FACE,
    CHECK_MASKED_FACE: config.CHECK_MASKED_FACE,
    COMPARE_FACE: config.COMPARE_FACE,
    ENABLE_API_UPLOAD_IMAGE: config.ENABLE_API_UPLOAD_IMAGE,
    ENABLE_API_OCR_DOCUMENT: config.ENABLE_API_OCR_DOCUMENT,
    ENABLE_API_LIVENESS_DOCUMENT: config.ENABLE_API_LIVENESS_DOCUMENT,
    ENABLE_API_LIVENESS_FACE: config.ENABLE_API_LIVENESS_FACE,
    ENABLE_API_MASKED_FACE: config.ENABLE_API_MASKED_FACE,
    ENABLE_API_COMPARE_FACE: config.ENABLE_API_COMPARE_FACE,
  };
}

function splitCsv(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveScriptUrls(value: string | undefined) {
  const configuredUrls = splitCsv(value);
  return configuredUrls.length > 0 ? configuredUrls : DEFAULT_VNPT_SDK_SCRIPT_URLS;
}

function normalizeBackendUrl(value: string | undefined) {
  return (value ?? '').trim().replace(/\/+$/, '');
}

function sanitizeAccessToken(value: string | undefined) {
  return (value ?? '').trim().replace(/^bearer\s+/i, '');
}
