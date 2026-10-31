import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractDateFromText,
  isValidCalendarDate,
  detectLanguage,
  extractTimeAndSlot
} from '../src/services/dateParserService.js';

describe('MVR Jarvis Dynamic Date Parser Service', () => {
  // Reference date: 2026-10-30 (Friday)
  const FIXED_REF = '2026-10-30';

  it('1. Extracts valid date later this month (October 31)', () => {
    const res = extractDateFromText('Book MVR for October 31', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.isValid, true);
    assert.equal(res.normalizedDate, '2026-10-31');
    assert.equal(res.requiresClarification, false);
  });

  it('2. Extracts date next month (December 5, 2026)', () => {
    const res = extractDateFromText('Can you book MVR for December 5, 2026?', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.isValid, true);
    assert.equal(res.normalizedDate, '2026-12-05');
  });

  it('3. Extracts date in a different year (March 3, 2027)', () => {
    const res = extractDateFromText('I want to schedule an event on 3 March 2027', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.isValid, true);
    assert.equal(res.normalizedDate, '2027-03-03');
    assert.equal(res.year, 2027);
  });

  it('4. Resolves omitted year to upcoming calendar occurrence (November 11)', () => {
    // Current is October 2026 -> November 11 is upcoming in 2026
    const res = extractDateFromText('Book the speaker for November 11.', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.isValid, true);
    assert.equal(res.normalizedDate, '2026-11-11');
  });

  it('5. Resolves omitted year for past month to next calendar year (January 20)', () => {
    // Current is October 2026 -> January 20 is in 2027
    const res = extractDateFromText('I need the speaker on January 20 next year.', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.isValid, true);
    assert.equal(res.normalizedDate, '2027-01-20');
  });

  it('6. Extracts Tamil date: "நவம்பர் 11-ஆம் தேதி நிகழ்ச்சிக்கு booking செய்யுங்கள்"', () => {
    const res = extractDateFromText('நவம்பர் 11-ஆம் தேதி நிகழ்ச்சிக்கு booking செய்யுங்கள்.', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.isValid, true);
    assert.equal(res.normalizedDate, '2026-11-11');
    assert.equal(res.language, 'ta-IN');
  });

  it('7. Extracts Tamil date with explicit year: "மார்ச் 3, 2027 அன்று நிகழ்ச்சி நடத்த வேண்டும்"', () => {
    const res = extractDateFromText('மார்ச் 3, 2027 அன்று நிகழ்ச்சி நடத்த வேண்டும்.', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.isValid, true);
    assert.equal(res.normalizedDate, '2027-03-03');
    assert.equal(res.language, 'ta-IN');
  });

  it('8. Extracts mixed Tamil-English date: "Jarvis, November 15 date book பண்ணுங்க"', () => {
    const res = extractDateFromText('Jarvis, November 15 date book பண்ணுங்க.', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.isValid, true);
    assert.equal(res.normalizedDate, '2026-11-15');
  });

  it('9. Extracts relative date "tomorrow" and Tamil "நாளைக்கு"', () => {
    const resEn = extractDateFromText('Book the speaker tomorrow', { referenceDate: FIXED_REF });
    assert.equal(resEn.found, true);
    assert.equal(resEn.normalizedDate, '2026-10-31');

    const resTa = extractDateFromText('நாளைக்கு நிகழ்ச்சி book செய்ய வேண்டும்', { referenceDate: FIXED_REF });
    assert.equal(resTa.found, true);
    assert.equal(resTa.normalizedDate, '2026-10-31');
  });

  it('10. Extracts relative expression "15 days from today"', () => {
    const res = extractDateFromText('Book an event for 15 days from today.', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.normalizedDate, '2026-11-14');
  });

  it('11. Extracts weekday "next Friday" and Tamil "அடுத்த வெள்ளிக்கிழமை"', () => {
    // 2026-10-30 is Friday, so next Friday is 2026-11-06 (+7 days)
    const resEn = extractDateFromText('Check availability for next Friday.', { referenceDate: FIXED_REF });
    assert.equal(resEn.found, true);
    assert.equal(resEn.normalizedDate, '2026-11-06');

    const resTa = extractDateFromText('அடுத்த வெள்ளிக்கிழமை availability check பண்ணுங்க.', { referenceDate: FIXED_REF });
    assert.equal(resTa.found, true);
    assert.equal(resTa.normalizedDate, '2026-11-06');
  });

  it('12. Flags ambiguous numeric date "05/06" and requests clarification', () => {
    const res = extractDateFromText('Book for 05/06', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.requiresClarification, true);
    assert.equal(res.isAmbiguous, true);
    assert.match(res.clarificationPrompt, /ambiguous/i);
  });

  it('13. Rejects invalid calendar date (February 30)', () => {
    const res = extractDateFromText('Book the speaker for February 30, 2027', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.isValid, false);
    assert.equal(res.isInvalidDate, true);
    assert.equal(res.requiresClarification, true);
    assert.match(res.clarificationPrompt, /not a valid calendar date/i);
  });

  it('14. Rejects past dates with clarification guidance', () => {
    const res = extractDateFromText('Book the speaker on 2025-05-10', { referenceDate: FIXED_REF });
    assert.equal(res.found, true);
    assert.equal(res.isValid, false);
    assert.equal(res.isPastDate, true);
    assert.match(res.clarificationPrompt, /in the past/i);
  });

  it('15. Extracts time and infers slot ("tomorrow at 6 PM" and "நாளைக்கு மாலை 6 மணிக்கு")', () => {
    const resEn = extractDateFromText('Book the speaker tomorrow at 6 PM.', { referenceDate: FIXED_REF });
    assert.equal(resEn.found, true);
    assert.equal(resEn.normalizedDate, '2026-10-31');
    assert.equal(resEn.preferredSlot, 'Second Slot');

    const resTa = extractDateFromText('நாளைக்கு மாலை 6 மணிக்கு நிகழ்ச்சி book செய்ய வேண்டும்.', { referenceDate: FIXED_REF });
    assert.equal(resTa.found, true);
    assert.equal(resTa.normalizedDate, '2026-10-31');
    assert.equal(resTa.preferredSlot, 'Second Slot');
  });

  it('16. Validates calendar edge days accurately with isValidCalendarDate', () => {
    assert.equal(isValidCalendarDate(2028, 2, 29), true); // 2028 is a leap year
    assert.equal(isValidCalendarDate(2027, 2, 29), false); // 2027 is not leap
    assert.equal(isValidCalendarDate(2026, 4, 31), false); // April has 30 days
    assert.equal(isValidCalendarDate(2026, 12, 31), true); // Dec has 31 days
  });
});

