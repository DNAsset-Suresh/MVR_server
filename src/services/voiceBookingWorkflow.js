/**
 * MVR Jarvis Dynamic Voice Booking Workflow Service
 * Strictly supports Tamil (ta-IN) and English (en-IN).
 * NEVER hardcodes any date. Guarantees transactional booking via bookingService.
 */

import { extractDateFromText, formatDateIso, getNowIST } from './dateParserService.js';
import { getVerifiedAvailability } from './availabilityService.js';
import { createBookingWithTransaction, validateBookingPayload } from './bookingService.js';

// Standard MVR Speaking Services
const VALID_SERVICES = [
  'Corporate Workshops',
  'Youth Motivation',
  'Team Building',
  'Executive Leadership Address',
  'Annual Corporate Summit',
  'Custom Organization Program'
];

/**
 * Extracts phone number (at least 10 digits) from text
 * @param {string} text
 * @returns {string|null}
 */
export function extractPhone(text) {
  if (!text) return null;
  // Match 10 consecutive digits or spaced digits e.g. "98765 43210" or "+91 9876543210"
  const match = text.match(/(?:\+91[\s-]?)?([6-9]\d{9})\b/) ||
                text.match(/\b(\d{10})\b/) ||
                text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
  if (match) {
    return match[1] || match[0].replace(/[\s-]/g, '');
  }
  return null;
}

/**
 * Extracts email address from text
 * @param {string} text
 * @returns {string|null}
 */
