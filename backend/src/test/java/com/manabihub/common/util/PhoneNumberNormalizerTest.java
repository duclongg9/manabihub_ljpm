package com.manabihub.common.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PhoneNumberNormalizerTest {

    @Test
    void normalizeConvertsInternationalPrefixToLocalForm() {
        assertEquals("0912345678", PhoneNumberNormalizer.normalize("+84912345678"));
    }

    @Test
    void normalizeKeepsLocalFormUnchanged() {
        assertEquals("0912345678", PhoneNumberNormalizer.normalize("0912345678"));
    }

    @Test
    void normalizeKeepsNullUnchanged() {
        assertNull(PhoneNumberNormalizer.normalize(null));
    }

    @Test
    void normalizeTurnsBlankValueIntoNull() {
        assertNull(PhoneNumberNormalizer.normalize(""));
        assertNull(PhoneNumberNormalizer.normalize("   "));
    }

    @Test
    void normalizeTrimsSurroundingWhitespace() {
        assertEquals("0912345678", PhoneNumberNormalizer.normalize("  +84912345678  "));
    }

    @Test
    void normalizedInternationalNumberFitsPhoneNumberColumn() {
        assertEquals(10, PhoneNumberNormalizer.normalize("+84912345678").length());
    }
}
