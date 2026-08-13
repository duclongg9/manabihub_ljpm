type VnptSdkCallback = (result: unknown) => Promise<void> | void;

const DEFAULT_VNPT_SDK_SCRIPT_URLS = [
  '/web-sdk-version-3.2.1.0.js',
  '/lib/VNPTQRBrowserApp.js',
  '/lib/VNPTBrowserSDKAppV4.1.0.js',
];
const APPROVED_VNPT_BACKEND_ORIGINS = new Set([
  'https://api.idg.vnpt.vn',
  'https://sandbox-idg.vnpt.vn',
]);

const PROVIDER_SESSION_ID_ALIASES = ['providersessionid', 'sessionid', 'clientsession'];
const PROVIDER_TRANSACTION_ID_ALIASES = [
  'providertransactionid',
  'transactionid',
  'txid',
];
const PROVIDER_TRANSACTION_ID_FALLBACK_ALIASES = ['requestid'];
const MAX_SDK_RESULT_DEPTH = 8;
const MAX_SDK_ARRAY_ITEMS = 50;
const MAX_SDK_STRING_LENGTH = 4_096;
const OMITTED = Symbol('omitted');
const VNPT_PROVIDER_ERROR_MESSAGE =
  'VNPT eKYC không thể xử lý phiên xác minh. Vui lòng kiểm tra kết nối, cấu hình VNPT và thử lại.';
const VNPT_AUTH_ERROR_MESSAGE =
  'Phiên xác thực VNPT đã hết hạn hoặc không được chấp nhận. Vui lòng cập nhật cấu hình xác thực và thử lại.';
const VNPT_TRANSPORT_ERROR_MESSAGE =
  'Không thể kết nối dịch vụ VNPT eKYC. Vui lòng kiểm tra mạng và thử lại.';

/** Match only the response.object.hash dereference seen in VNPT 3.2.1. */
function isVnptHashDereference(message: string) {
  const normalized = message.toLowerCase();
  return /cannot read propert(?:y|ies) of (?:undefined|null).*['"]hash['"]/.test(normalized)
    || /(?:undefined|null) is not an object.*\.object\.hash/.test(normalized)
    || /\.object is (?:undefined|null)/.test(normalized)
    || /can't access property ['"]hash['"].*\.object is (?:undefined|null)/.test(normalized);
}

declare global {
  interface Window {
    SDK?: {
      launch: (config: Record<string, unknown>) => void;
    };
    __MANABIHUB_LAST_VNPT_CONFIG__?: Record<string, unknown>;
    __MANABIHUB_VNPT_ACTIVE_LAUNCH__?: {
      cleanup: () => void;
    };
  }
}

let vnptLaunchGeneration = 0;

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
  vnptLaunchGeneration += 1;
  if (window.__MANABIHUB_VNPT_ACTIVE_LAUNCH__) {
    window.__MANABIHUB_VNPT_ACTIVE_LAUNCH__.cleanup();
    delete window.__MANABIHUB_VNPT_ACTIVE_LAUNCH__;
  }
  delete window.SDK;
  delete window.__MANABIHUB_LAST_VNPT_CONFIG__;
  document.querySelectorAll<HTMLScriptElement>('script[data-vnpt-sdk]').forEach((script) => script.remove());
  cleanupLegacyVnptIdentityStorage();
}

/**
 * Local-only early warning for JWT tokens that appear to have expired based on
 * the `exp` claim. This does NOT authenticate the token — server-side
 * validation is the only source of truth. Opaque tokens (non-JWT) are treated
 * as unverifiable and pass through without error.
 *
 * Supports standard base64 and base64url-encoded payloads.
 */
function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false; // Opaque token — cannot check expiry locally
    const base64Url = parts[1];
    // Convert base64url to standard base64
    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), '=');
    const decoded = atob(base64);
    const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { exp?: unknown };
    // Avoid starting a camera flow with a token that expires during the next five minutes.
    const MINIMUM_REMAINING_LIFETIME_MS = 5 * 60 * 1000;
    return typeof payload.exp === 'number'
      && Number.isFinite(payload.exp)
      && payload.exp * 1000 <= Date.now() + MINIMUM_REMAINING_LIFETIME_MS;
  } catch {
    return false; // Cannot parse — treat as opaque / unverifiable
  }
}

