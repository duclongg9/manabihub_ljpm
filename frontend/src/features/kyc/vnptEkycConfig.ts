export type VnptEkycModeValue = 'CCCD_OCR_UPLOAD' | 'CCCD_FULL_UPLOAD' | 'CCCD_FULL_CAMERA';

type VnptSdkFlow = 'DOCUMENT' | 'DOCUMENT_TO_FACE';
type VnptUseMethod = 'UPLOAD' | 'BOTH';

export interface VnptEkycMode {
  value: VnptEkycModeValue;
  label: string;
  description: string;
  sdkFlow: VnptSdkFlow;
  flowTaken: VnptSdkFlow;
  useMethod: VnptUseMethod;
  useWebcam: boolean;
  useUpload: boolean;
  listTypeDocument: number[];
  documentTypeStart: number;
  hasQrScan: boolean;
  enableUploadImage: boolean;
  enableOcrDocument: boolean;
  enableLivenessDocument: boolean;
  enableLivenessFace: boolean;
  enableMaskedFace: boolean;
  enableCompareFace: boolean;
  checkLivenessCard: boolean;
  checkLivenessFace: boolean;
  checkMaskedFace: boolean;
  compareFace: boolean;
}

export interface VnptEnv {
  backendUrl: string;
  tokenId: string;
  tokenKey: string;
  accessToken: string;
  rawAccessToken: string;
  enabled: boolean;
  defaultMode: VnptEkycModeValue;
}

interface VnptCallbacks {
  handleEkycResult: (result: unknown) => Promise<void>;
  handleDocumentResult: (result: unknown) => Promise<void>;
}

export interface VnptResultSummary {
  documentType: string;
  ocrReturned: boolean;
  cardFrontLivenessReturned: boolean;
  cardBackLivenessReturned: boolean;
  faceLivenessReturned: boolean;
  maskedFaceReturned: boolean;
  faceCompareReturned: boolean;
  qrReturned: boolean;
}

export const VNPT_EKYC_MODES: VnptEkycMode[] = [
  {
    value: 'CCCD_OCR_UPLOAD',
    label: 'CCCD OCR Upload Only',
    description: 'Document-only CCCD chip upload flow for OCR and card liveness checks.',
    sdkFlow: 'DOCUMENT',
    flowTaken: 'DOCUMENT',
    useMethod: 'UPLOAD',
    useWebcam: false,
    useUpload: true,
    listTypeDocument: [9],
    documentTypeStart: 9,
    hasQrScan: false,
    enableUploadImage: true,
    enableOcrDocument: true,
    enableLivenessDocument: true,
    enableLivenessFace: false,
    enableMaskedFace: false,
    enableCompareFace: false,
    checkLivenessCard: true,
    checkLivenessFace: false,
    checkMaskedFace: false,
    compareFace: false,
  },
  {
    value: 'CCCD_FULL_UPLOAD',
    label: 'CCCD Full Upload',
    description: 'CCCD chip plus face/liveness checks using upload mode.',
    sdkFlow: 'DOCUMENT_TO_FACE',
    flowTaken: 'DOCUMENT_TO_FACE',
    useMethod: 'UPLOAD',
    useWebcam: false,
    useUpload: true,
    listTypeDocument: [9],
    documentTypeStart: 9,
    hasQrScan: false,
    enableUploadImage: true,
    enableOcrDocument: true,
    enableLivenessDocument: true,
    enableLivenessFace: true,
    enableMaskedFace: true,
    enableCompareFace: true,
    checkLivenessCard: true,
    checkLivenessFace: true,
    checkMaskedFace: true,
    compareFace: true,
  },
  {
    value: 'CCCD_FULL_CAMERA',
    label: 'CCCD Full Camera',
    description: 'Full CCCD and face/liveness flow with webcam enabled.',
    sdkFlow: 'DOCUMENT_TO_FACE',
    flowTaken: 'DOCUMENT_TO_FACE',
    useMethod: 'BOTH',
    useWebcam: true,
    useUpload: false,
    listTypeDocument: [9],
    documentTypeStart: 9,
    hasQrScan: true,
    enableUploadImage: true,
    enableOcrDocument: true,
    enableLivenessDocument: true,
    enableLivenessFace: true,
    enableMaskedFace: true,
    enableCompareFace: true,
    checkLivenessCard: true,
    checkLivenessFace: true,
    checkMaskedFace: true,
    compareFace: true,
  },
];

export function normalizeBackendUrl(value: string | undefined) {
  return (value ?? '').trim().replace(/\/+$/, '');
}

export function sanitizeAccessToken(value: string | undefined) {
  return (value ?? '').trim().replace(/^bearer\s+/i, '');
}

export function accessTokenHasBearerPrefix(value: string | undefined) {
  return /^bearer\s+/i.test((value ?? '').trim());
}

export function getVnptEkycMode(value: string | undefined) {
  return VNPT_EKYC_MODES.find((mode) => mode.value === value) ?? VNPT_EKYC_MODES[0];
}

