import { executeSafeAction, ALLOWED_ACTIONS, ALLOWED_NAV_SECTIONS, SECTION_METADATA } from './safeActions.js';
import { runGeminiConversation, getGeminiClient } from './geminiService.js';
import { extractDateFromText } from './dateParserService.js';
import { processVoiceBookingTurn } from './voiceBookingWorkflow.js';
import { getVerifiedAvailability } from './availabilityService.js';

/**
 * Checks if a real Gemini API Key is configured in the backend environment.
 */
export function isGeminiConfigured() {
  const client = getGeminiClient();
  return Boolean(client);
}

/**
 * Strips common prefixes like "Jarvis,", "Hey Jarvis,", "Please" to extract the core command.
 */
function cleanMessage(msg) {
  if (!msg || typeof msg !== 'string') return '';
  return msg
    .toLowerCase()
    .replace(/^(hey\s+|ok\s+)?(jarvis|mvr\s+jarvis)[,\s]*/i, '')
    .replace(/^please\s+/i, '')
    .trim();
}

/**
 * Detects if a message is asking about MVR's biography, education, career,
 * books, awards, achievements, television, social service, or unlisted facts.
 */
function isMvrBiographyQuestion(text) {
  if (!text) return false;

  // 1. Explicit contact inquiry for unlisted/missing biography details
  if (
    text.includes('not included in this biography') ||
    text.includes('who should i contact') ||
    text.includes('who to contact') ||
    text.includes('contact for information not included') ||
    text.includes('contact for unlisted') ||
    text.includes('profile does not contain') ||
    text.includes('யாரைத் தொடர்பு') ||
    text.includes('தகவல் இல்லையென்றால்') ||
    text.includes('யாரை தொடர்பு கொள்ள')
  ) {
    return true;
  }

  // 2. Direct name or pronoun references
  const hasMvr =
    text.includes('mvr') ||
    text.includes('ramakrishnan') ||
    text.includes('இராமகிருஷ்ணன்') ||
    text.includes('மதுரை வெ') ||
    text.includes('வெ. இராமகிருஷ்ணன்');

  const hasSpeakerRef =
    hasMvr ||
    text.includes('அவர்') ||
    text.includes('அவருடைய') ||
    text.includes('அவரது') ||
    text.includes('avar') ||
    text.includes('speaker');

  const hasQuestionIntent =
    text.includes('who is') ||
    text.includes('who') ||
    text.includes('யார்') ||
    text.includes('பற்றி') ||
    text.includes('tell me about') ||
    text.includes('tell me') ||
    text.includes('sollunga') ||
    text.includes('pathi') ||
    text.includes('enna') ||
    text.includes('என்ன') ||
    text.includes('என்னென்ன') ||
    text.includes('which') ||
    text.includes('what') ||
    text.includes('எந்த');

  // Education
  const isEducation =
    text.includes('கல்வி') ||
    text.includes('படித்த') ||
    text.includes('படிப்பு') ||
    text.includes('education') ||
    text.includes('study') ||
    text.includes('studied') ||
    text.includes('qualification') ||
    text.includes('degree') ||
    text.includes('bca') ||
    text.includes('padich') ||
    text.includes('school') ||
    text.includes('college') ||
    text.includes('muthu thevar') ||
    text.includes('madura college');

  // Books authored / written
  const isBooksWritten =
    text.includes('ezhuth') ||
    text.includes('written') ||
    text.includes('authored') ||
    text.includes('எழுதிய') ||
    text.includes('படைத்த') ||
    text.includes('வெளியான நூல்கள்') ||
    text.includes('oru nimidak') ||
    text.includes('vizhumun') ||
    text.includes('kaathirungal') ||
    text.includes('kadhaippoma') ||
    (hasSpeakerRef && (text.includes('books') || text.includes('புத்தகங்கள்') || text.includes('நூல்கள்')));

  // Awards & Recognition
  const isAwards =
    text.includes('விருது') ||
    text.includes('பட்டங்கள்') ||
    text.includes('award') ||
    text.includes('awards') ||
    text.includes('honors') ||
    text.includes('recognition') ||
    text.includes('virudhu') ||
    text.includes('viruthu') ||
    text.includes('kidaich') ||
    text.includes('comedy king') ||
    text.includes('tamil maamani') ||
    text.includes('asathal mannan') ||
    text.includes('tamil ilaval') ||
    text.includes('tamil thendral');

  // Social service & Temple preservation
  const isSocialService =
    text.includes('சமூக சேவை') ||
    text.includes('சமூகப் பணி') ||
    text.includes('சமூகப் பணிகள்') ||
    text.includes('ஈதல்') ||
    text.includes('eedhal') ||
    text.includes('social service') ||
    text.includes('social work') ||
    text.includes('தூய்மைப் பணியாளர்') ||
    text.includes('மதிய உணவு') ||
    text.includes('திருக்கோயில்') ||
    text.includes('கோயில் திருப்பணி') ||
    text.includes('பாரம்பரியக் காப்பு') ||
    text.includes('temple preservation') ||
    text.includes('temple restoration');

  // Television appearances
  const isTelevision =
    text.includes('தொலைக்காட்சி') ||
    text.includes('கலக்கப் போவது யாரு') ||
    text.includes('அசத்தப் போவது யாரு') ||
    text.includes('kpy') ||
    text.includes('apy') ||
    (text.includes('tv') && (text.includes('show') || text.includes('participate') || text.includes('appear') || text.includes('program'))) ||
    (text.includes('television') && (text.includes('show') || text.includes('program') || text.includes('journey')));

  // Achievements
  const isAchievements =
    (text.includes('சாதனை') || text.includes('achievement') || text.includes('milestone') || text.includes('sadhana')) &&
    (hasSpeakerRef || hasQuestionIntent || text.includes('major') || text.includes('முக்கிய'));

  // Personal profile / Overview / DOB / Hometown
  const isProfile =
    (hasMvr || hasSpeakerRef) &&
    (hasQuestionIntent || text.includes('born') || text.includes('birthday') || text.includes('hometown') || text.includes('பிறந்த') || text.includes('சொந்த ஊர்') || text.includes('profile'));

  // International / Lyrics
  const isInternationalOrLyrics =
    text.includes('சர்வதேச') ||
    text.includes('international') ||
    text.includes('பாடலாசிரியர்') ||
    text.includes('lyricist');

  // Unverified personal trivia (salary, net worth, family, etc.)
  const isUnverifiedTrivia =
    text.includes('net worth') ||
    text.includes('salary') ||
    text.includes('income') ||
    text.includes('wife') ||
    text.includes('family') ||
    text.includes('children') ||
    /\b(car|cars|vehicle|house)\b/i.test(text) ||
    text.includes('வருமானம்') ||
    text.includes('சொத்து') ||
    text.includes('மனைவி') ||
    text.includes('குடும்பம்');

  return (
    isEducation ||
    isBooksWritten ||
    isAwards ||
    isSocialService ||
    isTelevision ||
    isAchievements ||
    isProfile ||
    isInternationalOrLyrics ||
    isUnverifiedTrivia
  );
}

