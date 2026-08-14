import { createWorker, OEM, PSM, type LoggerMessage } from 'tesseract.js';

export interface JlptOcrResult {
  /** Sanitized evidence text sent to the backend, not the noisy OCR transcript. */
  rawText: string;
  holderName: string;
  dateOfBirth: string;
  level: string;
  certificateCode: string;
}

type OcrInput = File | HTMLCanvasElement;

/**
 * OCR the certificate in a few focused passes. JLPT certificates contain a
 * security background and Japanese/English boilerplate; asking Tesseract to
 * read the whole page in one pass makes the useful fields less reliable.
 */
export async function recognizeJlptCertificate(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<JlptOcrResult> {
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    logger: (message: LoggerMessage) => {
      if (message.status === 'recognizing text') {
        onProgress?.(Math.round(message.progress * 100));
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: '1',
    });
    const inputs = await createOcrInputs(file);
    const transcripts: string[] = [];
    for (const input of inputs) {
      const result = await worker.recognize(input);
      if (result.data.text.trim()) transcripts.push(result.data.text);
    }
    onProgress?.(100);
    return parseJlptOcrText(transcripts.join('\n'));
  } finally {
    await worker.terminate();
  }
}

/** Parse only the fields that the certificate form and backend can verify. */
export function parseJlptOcrText(rawText: string): JlptOcrResult {
  const text = normalizeOcrText(rawText);
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const holderName = findCertificateName(lines);
  const rawDateOfBirth = findFirstMatch(text, [
    /(?:date\s*of\s*birth|birth\s*date|dob)\s*[:：-]?\s*(\d{4}[./-]\d{1,2}[./-]\d{1,2})/i,
    /(?:date\s*of\s*birth|birth\s*date|dob)\s*[:：-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4})/i,
    /\b(\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/,
    /\b(\d{1,2}[./-]\d{1,2}[./-]\d{4})\b/,
  ]);
  const dateOfBirth = normalizeDate(rawDateOfBirth);
  const level = findFirstMatch(text, [/\b(N[1-5])\b/i]).toUpperCase();
  const certificateCode = findCertificateCode(text);

  const evidenceLines = [
    holderName && `Name: ${holderName}`,
    dateOfBirth && `Date of Birth: ${dateOfBirth}`,
    level && `Level: ${level}`,
    certificateCode && `Certificate No: ${certificateCode}`,
  ].filter((line): line is string => Boolean(line));

  return {
    rawText: evidenceLines.join('\n'),
    holderName,
    dateOfBirth,
    level,
    certificateCode,
  };
}

function normalizeOcrText(rawText: string) {
  return rawText
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function findCertificateName(lines: string[]) {
  const labelIndex = lines.findIndex((line) => /^(?:name|full\s*name|holder|氏名|名前)\s*[:：]?$/i.test(line));
  if (labelIndex >= 0) {
    const labeled = cleanName(lines[labelIndex + 1] ?? '');
    if (isLikelyPersonName(labeled)) return labeled;
  }

  for (const line of lines) {
    const inline = line.match(/^(?:name|full\s*name|holder)\s*[:：-]?\s*(.+)$/i);
    const labeled = cleanName(inline?.[1] ?? '');
    if (isLikelyPersonName(labeled)) return labeled;
  }

  for (const line of lines) {
    const candidate = cleanName(line);
    if (isLikelyPersonName(candidate)) return candidate;
  }
  return '';
}

function isLikelyPersonName(value: string) {
  if (!value || value.length < 5 || value.length > 50 || /\d/.test(value)) return false;
  const upper = value.toUpperCase();
  const blocked = [
    'CERTIFICATE', 'JAPANESE', 'LANGUAGE', 'PROFICIENCY', 'DATE OF BIRTH',
    'TEST SITE', 'VIETNAM', 'THIS IS TO CERTIFY', 'EDUCATIONAL', 'EXCHANGES',
    'SERVICES', 'LEVEL', 'NAME', 'ROSSA', 'JAPAN FOUNDATION',
  ];
  if (blocked.some((word) => upper.includes(word))) return false;
  const words = value.split(' ').filter(Boolean);
  return words.length >= 2 && words.length <= 5 && words.every((word) => /^[A-Za-zÀ-ỹ'’-]+$/.test(word));
}

function findCertificateCode(text: string) {
  const candidates = [
    // JLPT certificate registration number, e.g. 25B2080102-33745.
    ...Array.from(text.matchAll(/\d{2}[A-Z]\d{6,}-\d{3,}/gi), (match) => match[0]),
    // The serial printed at the lower-left corner is a useful fallback.
    ...Array.from(text.matchAll(/\bN[1-5][A-Z]\d{6,}[A-Z]\b/gi), (match) => match[0]),
    ...Array.from(text.matchAll(/\b[A-Z0-9]{2,}\d[A-Z0-9]*-\d{3,}\b/gi), (match) => match[0]),
  ];
  const code = candidates
    .map((candidate) => candidate.toUpperCase())
    .find((candidate) => !/JAPANESE|LANGUAGE|CERTIFICATE|PROFICIENCY/.test(candidate));
  return code ?? '';
}

function findFirstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function cleanName(value: string) {
  return value
    .replace(/^(?:RA|R\s*A|A|ZZ[YV])\s+/i, '')
    .replace(/\b(?:date|dob|birth|level|registration|certificate)\b.*$/i, '')
    .replace(/[^A-Za-zÀ-ỹ'’ -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDate(value: string) {
  if (!value) return '';
  const parts = value.split(/[./-]/).map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return '';
  const [first, second, third] = parts;
  const year = first > 999 ? first : third;
  const month = second;
  const day = first > 999 ? third : first;
  if (year < 1900 || year > new Date().getFullYear() + 1 || month < 1 || month > 12 || day < 1 || day > 31) return '';
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

async function createOcrInputs(file: File): Promise<OcrInput[]> {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return [file];
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return [file];

    return [
      cropImage(image, width, height, 0.18, 0.22, 0.64, 0.48),
      cropImage(image, width, height, 0.05, 0.82, 0.90, 0.18),
      file,
    ];
  } catch {
    return [file];
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('certificate image could not be loaded'));
    image.src = url;
  });
}

function cropImage(
  image: HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  leftRatio: number,
  topRatio: number,
  widthRatio: number,
  heightRatio: number,
) {
  const sourceLeft = Math.round(sourceWidth * leftRatio);
  const sourceTop = Math.round(sourceHeight * topRatio);
  const cropWidth = Math.round(sourceWidth * widthRatio);
  const cropHeight = Math.round(sourceHeight * heightRatio);
  const scale = Math.min(2, 1800 / cropWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cropWidth * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.filter = 'grayscale(1) contrast(1.12)';
  context.drawImage(image, sourceLeft, sourceTop, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  context.filter = 'none';
  return canvas;
}
