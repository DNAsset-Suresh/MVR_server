import { getDbConfigStatus } from '../config/db.js';
import { getVerifiedAvailability } from './availabilityService.js';
import { getBooksCatalog } from './bookstoreService.js';
import { queryMvrBiography } from './mvrBiographyData.js';

/**
 * Strict allow-list of safe, permitted assistant actions.
 * Arbitrary SQL, shell commands, or unknown actions will be rejected.
 */
export const ALLOWED_ACTIONS = [
  'getServices',
  'checkAvailability',
  'prepareBookingSummary',
  'getContactInfo',
  'navigateToSection',
  'scrollPage',
  'getWebsiteOverview',
  'getCurrentPageContent',
  'getBookCatalog',
  'searchBooks',
  'getMvrBiography'
];

/**
 * Verified list of internal section anchors.
 * Arbitrary URLs, external links, and javascript: URIs are prohibited.
 */
export const ALLOWED_NAV_SECTIONS = [
  '#hero',
  '#achievements',
  '#services',
  '#bookstore',
  '#events',
  '#availability',
  '#booking',
  '#media',
  '#about',
  '#contact'
];

/**
 * Human-readable mapping of sections to labels.
 */
export const SECTION_METADATA = {
  '#hero': {
    title: 'Home / Hero',
    tamilTitle: 'முகப்பு',
    summary: 'Introduction to motivational speaker Madurai V Ramakrishnan, creed ("Inspire Empower Transform"), and primary actions.'
  },
  '#achievements': {
    title: 'Impact & Achievements',
    tamilTitle: 'தாக்கம் & சாதனைகள்',
    summary: '15+ Years Speaking Experience, 500+ Speeches Delivered, 1.2M+ Youth & Emerging Leaders Reached, 98.4% Audience Empowerment Rating.'
  },
  '#services': {
    title: 'Speaking Services & Workshops',
    tamilTitle: 'முதன்மைச் சேவைகள்',
    summary: 'Corporate Workshops (culture & leadership), Youth Motivation (self-belief & career resilience), Team Building (collaborative synergy).'
  },
  '#events': {
    title: 'Upcoming Events Tour',
    tamilTitle: 'வரவிருக்கும் நிகழ்வுகள்',
    summary: 'Upcoming tour stops including National Leadership Conclave (Mumbai), Youth Summit (Chennai), and Executive Mastery Retreat (Bengaluru).'
  },
  '#availability': {
    title: 'Speaking Calendar & Availability',
    tamilTitle: 'நேர அட்டவணை',
    summary: 'Interactive calendar previewing open speaking slots for Q4 2026 with real-time verification.'
  },
  '#booking': {
    title: 'Session Booking Inquiry',
    tamilTitle: 'அமர்வு முன்பதிவு',
    summary: 'Interactive form to request speaking engagements with format, slot preference, audience size, and verified summary preview.'
  },
  '#media': {
    title: 'Media & Press Gallery',
    tamilTitle: 'ஊடகம் மற்றும் பத்திரிகை தொகுப்பு',
    summary: 'High-energy speech video reels, national press coverage (The Hindu, Forbes India), broadcast interviews, official high-res photographs, and downloadable speaker press kit.'
  },
  '#about': {
    title: 'Speaker Story & Philosophy',
    tamilTitle: 'பேச்சாளர் வரலாறு & நோக்கம்',
    summary: '15+ years background of Madurai V Ramakrishnan, mentoring journey, and 3 core pillars: Multilingual Impact (Tamil & English), Actionable Frameworks, Tailored Programs.'
  },
  '#bookstore': {
    title: 'Book Purchase',
    tamilTitle: 'புத்தகங்கள் வாங்க',
    summary: 'Official online bookstore of Madurai V Ramakrishnan (MVR) featuring authored masterworks on leadership, youth empowerment, public speaking, and self-transformation with verified doorstep delivery.'
  },
  '#contact': {
    title: 'Official Inquiries & Coordination Desk',
    tamilTitle: 'தொடர்பு விவரங்கள்',
    summary: 'Direct organizer inquiries, office desk in Chennai & Bengaluru, email inquiry@inspireup.com, and phone +91 (0) 44 2000 0000.'
  }
};