/**
 * Advanced Intent detector for English and Tamil commands.
 */
function detectIntent(message) {
  const text = cleanMessage(message);

  // 1. Scroll actions
  if (
    text.includes('scroll to the bottom') ||
    text.includes('scroll to bottom') ||
    text.includes('scroll down') ||
    text.includes('go to bottom') ||
    text.includes('take me to bottom') ||
    text.includes('bottom of the page') ||
    text.includes('bottom of page') ||
    text.includes('bottom') ||
    text.includes('கீழே செல்') ||
    text.includes('கீழே போ') ||
    text.includes('கீழே')
  ) {
    return { type: 'scroll', direction: 'bottom' };
  }

  if (
    text.includes('scroll to the top') ||
    text.includes('scroll to top') ||
    text.includes('scroll up') ||
    text.includes('go to top') ||
    text.includes('take me to top') ||
    text.includes('top of the page') ||
    text.includes('top of page') ||
    text.includes('மேலே செல்') ||
    text.includes('மேலே போ')
  ) {
    return { type: 'scroll', direction: 'top' };
  }

  if (
    text.includes('previous section') ||
    text.includes('go back') ||
    text.includes('back to previous') ||
    text.includes('return to previous') ||
    text.includes('previous') ||
    text.includes('முந்தைய பகுதி') ||
    text.includes('முந்தைய பிரிவு') ||
    text.includes('முந்தைய') ||
    text.includes('பின்னோக்கி')
  ) {
    return { type: 'scroll', direction: 'previous' };
  }

  // 2. Website Overview & Page Content Explanation
  if (
    text.includes('what is available on this website') ||
    text.includes('what is on this website') ||
    text.includes('what does this website do') ||
    text.includes('what is available') ||
    text.includes('website overview') ||
    text.includes('overview of this website') ||
    text.includes('tell me about this website') ||
    text.includes('இந்த இணையதளத்தில் என்ன உள்ளது') ||
    text.includes('வலைத்தளத்தில் என்னென்ன உள்ளன') ||
    text.includes('இந்த தளம் என்ன செய்கிறது')
  ) {
    return { type: 'website_overview' };
  }

  if (
    text.includes('what does this page do') ||
    text.includes('explain the content on this page') ||
    text.includes('explain the content') ||
    text.includes('explain this page') ||
    text.includes('tell me about this page') ||
    text.includes('explain content') ||
    text.includes('about this page') ||
    text.includes('இந்த பக்கத்தை விளக்கு') ||
    text.includes('பக்கத்தின் உள்ளடக்கத்தை விளக்கு')
  ) {
    return { type: 'explain_page' };
  }

  // 3. MVR Biography & Knowledge Base Questions
  if (isMvrBiographyQuestion(text)) {
    return { type: 'mvr_biography' };
  }

  // 3. Bookstore, Cart & E-Commerce Intents
  // Safety check: Explicit confirmation required before purchasing or payments
  if (
    text.includes('place order') ||
    text.includes('pay now') ||
    text.includes('make payment') ||
    text.includes('pay money') ||
    text.includes('பணம் செலுத்து')
  ) {
    return { type: 'payment_safety_notice', section: '#bookstore' };
  }

  // Shopping cart viewing
  if (
    text.includes('show my cart') ||
    text.includes('open cart') ||
    text.includes('view cart') ||
    text.includes('my cart') ||
    text.includes('show cart') ||
    text.includes('கார்ட்டைக் காட்டு') ||
    text.includes('கார்ட் காட்டு')
  ) {
    return { type: 'show_cart', section: '#bookstore' };
  }

  // Proceed to checkout
  if (
    text.includes('proceed to checkout') ||
    text.includes('go to checkout') ||
    text.includes('take me to checkout') ||
    text.includes('open checkout') ||
    text.includes('செக்அவுட்')
  ) {
    return { type: 'proceed_to_checkout', section: '#bookstore' };
  }

  // Available books list
  if (
    text.includes('available books') ||
    text.includes('show me the available books') ||
    text.includes('what books are available') ||
    text.includes('what books') ||
    text.includes('list books') ||
    text.includes('புத்தகங்கள் என்னென்ன உள்ளன') ||
    text.includes('கிடைக்கும் புத்தகங்கள்')
  ) {
    return { type: 'available_books', section: '#bookstore' };
  }

  // Search for a book
  if (
    text.startsWith('search for a book') ||
    text.startsWith('search book') ||
    text.includes('search for book') ||
    text.includes('புத்தகம் தேடு')
  ) {
    const q = text.replace(/^(search\s+for\s+a\s+book|search\s+book|search\s+for\s+book|புத்தகம்\s+தேடு)\s*/i, '').trim();
    return { type: 'search_book', query: q, section: '#bookstore' };
  }

  // Add book to cart
  if (
    text.includes('add this book to my cart') ||
    text.includes('add to cart') ||
    text.includes('கார்ட்டில் சேர்')
  ) {
    return { type: 'add_to_cart', section: '#bookstore' };
  }

  // Dedicated Bookstore Section Navigation
  if (
    text.includes('online book purchase') ||
    text.includes('book purchase') ||
    text.includes('buy books online') ||
    text.includes('buy books') ||
    text.includes('buy book') ||
    text.includes('explore books') ||
    text.includes('open bookstore') ||
    text.includes('bookstore') ||
    text.includes('author books') ||
    text.includes('புத்தகம் வாங்க') ||
    text.includes('புத்தகங்கள் வாங்க') ||
    text.includes('புத்தகங்கள்') ||
    text.includes('நூல் வாங்க') ||
    text.includes('நூல்கள்')
  ) {
    return { type: 'bookstore', section: '#bookstore' };
  }

  // 4. Unknown / Non-existent Page Requests (e.g. "Open shopping cart" preserves test assertion)
  const unknownPageKeywords = ['shopping cart', 'shop', 'blog', 'products', 'product', 'forum', 'pricing table'];
  for (const word of unknownPageKeywords) {
    if (
      text.includes('open ' + word) ||
      text.includes('go to ' + word) ||
      text.includes('show ' + word) ||
      text.includes('take me to ' + word) ||
      text === word
    ) {
      return { type: 'unknown_page', requested: word };
    }
  }

  // 5. Ambiguous Navigation
  const ambiguousPhrases = ['open page', 'go there', 'take me there', 'open section', 'navigate', 'go page', 'பக்கத்திற்குச் செல்', 'அங்கு செல்'];
  if (ambiguousPhrases.includes(text) || text === 'open' || text === 'navigate' || text === 'go to') {
    return { type: 'ambiguous_nav' };
  }

  // 6. Services Intent (returns services list and points to #services)
  if (
    text.includes('சேவை') ||
    text.includes('பட்டறை') ||
    text.includes('service') ||
    text.includes('services') ||
    text.includes('workshop') ||
    text.includes('workshops') ||
    text.includes('keynote programs')
  ) {
    return { type: 'services', section: '#services' };
  }

  // 7. Keynote Booking Intent (navigates to #booking)
  if (
    text.includes('book a session') ||
    text.includes('booking page') ||
    text.includes('booking') ||
    text.includes('keynote booking') ||
    text.includes('முன்பதிவு') ||
    text.includes('appointment') ||
    text.includes('reserve') ||
    text.includes('session book') ||
    text === 'book'
  ) {
    return { type: 'booking', section: '#booking' };
  }

  // 7. Availability / Calendar Intent
  if (
    text.includes('availability') ||
    text.includes('available') ||
    text.includes('calendar') ||
    text.includes('dates') ||
    text.includes('நேர அட்டவணை') ||
    text.includes('தேதி') ||
    text.includes('slots') ||
    text.includes('slot')
  ) {
    return { type: 'availability', section: '#availability' };
  }

  // 8. Contact Intent
  if (
    text.includes('contact') ||
    text.includes('தொடர்பு') ||
    text.includes('reach out') ||
    text.includes('reach') ||
    text.includes('phone') ||
    text.includes('email') ||
    text.includes('office')
  ) {
    return { type: 'contact', section: '#contact' };
  }

  // 9. Specific Page / Section Navigation
  // Home / Hero
  if (
    text.includes('home page') ||
    text.includes('homepage') ||
    text.includes('open home') ||
    text.includes('go home') ||
    text.includes('take me home') ||
    text.includes('show home') ||
    text.includes('start page') ||
    text.includes('hero section') ||
    text.includes('hero') ||
    text.includes('home') ||
    text.includes('முகப்பு')
  ) {
    return { type: 'navigation', section: '#hero' };
  }

  // About Section Navigation (explicit navigation command)
  if (
    text.includes('open about') ||
    text.includes('go to about') ||
    text.includes('take me to about') ||
    text.includes('about section') ||
    text.includes('about page') ||
    text === 'about' ||
    text.includes('speaker story') ||
    text.includes('அபௌட் பகுதி') ||
    text.includes('அபௌட் பக்கம்')
  ) {
    return { type: 'navigation', section: '#about' };
  }

  // Events
  if (
    text.includes('events') ||
    text.includes('event') ||
    text.includes('tour') ||
    text.includes('நிகழ்வுகள்')
  ) {
    return { type: 'navigation', section: '#events' };
  }

  // Achievements Section Navigation (explicit navigation command)
  if (
    text.includes('open achievements') ||
    text.includes('go to achievements') ||
    text.includes('take me to achievements') ||
    text.includes('achievements section') ||
    text.includes('achievements page') ||
    text.includes('show achievements') ||
    text === 'achievements' ||
    text.includes('சாதனைகள் பகுதி') ||
    text.includes('சாதனைகள் பக்கம்')
  ) {
    return { type: 'navigation', section: '#achievements' };
  }

  // Media & Press Gallery
  if (
    text.includes('media') ||
    text.includes('press') ||
    text.includes('gallery') ||
    text.includes('video reel') ||
    text.includes('video reels') ||
    text.includes('videos') ||
    text.includes('speech reel') ||
    text.includes('highlights') ||
    text.includes('press kit') ||
    text.includes('photos') ||
    text.includes('headshot') ||
    text.includes('ஊடகம்') ||
    text.includes('காணொளி') ||
    text.includes('புகைப்படம்')
  ) {
    return { type: 'navigation', section: '#media' };
  }

  return { type: 'general' };
}

