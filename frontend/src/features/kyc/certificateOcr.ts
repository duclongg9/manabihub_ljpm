import { createWorker, OEM, type LoggerMessage } from 'tesseract.js';

export interface JlptOcrResult {
  rawText: string;
  holderName: string;
  dateOfBirth: string;
  level: string;
  certificateCode: string;
}

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
    const result = await worker.recognize(file);
    return parseJlptOcrText(result.data.text);
  } finally {
    await worker.terminate();
  }
}

export function parseJlptOcrText(rawText: string): JlptOcrResult {
  const text = rawText.replace(/\r/g, '').trim();
  const lines = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const holderName = findLabeledValue(lines, [
    /(?:name|full\s*name|holder)\s*[:：-]?\s*(.+)$/i,
    /(?:氏名|名前)\s*[:：-]?\s*(.+)$/i,
  ]);
  const rawDateOfBirth = findFirstMatch(text, [
    /(?:date\s*of\s*birth|birth\s*date|dob)\s*[:：-]?\s*(\d{4}[./-]\d{1,2}[./-]\d{1,2})/i,
    /(?:date\s*of\s*birth|birth\s*date|dob)\s*[:：-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4})/i,
    /\b(\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/,
    /\b(\d{1,2}[./-]\d{1,2}[./-]\d{4})\b/,
  ]);
  const level = findFirstMatch(text, [/\b(N[1-5])\b/i]).toUpperCase();
  const certificateCode = findFirstMatch(text, [
    /(?:registration|certificate|registration\s*no|certificate\s*no|reg\s*no|受験番号)\s*[:：#-]?\s*([A-Z0-9-]{4,})/i,
  ]).toUpperCase();

  return {
    rawText: text,
    holderName: cleanName(holderName),
    dateOfBirth: normalizeDate(rawDateOfBirth),
    level,
    certificateCode,
  };
}

function findLabeledValue(lines: string[], patterns: RegExp[]) {
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }
  }
  return '';
}

function findFirstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return '';
}

function cleanName(value: string) {
  return value
    .replace(/\b(?:date|dob|birth|level|registration|certificate)\b.*$/i, '')
    .replace(/[^A-Za-zÀ-ỹ' -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDate(value: string) {
  if (!value) {
    return '';
  }
  const parts = value.split(/[./-]/).map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    return '';
  }
  const [first, second, third] = parts;
  const year = first > 999 ? first : third;
  const month = second;
  const day = first > 999 ? third : first;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return '';
  }
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}