/**
 * Official verified services catalog for InspireUp.
 */
const VERIFIED_SERVICES = [
  {
    id: 'corporate-workshops',
    title: 'Corporate Workshops',
    titleTamil: 'கார்ப்பரேட் பட்டறைகள்',
    category: 'Executive & Enterprises',
    description: 'High-impact corporate workshops to accelerate ownership, executive communication, and high-trust leadership culture.',
    duration: 'Half-Day (3.5 hrs) or Full-Day Intensive'
  },
  {
    id: 'youth-motivation',
    title: 'Youth Motivation',
    titleTamil: 'இளைஞர் ஊக்கம்',
    category: 'Universities & Youth Summits',
    description: 'Electrifying sessions tailored to ignite self-belief, future-ready focus, academic resilience, and career courage in students.',
    duration: '90 - 120 Minutes Session + Q&A'
  },
  {
    id: 'team-building',
    title: 'Team Building',
    titleTamil: 'குழு உருவாக்கம்',
    category: 'Teams & Departments',
    description: 'Dynamic team synergy experiences crafted to dismantle departmental silos and unleash collaborative peak performance.',
    duration: '2 to 4 Hours Experiential Workshop'
  }
];

/**
 * Official verified contact channels.
 */
const VERIFIED_CONTACT_INFO = {
  inquiryEmail: 'inquiry@inspireup.com',
  bookingDeskPhone: '+91 (0) 44 2000 0000',
  officeLocations: ['Chennai, Tamil Nadu, India', 'Bengaluru, Karnataka, India'],
  responseTimeHours: 24,
  note: 'Contact details represent official communication channels. Personal speaker phone numbers are confidential.'
};

/**
 * Executes an allow-listed action safely with strict server-side validation.
 *
 * @param {string} actionName
 * @param {object} args
 * @returns {Promise<object>} Action result
 */
export async function executeSafeAction(actionName, args = {}) {
  // 1. Strict Allow-list Check
  if (!ALLOWED_ACTIONS.includes(actionName)) {
    return {
      success: false,
      error: `Action '${actionName}' is prohibited or unsupported. Permitted actions: ${ALLOWED_ACTIONS.join(', ')}`
    };
  }

  // 2. Reject any attempt to pass SQL or shell commands
  const rawPayload = JSON.stringify(args || {});
  const sqlPatterns = [/select\s+/i, /drop\s+table/i, /insert\s+into/i, /delete\s+from/i, /update\s+.*set/i, /--/, /;\s*$/];
  for (const pattern of sqlPatterns) {
    if (pattern.test(rawPayload)) {
      return {
        success: false,
        error: 'Execution rejected: SQL keywords or dangerous injection patterns detected in action arguments.'
      };
    }
  }

  // 3. Dispatch to specific safe handler
  switch (actionName) {
    case 'getServices':
      return handleGetServices(args);

    case 'checkAvailability':
      return handleCheckAvailability(args);

    case 'prepareBookingSummary':
      return handlePrepareBookingSummary(args);

    case 'getContactInfo':
      return handleGetContactInfo(args);

    case 'navigateToSection':
      return handleNavigateToSection(args);

    case 'scrollPage':
      return handleScrollPage(args);

    case 'getWebsiteOverview':
      return handleGetWebsiteOverview(args);

    case 'getCurrentPageContent':
      return handleGetCurrentPageContent(args);

    case 'getBookCatalog':
      return handleGetBookCatalog(args);

    case 'searchBooks':
      return handleSearchBooks(args);

    case 'getMvrBiography':
      return handleGetMvrBiography(args);

    default:
      return {
        success: false,
        error: `Handler for action '${actionName}' is not defined.`
      };
  }
}

/**
 * Returns verified services catalog.
 */
function handleGetServices(args) {
  const categoryFilter = typeof args.category === 'string' ? args.category.toLowerCase() : null;

  let services = VERIFIED_SERVICES;
  if (categoryFilter) {
    services = services.filter(
      (s) => s.category.toLowerCase().includes(categoryFilter) || s.title.toLowerCase().includes(categoryFilter)
    );
  }

  return {
    success: true,
    action: 'getServices',
    count: services.length,
    services,
    note: 'Services sourced from verified keynote catalog.'
  };
}

