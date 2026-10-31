/**
 * MVR Jarvis Dynamic Date Parsing and Normalization Service
 * Strictly supports Tamil (ta-IN) and English (en-IN).
 * NEVER hardcodes any specific date.
 */

// Tamil and English Month Mappings
const TAMIL_MONTHS = {
  'ஜனவரி': 1,
  'பிப்ரவரி': 2,
  'மார்ச்': 3,
  'ஏப்ரல்': 4,
  'மே': 5,
  'ஜூன்': 6,
  'ஜூலை': 7,
  'ஆகஸ்ட்': 8,
  'செப்டம்பர்': 9,
  'அக்டோபர்': 10,
  'நவம்பர்': 11,
  'டிசம்பர்': 12
};

const ENGLISH_MONTHS = {
  'january': 1, 'jan': 1,
  'february': 2, 'feb': 2,
  'march': 3, 'mar': 3,
  'april': 4, 'apr': 4,
  'may': 5,
  'june': 6, 'jun': 6,
  'july': 7, 'jul': 7,
  'august': 8, 'aug': 8,
  'september': 9, 'sept': 9, 'sep': 9,
  'october': 10, 'oct': 10,
  'november': 11, 'nov': 11,
  'december': 12, 'dec': 12
};

// Weekday Mappings (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
const WEEKDAYS = {
  // English
  'sunday': 0, 'sun': 0,
  'monday': 1, 'mon': 1,
  'tuesday': 2, 'tue': 2,
  'wednesday': 3, 'wed': 3,
  'thursday': 4, 'thu': 4,
  'friday': 5, 'fri': 5,
  'saturday': 6, 'sat': 6,

  // Tamil
  'ஞாயிறு': 0, 'ஞாயிற்றுக்கிழமை': 0,
  'திங்கள்': 1, 'திங்கட்கிழமை': 1,
  'செவ்வாய்': 2, 'செவ்வாய்க்கிழமை': 2,
  'புதன்': 3, 'புதன்கிழமை': 3,
  'வியாழன்': 4, 'வியாழக்கிழமை': 4,
  'வெள்ளி': 5, 'வெள்ளிக்கிழமை': 5,
  'சனி': 6, 'சனிக்கிழமை': 6
};

// Maximum booking horizon: 730 days (2 years)
const MAX_BOOKING_HORIZON_DAYS = 730;

/**
 * Returns current date at start of day in Indian Standard Time (IST, UTC+05:30)
 * @param {Date|string} [referenceDate]
 * @returns {Date}
 */
export function getNowIST(referenceDate = null) {
  if (referenceDate) {
    const d = new Date(referenceDate);
    if (!isNaN(d.getTime())) return d;
  }
  // Current time adjusted to IST
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(utc + istOffset);
}

/**
 * Formats a Date object as YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDateIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if year/month/day forms a valid calendar date (e.g. catches Feb 30, Apr 31)
 * @param {number} year
 * @param {number} month 1-12
 * @param {number} day 1-31
 * @returns {boolean}
 */
