import { describe, expect, it } from 'vitest';
import { parseJlptOcrText } from './certificateOcr';

describe('parseJlptOcrText', () => {
  it('extracts the certificate fields from a noisy JLPT transcript', () => {
    const result = parseJlptOcrText(`
      N3
      CERTIFICATE
      JAPANESE-LANGUAGE PROFICIENCY
      Name
      THAN VAN THANH
      Date of Birth
      2004/08/12
      Test Site Vietnam
      This is to certify that the person named above has passed
      25B2080102-33745
      N3A568591A
    `);

    expect(result.holderName).toBe('THAN VAN THANH');
    expect(result.dateOfBirth).toBe('2004-08-12');
    expect(result.level).toBe('N3');
    expect(result.certificateCode).toBe('25B2080102-33745');
    expect(result.rawText).toBe([
      'Name: THAN VAN THANH',
      'Date of Birth: 2004-08-12',
      'Level: N3',
      'Certificate No: 25B2080102-33745',
    ].join('\n'));
    expect(result.rawText).not.toContain('JAPANESE-LANGUAGE');
  });

  it('does not treat the certificate heading as a certificate number', () => {
    const result = parseJlptOcrText('CERTIFICATE JAPANESE-LANGUAGE PROFICIENCY\nN3\nName\nTHAN VAN THANH');
    expect(result.certificateCode).toBe('');
    expect(result.holderName).toBe('THAN VAN THANH');
  });
});