/**
 * Checks availability safely via verified database records.
 * Strictly uses real records when schema is verified, and never invents fake slots.
 */
async function handleCheckAvailability(args) {
  const targetDate = args.date;
  const result = await getVerifiedAvailability(targetDate);

  if (!result.success) {
    return {
      success: false,
      action: 'checkAvailability',
      error: result.error
    };
  }

  return {
    success: true,
    action: 'checkAvailability',
    dbConnected: result.dbConnected,
    availabilityVerified: result.availabilityVerified,
    message: result.message || (result.availabilityVerified ? `Found ${result.count} verified speaking slot(s).` : 'Awaiting verified database connection.'),
    targetDate: targetDate || 'Upcoming',
    slots: result.slots || [],
    count: result.count !== undefined ? result.count : (result.slots?.length || 0),
    calendarSection: '#availability'
  };
}

/**
 * Prepares a booking summary preview for user review.
 * CRITICAL: This prepares and validates a summary only. It NEVER creates a booking record!
 */
function handlePrepareBookingSummary(args) {
  const {
    serviceType,
    eventDate,
    preferredSlot,
    organizerName,
    email,
    phone,
    organization,
    city
  } = args;

  const errors = [];

  if (!serviceType || typeof serviceType !== 'string' || !serviceType.trim()) {
    errors.push('serviceType is required');
  }
  if (!eventDate || typeof eventDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    errors.push('eventDate is required in YYYY-MM-DD format');
  }
  if (!organizerName || typeof organizerName !== 'string' || !organizerName.trim()) {
    errors.push('organizerName is required');
  }
  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push('A valid email address is required');
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    errors.push('A valid contact phone number is required');
  }
  if (!organization || typeof organization !== 'string' || !organization.trim()) {
    errors.push('organization is required');
  }

  if (errors.length > 0) {
    return {
      success: false,
      action: 'prepareBookingSummary',
      validationErrors: errors,
      error: `Validation failed: ${errors.join(', ')}`
    };
  }

  // Booking is explicitly NOT created
  return {
    success: true,
    action: 'prepareBookingSummary',
    bookingCreated: false,
    requiresExplicitConfirmation: true,
    summary: {
      serviceType: serviceType.trim(),
      eventDate,
      preferredSlot: preferredSlot || 'First Slot',
      organizerName: organizerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      organization: organization.trim(),
      city: (city || 'To be specified').trim(),
      preparedAt: new Date().toISOString()
    },
    disclaimer: 'Booking preview summary successfully validated on server. No database booking has been created. Explicit confirmation and authorized API submission are required to finalize.'
  };
}

/**
 * Returns verified contact information.
 */
function handleGetContactInfo() {
  return {
    success: true,
    action: 'getContactInfo',
    contact: VERIFIED_CONTACT_INFO,
    navigationAnchor: '#contact'
  };
}

/**
 * Validates internal section navigation target.
 * Rejects arbitrary URLs, script injections, or external redirections.
 */
function handleNavigateToSection(args) {
  const section = args.section;

  if (!section || typeof section !== 'string') {
    return {
      success: false,
      action: 'navigateToSection',
      error: 'Section parameter must be a non-empty string starting with #'
    };
  }

  const normalizedSection = section.toLowerCase().trim();

  if (!ALLOWED_NAV_SECTIONS.includes(normalizedSection)) {
    return {
      success: false,
      action: 'navigateToSection',
      error: `Navigation target '${section}' is not permitted. Permitted sections are: ${ALLOWED_NAV_SECTIONS.join(', ')}`,
      permittedSections: ALLOWED_NAV_SECTIONS
    };
  }

  const metadata = SECTION_METADATA[normalizedSection];

  return {
    success: true,
    action: 'navigateToSection',
    targetSection: normalizedSection,
    sectionTitle: metadata ? metadata.title : normalizedSection,
    note: 'Valid on-page navigation target.'
  };
}

/**
 * Validates page scrolling actions.
 */