export function extractEmail(text) {
  if (!text) return null;
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

/**
 * Extracts service type from user text in Tamil or English
 * @param {string} text
 * @returns {string|null}
 */
export function extractServiceType(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (lower.includes('youth') || lower.includes('இளைஞர்') || lower.includes('கல்லூரி') || lower.includes('college') || lower.includes('student')) {
    return 'Youth Motivation';
  }
  if (lower.includes('team building') || lower.includes('குழு') || lower.includes('team')) {
    return 'Team Building';
  }
  if (lower.includes('leadership') || lower.includes('தலைமைத்துவ') || lower.includes('தலைமை')) {
    return 'Executive Leadership Address';
  }
  if (lower.includes('summit') || lower.includes('மாநாடு') || lower.includes('annual')) {
    return 'Annual Corporate Summit';
  }
  if (lower.includes('corporate') || lower.includes('workshop') || lower.includes('பட்டறை') || lower.includes('கம்பெனி')) {
    return 'Corporate Workshops';
  }
  return null;
}

/**
 * Extracts city / location from user text
 * @param {string} text
 * @returns {string|null}
 */
export function extractCity(text) {
  if (!text) return null;
  const cities = [
    'chennai', 'madurai', 'coimbatore', 'bengaluru', 'bangalore',
    'trichy', 'tiruchirappalli', 'salem', 'tirunelveli', 'erode',
    'vellore', 'thanjavur', 'mumbai', 'delhi', 'hyderabad', 'pune',
    'கொச்சி', 'சென்னை', 'மதுரை', 'கோயம்புத்தூர்', 'பெங்களூரு',
    'திருச்சி', 'சேலம்', 'திருநெல்வேலி'
  ];

  const lower = text.toLowerCase();
  for (const city of cities) {
    if (lower.includes(city)) {
      // Capitalize first letter
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }

  // Check pattern "in <City>" or "at <City>" or "<City>-ல்"
  const inCityMatch = text.match(/\b(?:in|at|venue)\s+([A-Z][a-zA-Z]+)\b/) ||
                      text.match(/([a-zA-Z]+)[\s-]*(?:இல்|ல்)/);
  if (inCityMatch && inCityMatch[1].length > 2) {
    return inCityMatch[1].charAt(0).toUpperCase() + inCityMatch[1].slice(1);
  }

  return null;
}

/**
 * Extracts organizer name
 * @param {string} text
 * @returns {string|null}
 */
export function extractOrganizerName(text) {
  if (!text) return null;
  const match = text.match(/(?:my name is|i am|name is|coordinator)\s+([A-Za-z\s]{2,25})/i) ||
                text.match(/(?:என் பெயர்|பெயர்)\s+([^\s,]+)/);
  if (match) {
    return match[1].trim();
  }
  return null;
}

/**
 * Detects affirmative confirmation intent ("Yes", "Confirm", "ஆம்", "உறுதி செய்")
 * @param {string} text
 * @returns {boolean}
 */
export function isAffirmativeConfirmation(text) {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  if (
    lower.includes('not') ||
    lower.includes("don't") ||
    lower.includes('dont') ||
    lower.includes('no ') ||
    lower === 'no' ||
    lower.includes('cancel') ||
    lower.includes('வேண்டாம்') ||
    lower.includes('இல்லை') ||
    lower.includes('ரத்து')
  ) {
    return false;
  }
  return (
    lower === 'yes' ||
    lower === 'confirm' ||
    lower === 'proceed' ||
    lower === 'book it' ||
    lower === 'confirm booking' ||
    lower.startsWith('yes') ||
    lower.startsWith('confirm') ||
    lower.includes('confirm') ||
    lower.includes('proceed') ||
    lower.includes('yes,') ||
    lower.includes('yes please') ||
    lower.includes('confirm pannunga') ||
    lower.includes('confirm பண்ணுங்க') ||
    lower.includes('book பண்ணுங்க') ||
    lower === 'ஆம்' ||
    lower === 'உறுதி செய்' ||
    lower === 'உறுதி' ||
    lower === 'சரி' ||
    lower === 'ஆமாம்' ||
    lower.includes('உறுதி') ||
    lower.includes('முன்பதிவு செய்') ||
    lower.includes('சரி')
  );
}

/**
 * Detects negative cancellation intent ("No", "Cancel", "இல்லை", "வேண்டாம்", "ரத்து செய்")
 * @param {string} text
 * @returns {boolean}
 */
export function isNegativeCancellation(text) {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return (
    lower === 'no' ||
    lower === 'cancel' ||
    lower === 'stop' ||
    lower.startsWith('no ') ||
    lower.startsWith('no,') ||
    lower.includes('cancel') ||
    lower.includes('do not') ||
    lower.includes("don't") ||
    lower.includes('dont') ||
    lower.includes('dont book') ||
    lower.includes("don't book") ||
    lower.includes('stop') ||
    lower.includes('இல்லை') ||
    lower.includes('வேண்டாம்') ||
    lower.includes('ரத்து')
  );
}

/**
 * Core Dynamic Voice Booking State Machine
 * Handles multi-turn voice booking dialog from date extraction through explicit confirmation.
 *
 * @param {object} params
 * @param {string} params.message - Current user transcript
 * @param {'ta-IN'|'en-IN'} [params.language] - Conversation language
 * @param {object} [params.currentDraft] - Existing active booking draft (if any)
 * @param {Array} [params.history] - Prior messages
 * @returns {Promise<object>}
 */
export async function processVoiceBookingTurn({
  message,
  language = 'en-IN',
  currentDraft = null,
  history = []
}) {
  const isTamil = language === 'ta-IN';
  const cleanText = (message || '').trim();

  // Initialize or clone draft
  const draft = currentDraft ? { ...currentDraft } : {
    serviceType: null,
    eventDate: null,
    displayDate: null,
    preferredSlot: 'First Slot',
    eventFormat: 'In-Person Address',
    audienceSize: '100 - 500 Attendees',
    organizerName: null,
    email: null,
    phone: null,
    organization: null,
    city: null,
    themeNotes: 'Voice Assistant Booking Inquiry',
    awaitingConfirmation: false,
    availabilityChecked: false
  };

  // 1. Check for cancellation
  if (isNegativeCancellation(cleanText)) {
    return {
      success: true,
      stage: 'cancelled',
      draft: null,
      replyEnglish: 'Your booking draft has been cancelled. No reservation was created. How else may I assist you?',
      replyTamil: 'முன்பதிவுக் கோரிக்கை ரத்து செய்யப்பட்டது. எந்த முன்பதிவும் உருவாக்கப்படவில்லை. வேறு என்ன தகவல் வேண்டும்?',
      action: { type: 'bookingCancelled' }
    };
  }

  const lowerText = cleanText.toLowerCase();
  const hasCorrection =
    lowerText.includes('but') ||
    lowerText.includes('change') ||
    lowerText.includes('instead') ||
    lowerText.includes('actually') ||
    lowerText.includes('modify') ||
    lowerText.includes('correction') ||
    lowerText.includes('மாற்று') ||
    lowerText.includes('திருத்து');

  if (hasCorrection) {
    draft.awaitingConfirmation = false;
  }

  // 2. Check for explicit confirmation if draft was waiting for confirmation
  if (draft.awaitingConfirmation && isAffirmativeConfirmation(cleanText) && !hasCorrection) {
    // Validate all required fields
    const validation = validateBookingPayload(draft);
    if (!validation.isValid) {
      draft.awaitingConfirmation = false;
      const missingField = validation.errors[0];
      return {
        success: false,
        stage: 'incomplete',
        draft,
        replyEnglish: `A required detail is missing: ${missingField}. Please provide it before confirmation.`,
        replyTamil: `முன்பதிவை உறுதி செய்வதற்கு முன் இந்த விவரம் தேவை: ${missingField}. தயவுசெய்து குறிப்பிடவும்.`
      };
    }

    // Call transactional booking engine
    const idempotencyKey = `voice_${draft.eventDate}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const bookingResult = await createBookingWithTransaction(draft, idempotencyKey);

    if (bookingResult.success) {
      const refCode = bookingResult.booking?.reference_code;
      return {
        success: true,
        stage: 'confirmed',
        draft: null,
        booking: bookingResult.booking,
        referenceCode: refCode,
        replyEnglish: `Your speaking session for ${draft.displayDate || draft.eventDate} has been successfully confirmed! Your official booking reference code is ${refCode}. Our speaker coordination desk will reach out within 24 business hours.`,
        replyTamil: `உங்கள் ${draft.displayDate || draft.eventDate} அமர்வுக்கான முன்பதிவு வெற்றிகரமாக உறுதி செய்யப்பட்டது! அதிகாரப்பூர்வ குறிப்பு எண்: ${refCode}. எங்களது ஒருங்கிணைப்புக் குழு 24 மணி நேரத்திற்குள் உங்களைத் தொடர்பு கொள்ளும்.`,
        action: {
          type: 'bookingConfirmed',
          referenceCode: refCode,
          booking: bookingResult.booking,
          targetSection: '#booking'
        }
      };
    } else {
      return {
        success: false,
        stage: 'error',
        draft,
        referenceCode: null,
        error: bookingResult.error,
        replyEnglish: `Unable to complete your booking reservation: ${bookingResult.error}`,
        replyTamil: `முன்பதிவை நிறைவு செய்ய முடியவில்லை: ${bookingResult.error}`
      };
    }
  }

  // 3. Extract Date dynamically (NEVER hardcodes any specific date)
  const dateResult = extractDateFromText(cleanText, { language });
  let dateChanged = false;

  if (dateResult.found) {
    // If date requires clarification (ambiguous, past, invalid, horizon)
    if (dateResult.requiresClarification) {
      return {
        success: true,
        stage: 'needs_clarification',
        draft,
        clarificationNeeded: true,
        replyEnglish: dateResult.clarificationPrompt,
        replyTamil: dateResult.clarificationPrompt,
        action: { type: 'clarificationNeeded', reason: dateResult.notes || dateResult.error }
      };
    }

    if (dateResult.isValid) {
      if (draft.eventDate !== dateResult.normalizedDate) {
        draft.eventDate = dateResult.normalizedDate;
        draft.displayDate = dateResult.displayDate;
        dateChanged = true;
      }
      if (dateResult.preferredSlot) {
        draft.preferredSlot = dateResult.preferredSlot;
      }

      // Check real availability for this extracted date
      const avail = await getVerifiedAvailability(draft.eventDate);
      draft.availabilityChecked = true;

      if (!avail.success) {
        return {
          success: false,
          stage: 'availability_error',
          draft,
          replyEnglish: `Could not check availability for ${draft.displayDate}: ${avail.error}`,
          replyTamil: `${draft.displayDate} தேதிக்கான நேர இருப்பைச் சரிபார்க்க முடியவில்லை: ${avail.error}`
        };
      }

      // Check if slots are booked
      const isUnavailable = avail.slots && avail.slots.length > 0 && avail.slots.every(s => String(s.status || '').toLowerCase() === 'booked');
      if (isUnavailable) {
        return {
          success: true,
          stage: 'unavailable',
          draft: { ...draft, eventDate: null },
          replyEnglish: `Madurai V Ramakrishnan is already booked for speaking engagements on ${draft.displayDate}. Please choose another upcoming date.`,
          replyTamil: `${draft.displayDate} அன்று MVR அவர்களின் அனைத்து அமர்வுகளும் ஏற்கனவே முன்பதிவு செய்யப்பட்டுள்ளன. தயவுசெய்து வேறு தேதியை குறிப்பிடவும்.`,
          action: { type: 'dateUnavailable', date: draft.eventDate }
        };
      }
    }
  }

  // 4. Extract other details present in the message
  const service = extractServiceType(cleanText);
  if (service) draft.serviceType = service;

  const phone = extractPhone(cleanText);
  if (phone) draft.phone = phone;

  const email = extractEmail(cleanText);
  if (email) draft.email = email;

  const city = extractCity(cleanText);
  if (city) draft.city = city;

  const name = extractOrganizerName(cleanText);
  if (name) draft.organizerName = name;

  // Defaults if reasonable context exists
  if (!draft.serviceType) draft.serviceType = 'Corporate Workshops';
  if (!draft.eventFormat) draft.eventFormat = 'In-Person Address';
  if (!draft.audienceSize) draft.audienceSize = '100 - 500 Attendees';

  // 5. Determine missing information
  if (!draft.eventDate) {
    return {
      success: true,
      stage: 'collecting_date',
      draft,
      replyEnglish: 'For which date would you like to book Madurai V Ramakrishnan? You can say any upcoming date, such as next Friday, December 5, or 15 days from today.',
      replyTamil: 'MVR அவர்களின் நிகழ்ச்சிக்கு எந்த தேதியில் முன்பதிவு செய்ய விரும்புகிறீர்கள்? அடுத்த வெள்ளிக்கிழமை அல்லது டிசம்பர் 5 போன்ற எந்த தேதியையும் நீங்கள் கூறலாம்.'
    };
  }

  if (!draft.city) {
    const dateFeedback = dateChanged
      ? (isTamil ? `${draft.displayDate || draft.eventDate} அன்று நேரம் உள்ளது! ` : `Verified: ${draft.displayDate || draft.eventDate} is available! `)
      : '';

    return {
      success: true,
      stage: 'collecting_city',
      draft,
      replyEnglish: `${dateFeedback}In which city or venue will the event take place? (For example: Chennai, Madurai, or Coimbatore)`,
      replyTamil: `${dateFeedback}நிகழ்ச்சி எந்த ஊரில் அல்லது அரங்கில் நடைபெற உள்ளது? (எடுத்துக்காட்டாக: சென்னை, மதுரை, அல்லது கோயம்புத்தூர்)`
    };
  }

  if (!draft.organizerName) {
    return {
      success: true,
      stage: 'collecting_organizer',
      draft,
      replyEnglish: `Got it, ${draft.city}. May I know your name or the primary event coordinator's name?`,
      replyTamil: `சரி, ${draft.city}. ஒருங்கிணைப்பாளரின் பெயர் என்ன?`
    };
  }

  if (!draft.phone) {
    return {
      success: true,
      stage: 'collecting_phone',
      draft,
      replyEnglish: `Thank you, ${draft.organizerName}. Please provide your contact phone number so our speaker desk can coordinate.`,
      replyTamil: `நன்றி ${draft.organizerName}. எங்களது ஒருங்கிணைப்புக் குழு உங்களைத் தொடர்பு கொள்ள உங்கள் தொலைபேசி எண்ணைக் கூறவும்.`
    };
  }

  // 6. All details collected! Formulate complete explicit summary & confirmation gate
  draft.awaitingConfirmation = true;

  const englishSummary = `Here is your speaking session summary:
• Program: ${draft.serviceType}
• Event Date: ${draft.displayDate || draft.eventDate}
• Preferred Slot: ${draft.preferredSlot}
• Venue: ${draft.city}
• Coordinator: ${draft.organizerName} (Phone: ${draft.phone})
• Availability Status: Verified Open on Speaking Tour
• Speaking Honorarium: Standard keynote package (confirmed by speaker desk).
Would you like me to confirm and reserve this speaking booking now? Please say Yes to confirm or No to cancel.`;

  const tamilSummary = `உங்கள் அமர்வு முன்பதிவு விவரங்கள்:
• நிகழ்ச்சி: ${draft.serviceType}
• தேதி: ${draft.displayDate || draft.eventDate}
• நேரம்: ${draft.preferredSlot}
• இடம்: ${draft.city}
• ஒருங்கிணைப்பாளர்: ${draft.organizerName} (தொலைபேசி: ${draft.phone})
• நிலை: MVR நேர அட்டவணையில் உறுதி செய்யப்பட்டது
• மதிப்பீட்டுக் கட்டணம்: நிலையான சிறப்புப் பேச்சு தொகுப்பு (ஒருங்கிணைப்பு மேசை மூலம் உறுதி செய்யப்படும்).
இந்த விவரங்களுடன் முன்பதிவை உறுதி செய்யலாமா? உறுதி செய்ய 'ஆம்' அல்லது ரத்து செய்ய 'இல்லை' என்று சொல்லுங்கள்.`;

  return {
    success: true,
    stage: 'summary_confirmation',
    draft,
    requiresExplicitConfirmation: true,
    replyEnglish: englishSummary,
    replyTamil: tamilSummary,
    action: {
      type: 'prepareBookingSummary',
      draft,
      targetSection: '#booking'
    }
  };
}