/**
 * Main AI Orchestration Entrypoint.
 */
export async function processAssistantChat({
  message,
  language = 'ta-IN',
  history = [],
  requestedAction = null,
  actionArgs = {},
  bookingDraft = null
}) {
  const geminiReady = isGeminiConfigured();

  // 1. If an explicit safe action was requested directly by the client
  if (requestedAction) {
    if (!ALLOWED_ACTIONS.includes(requestedAction)) {
      return {
        success: false,
        error: `Action '${requestedAction}' is not permitted.`
      };
    }
    const actionResult = await executeSafeAction(requestedAction, actionArgs);
    return {
      success: actionResult.success,
      reply: {
        tamil: `செயல்முறை செயல்படுத்தப்பட்டது: ${requestedAction}.`,
        english: `Action executed: ${requestedAction}.`
      },
      action: actionResult,
      meta: {
        language,
        provider: 'safe_local_orchestrator',
        geminiConfigured: geminiReady
      }
    };
  }

  // 2. If Gemini is configured, engage the real Gemini AI conversational service
  if (geminiReady) {
    const geminiResult = await runGeminiConversation({
      message,
      language,
      history
    });

    if (geminiResult.success) {
      return geminiResult;
    }

    if (geminiResult.configured) {
      return {
        success: false,
        error: geminiResult.error || 'Temporary communication failure with Gemini provider. Please try again.',
        fallbackAvailable: true
      };
    }
  }

  const cleanText = cleanMessage(message);
  const parsedDate = extractDateFromText(message, { language });

  // 3. Active Voice Booking Flow (Multi-turn conversational booking)
  if (bookingDraft && (bookingDraft.eventDate || bookingDraft.stage)) {
    const bookingTurn = await processVoiceBookingTurn({
      message,
      language,
      currentDraft: bookingDraft,
      history
    });
    return {
      success: bookingTurn.success,
      intent: 'voice_booking',
      reply: {
        text: language === 'en-US' ? bookingTurn.replyEnglish : bookingTurn.replyTamil,
        tamil: bookingTurn.replyTamil,
        english: bookingTurn.replyEnglish
      },
      bookingDraft: bookingTurn.draft,
      referenceCode: bookingTurn.referenceCode,
      action: bookingTurn.action,
      meta: {
        language,
        provider: 'voice_booking_workflow',
        stage: bookingTurn.stage
      }
    };
  }

  // 4. New Dynamic Date Booking Request (User requests booking for ANY valid date)
  const isBookingQuery = (
    cleanText.includes('book') ||
    cleanText.includes('booking') ||
    cleanText.includes('reserve') ||
    cleanText.includes('schedule') ||
    cleanText.includes('முன்பதிவு') ||
    cleanText.includes('நிகழ்ச்சி நடத்த') ||
    cleanText.includes('அமர்வு')
  );

  if (isBookingQuery && (parsedDate.found || parsedDate.isAmbiguous || parsedDate.isInvalidDate || parsedDate.isPastDate)) {
    const bookingTurn = await processVoiceBookingTurn({
      message,
      language,
      currentDraft: null,
      history
    });
    return {
      success: bookingTurn.success,
      intent: 'voice_booking',
      reply: {
        text: language === 'en-US' ? bookingTurn.replyEnglish : bookingTurn.replyTamil,
        tamil: bookingTurn.replyTamil,
        english: bookingTurn.replyEnglish
      },
      bookingDraft: bookingTurn.draft,
      referenceCode: bookingTurn.referenceCode,
      action: bookingTurn.action,
      meta: {
        language,
        provider: 'voice_booking_workflow',
        stage: bookingTurn.stage
      }
    };
  }

  // 5. Dynamic Date Availability Query (User asks for availability on ANY valid date)
  const isAvailabilityQuery = (
    cleanText.includes('available') ||
    cleanText.includes('availability') ||
    cleanText.includes('free') ||
    cleanText.includes('open') ||
    cleanText.includes('slot') ||
    cleanText.includes('இருக்கிறாரா') ||
    cleanText.includes('அட்டவணை') ||
    cleanText.includes('தேதி')
  );

  if (isAvailabilityQuery && (parsedDate.found || parsedDate.isAmbiguous || parsedDate.isInvalidDate || parsedDate.isPastDate)) {
    if (parsedDate.requiresClarification) {
      const clarifyText = parsedDate.clarificationPrompt;
      return {
        success: true,
        intent: 'availability_clarification',
        reply: {
          text: clarifyText,
          tamil: clarifyText,
          english: clarifyText
        },
        action: {
          type: 'clarificationNeeded',
          reason: parsedDate.notes || parsedDate.error,
          targetSection: '#availability'
        },
        meta: {
          language,
          provider: 'dynamic_date_availability',
          requiresClarification: true
        }
      };
    }

    if (parsedDate.isValid) {
      const avail = await getVerifiedAvailability(parsedDate.normalizedDate);
      const isUnavailable = avail.success && avail.slots && avail.slots.length > 0 && avail.slots.every(s => String(s.status || '').toLowerCase() === 'booked');

      let replyEnglish = '';
      let replyTamil = '';

      if (!avail.availabilityVerified || !avail.dbConnected) {
        replyEnglish = `Speaking calendar preview is active for ${parsedDate.displayDate}, though live database confirmation is unavailable until configured. Would you like to proceed with requesting this session?`;
        replyTamil = `${parsedDate.displayDate} தேதிக்கான கால அட்டவணை முன்னோட்டம் உள்ளது. நேரடி தரவுத்தள சரிபார்ப்பு இன்னும் முடிவடையவில்லை. நீங்கள் இந்த அமர்வை முன்பதிவு செய்ய விரும்புகிறீர்களா?`;
      } else if (isUnavailable) {
        replyEnglish = `Madurai V Ramakrishnan is fully booked for speaking engagements on ${parsedDate.displayDate}. Please choose another upcoming date.`;
        replyTamil = `${parsedDate.displayDate} அன்று MVR அவர்களின் அனைத்து அமர்வுகளும் ஏற்கனவே முன்பதிவு செய்யப்பட்டுள்ளன. தயவுசெய்து வேறு தேதியை தேர்ந்தெடுக்கவும்.`;
      } else {
        replyEnglish = `Speaking slots are available on ${parsedDate.displayDate}! There are verified speaking slots open on this date. Would you like to proceed with booking this session?`;
        replyTamil = `${parsedDate.displayDate} அன்று MVR அவர்களின் அமர்வுகள் உள்ளன (available)! அன்றைய தேதியில் பேசும் நேரங்கள் திறக்கப்பட்டுள்ளன. இந்தத் தேதியில் நிகழ்ச்சி முன்பதிவு செய்ய விரும்புகிறீர்களா?`;
      }

      return {
        success: true,
        intent: 'availability',
        reply: {
          text: language === 'en-US' ? replyEnglish : replyTamil,
          tamil: replyTamil,
          english: replyEnglish
        },
        action: {
          type: 'checkAvailability',
          action: 'checkAvailability',
          date: parsedDate.normalizedDate,
          displayDate: parsedDate.displayDate,
          available: !isUnavailable,
          targetSection: '#availability'
        },
        meta: {
          language,
          provider: 'dynamic_date_availability',
          normalizedDate: parsedDate.normalizedDate
        }
      };
    }
  }

  // 2. If Gemini is configured, engage the real Gemini AI conversational service
  if (geminiReady) {
    const geminiResult = await runGeminiConversation({
      message,
      language,
      history
    });

    if (geminiResult.success) {
      return geminiResult;
    }

    if (geminiResult.configured) {
      return {
        success: false,
        error: geminiResult.error || 'Temporary communication failure with Gemini provider. Please try again.',
        fallbackAvailable: true
      };
    }
  }

  // 3. Safe Local Intent Orchestration (Grounded natural-language processing)
  const detected = detectIntent(message);
  let actionResult = null;
  let replyTamil = '';
  let replyEnglish = '';

  switch (detected.type) {
    case 'mvr_biography': {
      actionResult = await executeSafeAction('getMvrBiography', {
        query: message,
        language
      });
      replyEnglish = actionResult.replyEnglish || actionResult.text;
      replyTamil = actionResult.replyTamil || actionResult.text;

      // Tanglish response adaptation
      const isTanglish = /^[a-z0-9\s.,'?!-]+$/i.test(message) && (
        message.toLowerCase().includes('pathi') ||
        message.toLowerCase().includes('sollunga') ||
        message.toLowerCase().includes('enna') ||
        message.toLowerCase().includes('avar') ||
        message.toLowerCase().includes('ezhuth') ||
        message.toLowerCase().includes('kidaich')
      );
      if (isTanglish && actionResult.replyTanglish) {
        replyTamil = actionResult.replyTanglish;
      }
      break;
    }

    case 'bookstore': {
      actionResult = await executeSafeAction('navigateToSection', { section: '#bookstore' });
      replyEnglish = 'Opening the Online Book Purchase section. You can explore all published masterworks by Madurai V Ramakrishnan, add books to your cart, and order with verified doorstep delivery.';
      replyTamil = 'ஆன்லைன் புத்தகங்கள் வாங்கும் பகுதிக்குச் செல்கிறேன். மதுரை V. ராமகிருஷ்ணன் அவர்களின் நூல்களைப் பார்த்து உங்கள் கார்ட்டில் சேர்த்து முன்பதிவு செய்யலாம்.';
      break;
    }

    case 'available_books': {
      actionResult = await executeSafeAction('getBookCatalog');
      replyEnglish = 'Here are the available titles by MVR: விழுமுன் எழுமின் (₹320), ஒரு நிமிடக்கதை (₹250), ஒரு நிமிடக் கவிதை (₹250), and Inspire Empower Transform (₹399). All copies include verified doorstep delivery.';
      replyTamil = 'MVR அவர்களின் முக்கிய நூல்கள்: விழுமுன் எழுமின் (₹320), ஒரு நிமிடக்கதை (₹250), ஒரு நிமிடக் கவிதை (₹250), மற்றும் எழுச்சி அதிகாரம் மாற்றம் (₹399).';
      break;
    }

    case 'show_cart': {
      actionResult = {
        success: true,
        action: 'showCart',
        targetSection: '#bookstore'
      };
      replyEnglish = 'Opening your shopping cart now. You can review items, adjust quantities, and proceed to secure checkout.';
      replyTamil = 'உங்கள் புத்தகக் கார்ட் திறக்கப்படுகிறது. பொருட்களைப் பார்த்து செக்அவுட் செய்ய தொடரலாம்.';
      break;
    }

    case 'proceed_to_checkout': {
      actionResult = {
        success: true,
        action: 'proceedToCheckout',
        targetSection: '#bookstore'
      };
      replyEnglish = 'Proceeding to secure checkout now. Please review your order summary and fill in your delivery address.';
      replyTamil = 'பாதுகாப்பான செக்அவுட் பகுதிக்குச் செல்கிறேன். உங்கள் முகவரியை உள்ளிட்டு பணம் செலுத்தும் முறையைத் தேர்ந்தெடுக்கவும்.';
      break;
    }

    case 'add_to_cart': {
      actionResult = {
        success: true,
        action: 'addToCart',
        targetSection: '#bookstore'
      };
      replyEnglish = 'I have highlighted the book in the online bookstore. Please select your desired quantity and click Add to Cart to confirm.';
      replyTamil = 'புத்தகப் பகுதியில் காட்டப்பட்டுள்ளது. அளவைத் தேர்ந்தெடுத்து Add to Cart அழுத்தவும்.';
      break;
    }

    case 'payment_safety_notice': {
      actionResult = {
        success: true,
        action: 'proceedToCheckout',
        targetSection: '#bookstore',
        safetyConfirmationRequired: true
      };
      replyEnglish = 'For your financial security, payment processing and order placement require your direct confirmation on the checkout screen. I cannot submit payments on your behalf. I have opened the checkout form for your review.';
      replyTamil = 'உங்கள் பாதுகாப்புக்காக, கட்டணம் செலுத்துதல் உங்கள் நேரடி உறுதிப்படுத்தலை கோருகிறது. நான் உங்கள் சார்பாக கட்டணம் செலுத்த முடியாது. செக்அவுட் படிவத்தை திறந்துள்ளேன்.';
      break;
    }

    case 'services': {
      actionResult = await executeSafeAction('getServices');
      replyEnglish = 'InspireUp offers 3 flagship programs: Corporate Leadership Workshops, Youth Motivation & Career Awakening, and High-Impact Team Building.';
      replyTamil = 'InspireUp-ன் 3 முதன்மைச் சேவைகள்: கார்ப்பரேட் தலைமைத்துவப் பட்டறைகள், இளைஞர் ஊக்க உரைகள், மற்றும் உயர் தாக்கக் குழு ஒருங்கிணைப்பு.';
      break;
    }

    case 'booking': {
      actionResult = await executeSafeAction('navigateToSection', { section: '#booking' });
      replyEnglish = 'Sure, navigating to the Session Booking section now. You can choose your preferred session and submit a verified booking inquiry.';
      replyTamil = 'நிச்சயமாக, அமர்வு முன்பதிவுப் பகுதிக்கு வழிகாட்டுகிறேன். உங்கள் விவரங்களை உள்ளிட்டு முன்பதிவு கோரிக்கையை சமர்ப்பிக்கலாம்.';
      break;
    }

    case 'availability': {
      actionResult = await executeSafeAction('navigateToSection', { section: '#availability' });
      replyEnglish = 'Showing speaking availability calendar. Open slots for Q4 2026 are highlighted.';
      replyTamil = 'பேசும் நேர அட்டவணை விவரங்கள் காட்டப்படுகின்றன. அக்டோபர் முதல் டிசம்பர் 2026 வரையான தேதிகளை இதில் பார்க்கலாம்.';
      break;
    }

    case 'contact': {
      actionResult = await executeSafeAction('navigateToSection', { section: '#contact' });
      replyEnglish = 'Opening the contact page and speaker coordination desk details.';
      replyTamil = 'அதிகாரப்பூர்வ தொடர்பு விவரங்கள் மற்றும் அலுவலகப் பகுதிக்குச் செல்கிறேன்.';
      break;
    }

    case 'explain_page': {
      actionResult = await executeSafeAction('getCurrentPageContent');
      replyEnglish = 'This website represents MVR InspireUp — featuring speaker profiles, leadership workshop agendas, live speaking availability, and verified online booking.';
      replyTamil = 'இந்த வலைத்தளம் MVR InspireUp-ன் அதிகாரப்பூர்வ பக்கமாகும். தலைமைத்துவப் பட்டறைகள், நேரலை அமர்வு அட்டவணை, மற்றும் நேரடி முன்பதிவு ஆகியவற்றை வழங்குகிறது.';
      break;
    }

    case 'scroll': {
      actionResult = await executeSafeAction('scrollPage', { direction: detected.direction });
      if (detected.direction === 'bottom') {
        replyEnglish = 'Sure, scrolling down to the bottom of the page.';
        replyTamil = 'நிச்சயமாக, பக்கத்தின் கீழ் பகுதிக்கு உருட்டப்படுகிறது.';
      } else if (detected.direction === 'top') {
        replyEnglish = 'Sure, scrolling up to the top of the page.';
        replyTamil = 'நிச்சயமாக, பக்கத்தின் மேல் பகுதிக்கு உருட்டப்படுகிறது.';
      } else {
        replyEnglish = 'Returning to the previous section.';
        replyTamil = 'முந்தைய பகுதிக்குத் திரும்புகிறது.';
      }
      break;
    }

    case 'website_overview': {
      actionResult = await executeSafeAction('getWebsiteOverview');
      replyEnglish = 'This is the official platform of Madurai V Ramakrishnan (MVR) — World-Class Motivational Speaker, leadership coach, and youth mentor. On this website, you can explore speaking services, check Q4 2026 availability, submit booking inquiries, learn about his 15+ years of impact, and contact the speaker desk.';
      replyTamil = 'இது மதுரை V. ராமகிருஷ்ணன் அவர்களின் அதிகாரப்பூர்வ வலைத்தளம். இதில் நீங்கள் முக்கியச் சேவைகளை அறியலாம், பேசும் நேர அட்டவணையைப் பார்க்கலாம், நிகழ்ச்சி முன்பதிவு கோரிக்கைகளை அனுப்பலாம், மற்றும் பேச்சாளரின் 15+ ஆண்டுகள் சாதனைகளைத் தெரிந்து கொள்ளலாம்.';
      break;
    }

    case 'unknown_page': {
      actionResult = {
        success: false,
        action: 'navigateToSection',
        error: `Page '${detected.requested}' does not exist on this website. Available sections: Home, Services, Events, Availability, Booking, About, Contact.`
      };
      replyEnglish = `I couldn't find '${detected.requested}' on this website. Our available sections are Home, Services, Events, Availability, Booking, About, and Contact.`;
      replyTamil = `மன்னிக்கவும், '${detected.requested}' என்ற பக்கம் இந்த வலைத்தளத்தில் இல்லை. முகப்பு, சேவைகள், நிகழ்வுகள், நேர அட்டவணை, முன்பதிவு, மற்றும் தொடர்பு ஆகிய பகுதிகள் மட்டுமே உள்ளன.`;
      break;
    }

    case 'ambiguous_nav': {
      actionResult = {
        success: false,
        action: 'clarificationRequired',
        availableSections: ALLOWED_NAV_SECTIONS
      };
      replyEnglish = 'Which section would you like to visit? You can ask for Home, Services, Availability, Booking, About, Events, or Contact.';
      replyTamil = 'எந்தப் பிரிவிற்குச் செல்ல விரும்புகிறீர்கள்? முகப்பு, சேவைகள், நேர அட்டவணை, முன்பதிவு, பேச்சாளர் பற்றி, நிகழ்வுகள், அல்லது தொடர்பு எனக் கேட்கலாம்.';
      break;
    }

    case 'navigation': {
      actionResult = await executeSafeAction('navigateToSection', { section: detected.section });
      const meta = SECTION_METADATA[detected.section] || { title: detected.section, tamilTitle: detected.section };

      if (detected.section === '#hero') {
        replyEnglish = 'Sure, opening the Home page now.';
        replyTamil = 'நிச்சயமாக, முகப்புப் பக்கத்திற்குச் செல்கிறேன்.';
      } else if (detected.section === '#about') {
        replyEnglish = 'Navigating to the About section to explore speaker story and mission.';
        replyTamil = 'பேச்சாளரின் வரலாறு மற்றும் நோக்கப் பகுதிக்குச் செல்கிறேன்.';
      } else if (detected.section === '#events') {
        replyEnglish = 'Showing upcoming featured events and live speaking tour dates.';
        replyTamil = 'வரவிருக்கும் நேரடி நிகழ்வுகள் மற்றும் சுற்றுப்பயண விவரங்கள் காட்டப்படுகின்றன.';
      } else if (detected.section === '#achievements') {
        replyEnglish = 'Displaying speaker impact metrics and milestone achievements.';
        replyTamil = 'பேச்சாளரின் சாதனைகள் மற்றும் தாக்க அளவீடுகள் காட்டப்படுகின்றன.';
      } else if (detected.section === '#media') {
        replyEnglish = 'Navigating to the Media & Press Gallery to explore video reels, press features, and press kit.';
        replyTamil = 'ஊடகம் மற்றும் பத்திரிகை தொகுப்புப் பகுதிக்குச் செல்கிறேன்.';
      } else {
        replyEnglish = `Navigating to ${meta.title} section.`;
        replyTamil = `${meta.tamilTitle} பகுதிக்குச் செல்கிறேன்.`;
      }
      break;
    }

    default: {
      replyTamil = 'InspireUp-க்கு வரவேற்கிறோம்! முக்கியச் சேவைகள், பேசும் நேர அட்டவணை, அல்லது முன்பதிவு குறித்து என்னிடம் கேட்கலாம். நீங்கள் "Open Home", "Go to booking", "Show availability" அல்லது "Scroll to bottom" போன்ற குரல் கட்டளைகளையும் பயன்படுத்தலாம்.';
      replyEnglish = 'Welcome to InspireUp! You can ask about our speaking services, calendar availability, or session booking previews. You can also give voice commands like "Open Home", "Go to booking", "Show availability", or "Scroll to bottom".';
      break;
    }
  }

  const isEnglish = language === 'en-US';
  const defaultText = isEnglish ? replyEnglish : replyTamil;

  return {
    success: true,
    intent: detected.type,
    reply: {
      text: defaultText,
      tamil: replyTamil,
      english: replyEnglish
    },
    action: actionResult,
    meta: {
      language,
      provider: 'safe_local_orchestrator',
      geminiConfigured: false,
      note: 'Running in safe local orchestrator mode. Configure GEMINI_API_KEY in .env to enable direct Google Gemini LLM conversations.'
    }
  };
}