export function getVnptEnv(): VnptEnv {
  const rawAccessToken = import.meta.env.VITE_VNPT_EKYC_ACCESS_TOKEN ?? '';

  return {
    backendUrl: normalizeBackendUrl(import.meta.env.VITE_VNPT_EKYC_BACKEND_URL),
    tokenId: (import.meta.env.VITE_VNPT_EKYC_TOKEN_ID ?? '').trim(),
    tokenKey: (import.meta.env.VITE_VNPT_EKYC_TOKEN_KEY ?? '').trim(),
    accessToken: sanitizeAccessToken(rawAccessToken),
    rawAccessToken,
    enabled: import.meta.env.VITE_VNPT_EKYC_ENABLED !== 'false',
    defaultMode: getVnptEkycMode(import.meta.env.VITE_VNPT_EKYC_DEFAULT_MODE).value,
  };
}

export function buildVnptEkycConfig(mode: VnptEkycMode, env: VnptEnv, callbacks: VnptCallbacks) {
  return {
    BACKEND_URL: env.backendUrl,
    TOKEN_KEY: env.tokenKey,
    TOKEN_ID: env.tokenId,
    ACCESS_TOKEN: env.accessToken,

    HAS_RESULT_SCREEN: true,
    HAS_BACKGROUND_IMAGE: true,
    MAX_SIZE_IMAGE: 1,
    LIST_TYPE_DOCUMENT: mode.listTypeDocument,
    DOCUMENT_TYPE_START: mode.documentTypeStart,
    DEFAULT_LANGUAGE: 'vi',
    SHOW_STEP: true,
    HAS_QR_SCAN: mode.hasQrScan,
    SHOW_TAB_RESULT_INFORMATION: true,
    SHOW_TAB_RESULT_VALIDATION: true,
    SHOW_TAB_RESULT_QRCODE: true,

    SDK_FLOW: mode.sdkFlow,
    FLOW_TAKEN: mode.flowTaken,
    USE_METHOD: mode.useMethod,
    USE_WEBCAM: mode.useWebcam,
    USE_UPLOAD: mode.useUpload,

    ENABLE_API_UPLOAD_IMAGE: mode.enableUploadImage,
    ENABLE_API_OCR_DOCUMENT: mode.enableOcrDocument,
    ENABLE_API_LIVENESS_DOCUMENT: mode.enableLivenessDocument,
    ENABLE_API_LIVENESS_FACE: mode.enableLivenessFace,
    ENABLE_API_MASKED_FACE: mode.enableMaskedFace,
    ENABLE_API_COMPARE_FACE: mode.enableCompareFace,

    CHECK_LIVENESS_CARD: mode.checkLivenessCard,
    CHECK_LIVENESS_FACE: mode.checkLivenessFace,
    CHECK_MASKED_FACE: mode.checkMaskedFace,
    COMPARE_FACE: mode.compareFace,

    CALL_BACK: callbacks.handleEkycResult,
    CALL_BACK_END_FLOW: callbacks.handleEkycResult,
    CALL_BACK_DOCUMENT_RESULT: callbacks.handleDocumentResult,
  };
}

export function summarizeVnptResult(result: unknown): VnptResultSummary {
  const entries = collectResultEntries(result);

  return {
    documentType: findDocumentType(entries),
    ocrReturned: hasAnyKey(entries, ['ocr']),
    cardFrontLivenessReturned: hasAllKeyParts(entries, ['liveness', 'front']),
    cardBackLivenessReturned: hasAllKeyParts(entries, ['liveness', 'back']),
    faceLivenessReturned: hasAllKeyParts(entries, ['liveness', 'face']),
    maskedFaceReturned: hasAnyKey(entries, ['masked']) || hasAnyKey(entries, ['mask']),
    faceCompareReturned: hasAnyKey(entries, ['compare']) || hasAnyKey(entries, ['matching']) || hasAnyKey(entries, ['similarity']),
    qrReturned: hasAnyKey(entries, ['qr']) || hasAnyKey(entries, ['qrcode']),
  };
}

function collectResultEntries(value: unknown) {
  const entries: Array<{ key: string; value: unknown }> = [];
  const seen = new WeakSet<object>();

  function walk(current: unknown, depth: number) {
    if (depth > 8 || current === null || typeof current !== 'object') {
      return;
    }

    if (seen.has(current)) {
      return;
    }

    seen.add(current);

    if (Array.isArray(current)) {
      current.forEach((item) => walk(item, depth + 1));
      return;
    }

    Object.entries(current as Record<string, unknown>).forEach(([key, entryValue]) => {
      entries.push({ key: key.toLowerCase(), value: entryValue });
      walk(entryValue, depth + 1);
    });
  }

  walk(value, 0);
  return entries;
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

function hasAnyKey(entries: Array<{ key: string; value: unknown }>, terms: string[]) {
  return entries.some((entry) => terms.some((term) => entry.key.includes(term)) && hasValue(entry.value));
}

function hasAllKeyParts(entries: Array<{ key: string; value: unknown }>, terms: string[]) {
  return entries.some((entry) => terms.every((term) => entry.key.includes(term)) && hasValue(entry.value));
}

function findDocumentType(entries: Array<{ key: string; value: unknown }>) {
  const match = entries.find((entry) => {
    const compactKey = entry.key.replace(/[_-]/g, '');
    return compactKey === 'typedocument' || compactKey === 'documenttype';
  });

  if (!match || !hasValue(match.value)) {
    return 'unknown';
  }

  return String(match.value);
}