export function isValidCalendarDate(year, month, day) {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

/**
 * Detects whether the input text is predominantly Tamil or English
 * @param {string} text
 * @returns {'ta-IN'|'en-IN'}
 */
export function detectLanguage(text) {
  if (!text) return 'en-IN';
  // Check for Tamil Unicode characters (\u0B80-\u0BFF)
  const tamilChars = (text.match(/[\u0B80-\u0BFF]/g) || []).length;
  return tamilChars > 2 ? 'ta-IN' : 'en-IN';
}

/**
 * Extracts spoken time and infers preferred slot ('First Slot' | 'Second Slot')
 * @param {string} text
 * @returns {{ timeString: string|null, slot: 'First Slot'|'Second Slot'|null }}
 */
export function extractTimeAndSlot(text) {
  if (!text) return { timeString: null, slot: null };
  const lower = text.toLowerCase();

  // Explicit slot names
  if (lower.includes('first slot') || lower.includes('முதல் ஸ்லாட்') || lower.includes('காலை ஸ்லாட்')) {
    return { timeString: '10:00 AM', slot: 'First Slot' };
  }
  if (lower.includes('second slot') || lower.includes('இரண்டாம் ஸ்லாட்') || lower.includes('மாலை ஸ்லாட்')) {
    return { timeString: '02:00 PM', slot: 'Second Slot' };
  }

  // Tamil time expressions
  // e.g. "மாலை 6 மணிக்கு", "சாயங்காலம் 6 மணிக்கு", "காலை 10 மணிக்கு"
  const tamilTimeMatch = text.match(/(காலை|மாலை|சாயங்காலம்|இரவு)?\s*(\d{1,2})(?::(\d{2}))?\s*(மணிக்கு|மணி)?/i);
  if (tamilTimeMatch && (tamilTimeMatch[1] || tamilTimeMatch[4])) {
    const period = tamilTimeMatch[1] || '';
    const hour = parseInt(tamilTimeMatch[2], 10);
    const minute = tamilTimeMatch[3] ? tamilTimeMatch[3] : '00';

    const isAfternoon = period.includes('மாலை') || period.includes('சாயங்காலம்') || period.includes('இரவு') || hour >= 12;
    const slot = isAfternoon ? 'Second Slot' : 'First Slot';
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = isAfternoon ? 'PM' : 'AM';
    return {
      timeString: `${displayHour}:${minute} ${ampm}`,
      slot
    };
  }

  // English time expressions: "6 PM", "6:30 pm", "10 AM", "at 6", "18:00"
  const enMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (enMatch) {
    const hour = parseInt(enMatch[1], 10);
    const minute = enMatch[2] ? enMatch[2] : '00';
    const ampm = enMatch[3].toUpperCase();
    const isPm = ampm === 'PM';
    const slot = (isPm || hour >= 13) ? 'Second Slot' : 'First Slot';
    return {
      timeString: `${hour}:${minute} ${ampm}`,
      slot
    };
  }

  return { timeString: null, slot: null };
}

/**
 * Extracts and normalizes any date mentioned in Tamil or English text.
 * Strictly dynamic: Never hardcodes November 11 or any other date.
 *
 * @param {string} text - User spoken text
 * @param {object} [options]
 * @param {Date|string} [options.referenceDate] - Base date for resolving relative dates (defaults to IST today)
 * @param {string} [options.language] - Optional language hint ('ta-IN' or 'en-IN')
 * @returns {object} Extracted date metadata
 */
export function extractDateFromText(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return {
      found: false,
      normalizedDate: null,
      error: 'No text provided'
    };
  }

  const rawText = text.trim();
  const detectedLang = options.language || detectLanguage(rawText);
  const refDate = getNowIST(options.referenceDate);
  const todayIso = formatDateIso(refDate);

  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth() + 1; // 1-12
  const refDay = refDate.getDate();

  const lower = rawText.toLowerCase();

  // Helper result builder
  function buildResult(params) {
    const {
      year,
      month,
      day,
      originalExpression,
      requiresClarification = false,
      clarificationPrompt = null,
      notes = null
    } = params;

    // 1. Calendar validity
    if (!isValidCalendarDate(year, month, day)) {
      const errPrompt = detectedLang === 'ta-IN'
        ? `${originalExpression || 'குறிப்பிட்ட தேதி'} ஒரு சரியான நாள்காட்டி தேதி அல்ல. தயவுசெய்து சரியான தேதியைக் குறிப்பிடவும்.`
        : `${originalExpression || 'The date provided'} is not a valid calendar date. Please specify a valid date.`;

      return {
        found: true,
        isValid: false,
        isInvalidDate: true,
        originalExpression,
        normalizedDate: null,
        language: detectedLang,
        requiresClarification: true,
        clarificationPrompt: errPrompt,
        error: 'Invalid calendar date'
      };
    }

    const normalized = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const targetDateObj = new Date(year, month - 1, day);

    // 2. Ambiguity check
    if (requiresClarification) {
      return {
        found: true,
        isValid: true,
        isAmbiguous: true,
        requiresClarification: true,
        clarificationPrompt,
        originalExpression,
        normalizedDate: normalized,
        language: detectedLang,
        notes
      };
    }

    // 3. Past date check
    const isPast = normalized < todayIso;
    if (isPast) {
      const pastPrompt = detectedLang === 'ta-IN'
        ? `நீங்கள் குறிப்பிட்ட ${normalized} கடந்த தேதியாகும். MVR அவர்களின் நிகழ்ச்சிக்கு இன்று அல்லது வரவிருக்கும் தேதியை தேர்வு செய்யவும்.`
        : `The specified date ${normalized} is in the past. Please select today or an upcoming date for the speaking engagement.`;

      return {
        found: true,
        isValid: false,
        isPastDate: true,
        requiresClarification: true,
        clarificationPrompt: pastPrompt,
        originalExpression,
        normalizedDate: normalized,
        language: detectedLang
      };
    }

    // 4. Booking horizon check
    const diffMs = targetDateObj.getTime() - refDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > MAX_BOOKING_HORIZON_DAYS) {
      const horizonPrompt = detectedLang === 'ta-IN'
        ? `முன்பதிவு அதிகபட்சம் 2 ஆண்டுகளுக்குள் மட்டுமே செய்ய முடியும். வரவிருக்கும் தேதியை தேர்வு செய்யவும்.`
        : `Speaking bookings can only be scheduled within a 2-year window. Please choose an earlier upcoming date.`;

      return {
        found: true,
        isValid: false,
        isOutOfHorizon: true,
        requiresClarification: true,
        clarificationPrompt: horizonPrompt,
        originalExpression,
        normalizedDate: normalized,
        language: detectedLang
      };
    }

    // Spoken verbal representations
    const dateForDisplay = targetDateObj.toLocaleDateString(detectedLang === 'ta-IN' ? 'ta-IN' : 'en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timeInfo = extractTimeAndSlot(rawText);

    return {
      found: true,
      isValid: true,
      normalizedDate: normalized,
      year,
      month,
      day,
      displayDate: dateForDisplay,
      originalExpression,
      language: detectedLang,
      requiresClarification: false,
      clarificationPrompt: null,
      timeString: timeInfo.timeString,
      preferredSlot: timeInfo.slot
    };
  }

  // =========================================================================
  // 1. RELATIVE DAYS: "in 15 days", "15 days from today", "15 நாட்கள் கழித்து"
  // (Must be checked before standalone "today")
  // =========================================================================
  const relativeDaysEn = lower.match(/(?:in\s+)?(\d+)\s+days?(?:\s+from\s+(?:today|now))?/i);
  if (relativeDaysEn && !lower.includes('month') && !lower.includes('year') && (lower.includes('in ') || lower.includes('from '))) {
    const daysToAdd = parseInt(relativeDaysEn[1], 10);
    const d = new Date(refDate);
    d.setDate(d.getDate() + daysToAdd);
    return buildResult({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      originalExpression: relativeDaysEn[0]
    });
  }

  const relativeDaysTa = rawText.match(/(\d+)\s*(?:நாட்கள்|நாளைக்கு|நாள்)\s*(?:கழித்து|பிறகு)/);
  if (relativeDaysTa) {
    const daysToAdd = parseInt(relativeDaysTa[1], 10);
    const d = new Date(refDate);
    d.setDate(d.getDate() + daysToAdd);
    return buildResult({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      originalExpression: relativeDaysTa[0]
    });
  }

  // =========================================================================
  // 2. RELATIVE DATES: "today" / "tomorrow" / "day after tomorrow"
  // =========================================================================
  if (
    lower.includes('day after tomorrow') ||
    lower.includes('நாளை மறுநாள்') ||
    lower.includes('நாளைக்கு அடுத்த நாள்')
  ) {
    const d = new Date(refDate);
    d.setDate(d.getDate() + 2);
    return buildResult({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      originalExpression: lower.includes('day after tomorrow') ? 'day after tomorrow' : 'நாளை மறுநாள்'
    });
  }

  if (
    lower.includes('tomorrow') ||
    lower.includes('நாளை') ||
    lower.includes('நாளைக்கு')
  ) {
    const d = new Date(refDate);
    d.setDate(d.getDate() + 1);
    return buildResult({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      originalExpression: lower.includes('tomorrow') ? 'tomorrow' : 'நாளைக்கு'
    });
  }

  if (
    /\btoday\b/.test(lower) ||
    lower.includes('இன்று') ||
    lower.includes('இன்னைக்கு') ||
    lower.includes('இன்றைக்கு')
  ) {
    return buildResult({
      year: refYear,
      month: refMonth,
      day: refDay,
      originalExpression: lower.includes('today') ? 'today' : 'இன்று'
    });
  }

  // =========================================================================
  // 3. WEEKDAYS: "next Friday", "this Friday", "அடுத்த வெள்ளிக்கிழமை"
  // =========================================================================
  for (const [name, targetDayOfWeek] of Object.entries(WEEKDAYS)) {
    const enRegex = new RegExp(`(?:next|this coming|coming)?\\s*\\b${name}\\b`, 'i');
    const taRegex = new RegExp(`(?:அடுத்த\\s+)?${name}`);

    if (enRegex.test(lower) || taRegex.test(rawText)) {
      const currentDayOfWeek = refDate.getDay();
      let daysAhead = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
      // If today is the requested weekday or "next" is explicitly stated, jump to next week
      if (daysAhead === 0 || lower.includes('next ' + name) || rawText.includes('அடுத்த ' + name)) {
        daysAhead = daysAhead === 0 ? 7 : daysAhead + (daysAhead < 7 ? 0 : 7);
        if (daysAhead === 0) daysAhead = 7;
      }

      const d = new Date(refDate);
      d.setDate(d.getDate() + daysAhead);
      return buildResult({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        originalExpression: lower.includes(name) ? `next ${name}` : `அடுத்த ${name}`
      });
    }
  }

  // =========================================================================
  // 4. AMBIGUOUS NUMERIC DATES: "05/06", "05-06" (without year, day & month <= 12)
  // =========================================================================
  const slashNumMatch = rawText.match(/\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|1[0-2])\b/);
  if (slashNumMatch && !rawText.match(/\b\d{4}\b/)) {
    const partA = parseInt(slashNumMatch[1], 10);
    const partB = parseInt(slashNumMatch[2], 10);
    // If partA !== partB, it's genuinely ambiguous between DD/MM and MM/DD
    if (partA !== partB) {
      const prompt = detectedLang === 'ta-IN'
        ? `நீங்கள் குறிப்பிட்ட '${slashNumMatch[0]}' தேதி தெளிவற்றதாக உள்ளது. அது ${partA} ${getMonthName(partB, 'ta-IN')}-ஆ அல்லது ${partB} ${getMonthName(partA, 'ta-IN')}-ஆ என்பதை உறுதிப்படுத்தவும்.`
        : `The numeric date '${slashNumMatch[0]}' is ambiguous. Did you mean ${partA} ${getMonthName(partB, 'en-IN')} or ${partB} ${getMonthName(partA, 'en-IN')}? Please clarify.`;

      return buildResult({
        year: refYear,
        month: partB,
        day: partA,
        originalExpression: slashNumMatch[0],
        requiresClarification: true,
        clarificationPrompt: prompt,
        notes: 'Ambiguous numeric date'
      });
    }
  }

  // =========================================================================
  // 5. STANDARD NUMERIC DATES: YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY
  // =========================================================================
  const isoMatch = rawText.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    return buildResult({
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10),
      day: parseInt(isoMatch[3], 10),
      originalExpression: isoMatch[0]
    });
  }

  const dmyMatch = rawText.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/);
  if (dmyMatch) {
    return buildResult({
      year: parseInt(dmyMatch[3], 10),
      month: parseInt(dmyMatch[2], 10),
      day: parseInt(dmyMatch[1], 10),
      originalExpression: dmyMatch[0]
    });
  }

  // =========================================================================
  // 6. TAMIL MONTH NAMES: "நவம்பர் 11", "டிசம்பர் 5, 2026", "மார்ச் 3"
  // =========================================================================
  for (const [tMonthName, mNum] of Object.entries(TAMIL_MONTHS)) {
    if (rawText.includes(tMonthName)) {
      // Find day: "11-ஆம் தேதி", "11 ஆம் தேதி", "11", "5-ஆம் தேதி"
      const dayMatch = rawText.match(new RegExp(`${tMonthName}[^0-9]*(\\d{1,2})`)) ||
                       rawText.match(new RegExp(`(\\d{1,2})[^0-9]*${tMonthName}`));
      if (dayMatch) {
        const day = parseInt(dayMatch[1], 10);
        // Find optional year: "2026", "2027"
        const yearMatch = rawText.match(/\b(20\d{2})\b/);
        let year;
        if (yearMatch) {
          year = parseInt(yearMatch[1], 10);
        } else {
          // Omitted year: if date is upcoming in refYear, use refYear, else next year
          const isUpcomingThisYear = (mNum > refMonth) || (mNum === refMonth && day >= refDay);
          year = isUpcomingThisYear ? refYear : refYear + 1;
        }

        return buildResult({
          year,
          month: mNum,
          day,
          originalExpression: `${tMonthName} ${day}${yearMatch ? ', ' + year : ''}`
        });
      }
    }
  }

  // =========================================================================
  // 7. ENGLISH & MIXED MONTH NAMES: "November 11", "December 5, 2026", "3 March 2027"
  // =========================================================================
  for (const [eMonthName, mNum] of Object.entries(ENGLISH_MONTHS)) {
    const monthRegex = new RegExp(`\\b${eMonthName}\\b`, 'i');
    if (monthRegex.test(rawText)) {
      // Find day before or after: "November 11", "11th November", "Nov 15"
      const dayAfter = rawText.match(new RegExp(`\\b${eMonthName}\\b\\s*(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'));
      const dayBefore = rawText.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?\\b${eMonthName}\\b`, 'i'));
      const foundDay = dayAfter ? dayAfter[1] : (dayBefore ? dayBefore[1] : null);

      if (foundDay) {
        const day = parseInt(foundDay, 10);
        const yearMatch = rawText.match(/\b(20\d{2})\b/);
        let year;
        if (yearMatch) {
          year = parseInt(yearMatch[1], 10);
        } else {
          const isUpcomingThisYear = (mNum > refMonth) || (mNum === refMonth && day >= refDay);
          year = isUpcomingThisYear ? refYear : refYear + 1;
        }

        return buildResult({
          year,
          month: mNum,
          day,
          originalExpression: `${eMonthName} ${day}${yearMatch ? ', ' + year : ''}`
        });
      }
    }
  }

  // No recognized date pattern
  return {
    found: false,
    normalizedDate: null,
    originalExpression: null,
    language: detectedLang
  };
}

/**
 * Returns human-readable month name for spoken feedback
 * @param {number} month 1-12
 * @param {'ta-IN'|'en-IN'} lang
 * @returns {string}
 */
export function getMonthName(month, lang = 'en-IN') {
  const enNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const taNames = ['', 'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
  return lang === 'ta-IN' ? (taNames[month] || '') : (enNames[month] || '');
}