function handleScrollPage(args) {
  const direction = typeof args.direction === 'string' ? args.direction.toLowerCase().trim() : '';
  const validDirections = ['top', 'bottom', 'previous'];

  if (!validDirections.includes(direction)) {
    return {
      success: false,
      action: 'scrollPage',
      error: `Scroll direction '${direction}' is invalid. Allowed: ${validDirections.join(', ')}`
    };
  }

  return {
    success: true,
    action: 'scrollPage',
    direction,
    note: `Triggered smooth scroll to ${direction}.`
  };
}

/**
 * Returns a complete, grounded overview of the website.
 */
function handleGetWebsiteOverview() {
  return {
    success: true,
    action: 'getWebsiteOverview',
    speaker: {
      name: 'Madurai V Ramakrishnan',
      monogram: 'MVR',
      role: 'Motivational Speaker, Leadership Coach & Youth Mentor',
      creed: 'Inspire Empower Transform',
      experienceYears: '15+',
      speechesDelivered: '500+',
      youthEmpowered: '1.2M+'
    },
    sections: Object.entries(SECTION_METADATA).map(([anchor, meta]) => ({
      anchor,
      title: meta.title,
      tamilTitle: meta.tamilTitle,
      summary: meta.summary
    })),
    capabilities: [
      'Navigate to any section via voice or menu',
      'Check speaking availability for upcoming tour dates',
      'Submit and preview booking inquiries',
      'Contact the speaker coordination desk in Chennai & Bengaluru'
    ]
  };
}

/**
 * Returns grounded content for a specific section or all sections.
 */
function handleGetCurrentPageContent(args) {
  const targetSection = typeof args.section === 'string' ? args.section.toLowerCase().trim() : null;

  if (targetSection && SECTION_METADATA[targetSection]) {
    const meta = SECTION_METADATA[targetSection];
    return {
      success: true,
      action: 'getCurrentPageContent',
      section: targetSection,
      title: meta.title,
      tamilTitle: meta.tamilTitle,
      content: meta.summary
    };
  }

  return {
    success: true,
    action: 'getCurrentPageContent',
    title: 'Madurai V Ramakrishnan (MVR) Official Platform',
    sections: Object.entries(SECTION_METADATA).map(([anchor, meta]) => ({
      anchor,
      title: meta.title,
      tamilTitle: meta.tamilTitle,
      content: meta.summary
    }))
  };
}

/**
 * Returns verified books catalogue from bookstore service.
 */
async function handleGetBookCatalog(args = {}) {
  const category = typeof args.category === 'string' ? args.category.trim() : null;
  const books = await getBooksCatalog({ category });
  return {
    success: true,
    action: 'getBookCatalog',
    count: books.length,
    books: books.map((b) => ({
      id: b.id,
      title: b.title,
      title_tamil: b.title_tamil,
      author: b.author,
      category: b.category,
      price: b.price,
      mrp: b.mrp,
      stock: b.stock_quantity,
      format: b.format,
      badge: b.badge
    })),
    disclaimer: 'Official verified publications authored by Madurai V Ramakrishnan (MVR).'
  };
}

/**
 * Searches books catalogue by keyword or topic.
 */
async function handleSearchBooks(args = {}) {
  const query = typeof args.query === 'string' ? args.query.trim() : '';
  const books = await getBooksCatalog({ query });
  return {
    success: true,
    action: 'searchBooks',
    query,
    count: books.length,
    results: books.map((b) => ({
      id: b.id,
      title: b.title,
      title_tamil: b.title_tamil,
      price: b.price,
      stock: b.stock_quantity,
      description: b.description
    }))
  };
}

/**
 * Retrieves verified facts from official MVR biography knowledge base.
 */
function handleGetMvrBiography(args = {}) {
  const query = typeof args.query === 'string' ? args.query.trim() : '';
  const category = typeof args.category === 'string' ? args.category.trim() : null;
  const language = typeof args.language === 'string' ? args.language.trim() : 'ta-IN';

  const result = queryMvrBiography({ query, category, language });

  return {
    success: true,
    action: 'getMvrBiography',
    category: result.category,
    availableInProfile: result.availableInProfile !== false,
    categoryTitleTamil: result.categoryTitleTamil,
    categoryTitleEnglish: result.categoryTitleEnglish,
    replyTamil: result.replyTamil,
    replyEnglish: result.replyEnglish,
    replyTanglish: result.replyTanglish,
    facts: result.facts,
    source: result.source
  };
}

