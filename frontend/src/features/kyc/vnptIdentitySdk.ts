type VnptSdkCallback = (result: unknown) => Promise<void> | void;
const DEFAULT_VNPT_SDK_SCRIPT_URLS = [
  '/web-sdk-version-3.2.1.0.js',
  '/lib/VNPTQRBrowserApp.js',
  '/lib/VNPTBrowserSDKAppV4.1.0.js',
];

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

export function resetVnptIdentitySdkRuntime() {
  delete window.SDK;
  delete window.__MANABIHUB_LAST_VNPT_CONFIG__;
  document.querySelectorAll<HTMLScriptElement>('script[data-vnpt-sdk]').forEach((script) => script.remove());
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
  ].filter((item) => !item.value);

  if (missingConfig.length > 0) {
    throw new Error(`Thiếu cấu hình VNPT eKYC: ${missingConfig.map((item) => item.label).join(', ')}`);
  }

  let finalResultHandled = false;
  const handleFinalResult: VnptSdkCallback = async (sdkResult) => {
    if (finalResultHandled) {
      return;
    }

    finalResultHandled = true;
    const normalizedResult = normalizeSdkResult(sdkResult);


    await onResult({
      providerSessionId: findFirstValue(normalizedResult, ['session', 'sessionid', 'session_id']),
      providerTransactionId: findFirstValue(normalizedResult, ['transaction', 'transactionid', 'requestid', 'request_id']),
      sdkResult: normalizedResult,
    });
  };

  // Config follows VNPT eKYC Web SDK 3.2.1 docs.
  const dataConfig = {
    BACKEND_URL: env.backendUrl,
    CALL_BACK: handleFinalResult,
    CALL_BACK_END_FLOW: handleFinalResult,
    HAS_BACKGROUND_IMAGE: true,
    HAS_RESULT_SCREEN: true,
    SHOW_STEP: true,
    MAX_SIZE_IMAGE: 1, // Reduced from 5 to 1 to ensure the total base64 payload stays well under AWS API Gateway's 10MB limit.
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

  window.__MANABIHUB_LAST_VNPT_CONFIG__ = safeDebugConfig(dataConfig);
  window.SDK.launch(dataConfig);
}

function getVnptEnv() {
  return {
    enabled: import.meta.env.VITE_VNPT_EKYC_ENABLED === 'true',
    scriptUrls: resolveScriptUrls(import.meta.env.VITE_VNPT_EKYC_SDK_SCRIPT_URLS),
    backendUrl: normalizeBackendUrl(import.meta.env.VITE_VNPT_EKYC_BACKEND_URL),
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

function safeDebugConfig(config: Record<string, unknown>) {
  return {
    BACKEND_URL: config.BACKEND_URL,
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