export async function launchVnptIdentitySdk(
  onResult: (result: VnptIdentityResult) => Promise<void> | void,
  options: VnptIdentitySdkOptions = {},
) {
  const launchGeneration = ++vnptLaunchGeneration;
  cleanupLegacyVnptIdentityStorage();
  if (window.__MANABIHUB_VNPT_ACTIVE_LAUNCH__) {
    window.__MANABIHUB_VNPT_ACTIVE_LAUNCH__.cleanup();
  }
  const env = getVnptEnv();

  if (!env.enabled) {
    throw new Error('VNPT eKYC SDK đang tắt. Hãy đặt VITE_VNPT_EKYC_ENABLED=true trong môi trường chạy.');
  }

  // Validate all required config BEFORE loading vendor scripts into the page
  const missingConfig = [
    { label: 'VITE_VNPT_EKYC_BACKEND_URL', value: env.backendUrl },
    { label: 'VITE_VNPT_EKYC_TOKEN_ID', value: env.tokenId },
    { label: 'VITE_VNPT_EKYC_TOKEN_KEY', value: env.tokenKey },
    { label: 'VITE_VNPT_EKYC_ACCESS_TOKEN', value: env.accessToken },
  ].filter((item) => !item.value);

  if (missingConfig.length > 0) {
    throw new Error(`Thiếu cấu hình VNPT eKYC: ${missingConfig.map((item) => item.label).join(', ')}`);
  }

  if (isJwtExpired(env.accessToken)) {
    throw new Error('Phiên xác thực VNPT đã hết hạn hoặc cấu hình chưa hợp lệ. Vui lòng cập nhật thông tin xác thực và thử lại.');
  }

  if (!env.challengeCode) {
    throw new Error(
      'Thiếu VITE_VNPT_EKYC_CHALLENGE_CODE. Challenge code là bắt buộc khi VNPT eKYC được bật.',
    );
  }

  await loadVnptScripts(env.scriptUrls);

  if (launchGeneration !== vnptLaunchGeneration) {
    return;
  }

  if (!window.SDK?.launch) {
    throw new Error('Không tải được VNPT eKYC SDK. Kiểm tra frontend/public/web-sdk-version-3.2.1.0.js và frontend/public/lib/.');
  }

  // --- Per-launch state: fresh for every launch, cleaned up on terminal event ---
  let documentResult: Record<string, unknown> | null = null;
  let callbackResult: Record<string, unknown> | null = null;
  let finalResultHandled = false;
  let errorFired = false;
  let isCleanedUp = false;
  let restoreFetchGuard: (() => void) | null = null;
  const configuredScriptSources = resolveConfiguredScriptSources(env.scriptUrls);

  const onWindowError = (event: ErrorEvent) => {
    if (isCleanedUp) return;
    const message = event.error?.message || event.message || '';
    const stack = readStringProperty(event.error, 'stack');
    const source = event.filename
      || readStringProperty(event.error, 'sourceURL')
      || readStringProperty(event.error, 'fileName');
    if (isVnptHashDereference(message)
        && isConfiguredVnptSource(source, stack, configuredScriptSources)) {
      event.preventDefault();
      failLaunch(new Error(VNPT_PROVIDER_ERROR_MESSAGE));
    }
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (isCleanedUp) return;
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : readStringProperty(reason, 'message');
    const stack = readStringProperty(reason, 'stack');
    const source = readStringProperty(reason, 'sourceURL') || readStringProperty(reason, 'fileName');
    if (isVnptHashDereference(message)
        && isConfiguredVnptSource(source, stack, configuredScriptSources)) {
      event.preventDefault();
      failLaunch(new Error(VNPT_PROVIDER_ERROR_MESSAGE));
    }
  };

  const cleanupLaunch = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    documentResult = null;
    callbackResult = null;
    window.removeEventListener('error', onWindowError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    restoreFetchGuard?.();
    restoreFetchGuard = null;
    if (window.__MANABIHUB_VNPT_ACTIVE_LAUNCH__?.cleanup === cleanupLaunch) {
      delete window.__MANABIHUB_VNPT_ACTIVE_LAUNCH__;
    }
  };

  const failLaunch = (error: Error) => {
    if (errorFired) return;
    errorFired = true;
    cleanupLaunch();
    options.onError?.(error);
  };

  window.addEventListener('error', onWindowError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
  restoreFetchGuard = installVnptFetchGuard(env.backendUrl, failLaunch);
  window.__MANABIHUB_VNPT_ACTIVE_LAUNCH__ = { cleanup: cleanupLaunch };

  const reportCallbackError = (error: unknown) => {
    failLaunch(toError(error));
  };

  const submitTerminalResult = async (terminalResult: Record<string, unknown>) => {
    if (finalResultHandled) {
      return;
    }

    const providerSessionId = resolveProviderIdentifier(
      [terminalResult, callbackResult, documentResult],
      PROVIDER_SESSION_ID_ALIASES,
      'mã phiên',
    );
    const providerTransactionId = resolveProviderIdentifier(
      [terminalResult, callbackResult, documentResult],
      PROVIDER_TRANSACTION_ID_ALIASES,
      'mã giao dịch',
      PROVIDER_TRANSACTION_ID_FALLBACK_ALIASES,
    );
    const compactResult = mergeSdkResults(documentResult, callbackResult, terminalResult);

    finalResultHandled = true;
    cleanupLaunch();
    await onResult({
      providerSessionId,
      providerTransactionId,
      sdkResult: compactResult,
    });
  };

  const handleDocumentResult: VnptSdkCallback = (sdkResult) => {
    if (isCleanedUp) return;
    documentResult = compactSdkResult(sdkResult);
  };

  // CALL_BACK is an intermediate OCR/liveness event. Correlation IDs may already be
  // present there, but they do not prove that the flow is complete. Only END_FLOW is
  // terminal so partial evidence is never submitted.
  const handleCallbackResult: VnptSdkCallback = (sdkResult) => {
    if (isCleanedUp) return;
    callbackResult = compactSdkResult(sdkResult);
  };

  const handleEndFlowResult: VnptSdkCallback = (sdkResult) => {
    if (isCleanedUp) return;
    void submitTerminalResult(compactSdkResult(sdkResult)).catch(reportCallbackError);
  };

  // Config follows VNPT eKYC Web SDK 3.2.1 docs. Callbacks stay in-process; this
  // flow never reuses the OAuth /auth/callback route.
  const dataConfig: Record<string, unknown> = {
    BACKEND_URL: env.backendUrl,
    TOKEN_KEY: env.tokenKey,
    TOKEN_ID: env.tokenId,
    ACCESS_TOKEN: env.accessToken,
    // The bundled SDK appends this value directly to a query string.
    CHALLENGE_CODE: encodeURIComponent(env.challengeCode),
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
  try {
    window.SDK.launch(dataConfig);
  } catch {
    cleanupLaunch();
    throw new Error(VNPT_PROVIDER_ERROR_MESSAGE);
  }
}

function getVnptEnv() {
  return {
    enabled: String(import.meta.env.VITE_VNPT_EKYC_ENABLED ?? '').trim().toLowerCase() === 'true',
    scriptUrls: resolveScriptUrls(import.meta.env.VITE_VNPT_EKYC_SDK_SCRIPT_URLS),
    backendUrl: normalizeBackendUrl(import.meta.env.VITE_VNPT_EKYC_BACKEND_URL),
    tokenId: (import.meta.env.VITE_VNPT_EKYC_TOKEN_ID ?? '').trim(),
    tokenKey: (import.meta.env.VITE_VNPT_EKYC_TOKEN_KEY ?? '').trim(),
    accessToken: sanitizeAccessToken(import.meta.env.VITE_VNPT_EKYC_ACCESS_TOKEN),
    challengeCode: (import.meta.env.VITE_VNPT_EKYC_CHALLENGE_CODE ?? '').trim(),
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

function resolveProviderIdentifier(
  sourcesInPriorityOrder: Array<Record<string, unknown> | null>,
  aliases: string[],
  label: string,
  fallbackAliases: string[] = [],
) {
  const values = sourcesInPriorityOrder.flatMap((source) => source ? findExactValues(source, aliases) : []);
  const distinctValues = Array.from(new Set(values));
  if (distinctValues.length > 1) {
    throw new Error(`VNPT trả về ${label} không nhất quán. Vui lòng thực hiện lại phiên xác minh.`);
  }
  if (distinctValues[0]) return distinctValues[0];

  const fallbackValues = Array.from(new Set(
    sourcesInPriorityOrder.flatMap((source) => source ? findExactValues(source, fallbackAliases) : []),
  ));
  if (fallbackValues.length > 1) {
    throw new Error(`VNPT trả về ${label} không nhất quán. Vui lòng thực hiện lại phiên xác minh.`);
  }
  return fallbackValues[0] ?? null;
}

function findExactValues(source: Record<string, unknown>, aliases: string[]) {
  const aliasSet = new Set(aliases);
  const values: string[] = [];
  const candidateEnvelopes: Record<string, unknown>[] = [source];
  for (const envelopeKey of ['object', 'data', 'result']) {
    const envelope = findObjectProperty(source, envelopeKey);
    if (envelope) candidateEnvelopes.push(envelope);
  }
  for (const envelope of candidateEnvelopes) {
    for (const [key, value] of Object.entries(envelope)) {
      if (aliasSet.has(normalizeKey(key)) && isScalarValue(value)) {
        const normalized = String(value).trim();
        if (normalized) values.push(normalized);
      }
    }
  }
  return values;
}

function findObjectProperty(source: Record<string, unknown>, expectedKey: string) {
  const entry = Object.entries(source).find(([key]) => normalizeKey(key) === expectedKey);
  return entry?.[1] && typeof entry[1] === 'object' && !Array.isArray(entry[1])
    ? entry[1] as Record<string, unknown>
    : null;
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
    CHALLENGE_CODE_EXISTS: Boolean(config.CHALLENGE_CODE),
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
  const urls = configuredUrls.length > 0 ? configuredUrls : DEFAULT_VNPT_SDK_SCRIPT_URLS;
  urls.forEach((url) => {
    if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return;
    throw new Error(`URL VNPT SDK phải là đường dẫn same-origin bắt đầu bằng '/': ${url}`);
  });
  return urls;
}

function normalizeBackendUrl(value: string | undefined) {
  const normalized = (value ?? '').trim().replace(/\/+$/, '');
  if (!normalized) return '';
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error('VITE_VNPT_EKYC_BACKEND_URL không phải URL hợp lệ.');
  }
  if (!APPROVED_VNPT_BACKEND_ORIGINS.has(parsed.origin)
      || parsed.username
      || parsed.password
      || parsed.pathname !== '/'
      || parsed.search
      || parsed.hash) {
    throw new Error('VITE_VNPT_EKYC_BACKEND_URL phải dùng đúng VNPT production hoặc sandbox origin đã phê duyệt.');
  }
  return parsed.origin;
}

function sanitizeAccessToken(value: string | undefined) {
  return (value ?? '').trim().replace(/^bearer\s+/i, '');
}

interface ConfiguredScriptSource {
  href: string;
  originAndPath: string;
}

function resolveConfiguredScriptSources(scriptUrls: string[]): ConfiguredScriptSource[] {
  return scriptUrls.map((url) => {
    const resolved = new URL(url, document.baseURI);
    return {
      href: resolved.href,
      originAndPath: `${resolved.origin}${resolved.pathname}`,
    };
  });
}

function isConfiguredVnptSource(
  source: string,
  stack: string,
  configuredSources: ConfiguredScriptSource[],
) {
  if (source) {
    try {
      const resolved = new URL(source, document.baseURI);
      const originAndPath = `${resolved.origin}${resolved.pathname}`;
      if (configuredSources.some((configured) => configured.originAndPath === originAndPath)) return true;
    } catch {
      // A malformed source is not trustworthy enough to attribute to VNPT.
    }
  }
  return Boolean(stack && configuredSources.some((configured) =>
    stack.includes(configured.href) || stack.includes(configured.originAndPath)));
}

function readStringProperty(value: unknown, property: string) {
  if (!value || typeof value !== 'object') return '';
  const candidate = (value as Record<string, unknown>)[property];
  return typeof candidate === 'string' ? candidate : '';
}

function installVnptFetchGuard(backendUrl: string, failLaunch: (error: Error) => void) {
  if (typeof window.fetch !== 'function') return () => undefined;

  const originalFetch = window.fetch;
  let active = true;
  const guardedFetch: typeof window.fetch = async (input, init) => {
    const isProviderRequest = isVnptBackendRequest(input, backendUrl);
    try {
      const response = await originalFetch.call(window, input, init);
      if (active && isProviderRequest && (response.status === 401 || response.status === 403)) {
        failLaunch(new Error(VNPT_AUTH_ERROR_MESSAGE));
      }
      return response;
    } catch (error) {
      if (active && isProviderRequest) failLaunch(new Error(VNPT_TRANSPORT_ERROR_MESSAGE));
      throw error;
    }
  };
  window.fetch = guardedFetch;
  return () => {
    active = false;
    if (window.fetch === guardedFetch) window.fetch = originalFetch;
  };
}

function isVnptBackendRequest(input: RequestInfo | URL, backendUrl: string) {
  try {
    const requestUrl = new URL(input instanceof Request ? input.url : String(input), document.baseURI);
    const providerBase = new URL(backendUrl, document.baseURI);
    const basePath = providerBase.pathname.replace(/\/+$/, '');
    return requestUrl.origin === providerBase.origin
      && (!basePath || basePath === '/'
        || requestUrl.pathname === basePath
        || requestUrl.pathname.startsWith(`${basePath}/`));
  } catch {
    return false;
  }
}
