type VnptSdkCallback = (result: unknown) => Promise<void> | void;
const DEFAULT_VNPT_SDK_SCRIPT_URLS = ['/web-sdk-version-3.2.1.0.js'];

declare global {
  interface Window {
    SDK?: {
      launch: (config: Record<string, unknown>) => void;
    };
  }
}

export interface VnptIdentityResult {
  providerSessionId?: string | null;
  providerTransactionId?: string | null;
  sdkResult: Record<string, unknown>;
}

export async function launchVnptIdentitySdk(onResult: (result: VnptIdentityResult) => Promise<void> | void) {
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

  const handleResult: VnptSdkCallback = async (sdkResult) => {
    const normalizedResult = normalizeSdkResult(sdkResult);

    await onResult({
      providerSessionId: findFirstValue(normalizedResult, ['session', 'sessionid', 'session_id']),
      providerTransactionId: findFirstValue(normalizedResult, ['transaction', 'transactionid', 'requestid', 'request_id']),
      sdkResult: normalizedResult,
    });
  };

  window.SDK.launch({
    BACKEND_URL: env.backendUrl,
    TOKEN_KEY: env.tokenKey,
    TOKEN_ID: env.tokenId,
    ACCESS_TOKEN: env.accessToken,

    HAS_RESULT_SCREEN: true,
    HAS_BACKGROUND_IMAGE: true,
    MAX_SIZE_IMAGE: 5,
    LIST_TYPE_DOCUMENT: [9],
    DOCUMENT_TYPE_START: 9,
    DEFAULT_LANGUAGE: 'vi',
    SHOW_STEP: true,
    HAS_QR_SCAN: false,
    SHOW_TAB_RESULT_INFORMATION: true,
    SHOW_TAB_RESULT_VALIDATION: true,

    SDK_FLOW: 'DOCUMENT_TO_FACE',
    FLOW_TAKEN: 'DOCUMENT_TO_FACE',
    USE_METHOD: 'BOTH',

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

    CALL_BACK: handleResult,
    CALL_BACK_END_FLOW: handleResult,
    CALL_BACK_DOCUMENT_RESULT: handleResult,
  });
}

function getVnptEnv() {
  return {
    enabled: import.meta.env.VITE_VNPT_EKYC_ENABLED !== 'false',
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

function normalizeSdkResult(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {
    rawResult: value,
  };
}

function findFirstValue(source: Record<string, unknown>, keyParts: string[]) {
  const entries = flattenEntries(source);
  const match = entries.find((entry) => {
    const key = entry.key.replace(/[-_.]/g, '').toLowerCase();
    return keyParts.some((part) => key.includes(part.toLowerCase().replace(/[-_.]/g, ''))) && hasValue(entry.value);
  });

  return match ? String(match.value) : null;
}

function flattenEntries(source: unknown) {
  const entries: Array<{ key: string; value: unknown }> = [];
  const seen = new WeakSet<object>();

  function walk(current: unknown, prefix: string, depth: number) {
    if (current === null || typeof current !== 'object' || depth > 8 || seen.has(current)) {
      return;
    }

    seen.add(current);

    if (Array.isArray(current)) {
      current.forEach((item, index) => walk(item, `${prefix}.${index}`, depth + 1));
      return;
    }

    Object.entries(current as Record<string, unknown>).forEach(([key, value]) => {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      entries.push({ key: nextKey, value });
      walk(value, nextKey, depth + 1);
    });
  }

  walk(source, '', 0);
  return entries;
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
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
