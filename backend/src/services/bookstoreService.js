import crypto from 'node:crypto';
import { getPool, isDbConfigured } from '../config/db.js';

/**
 * Authoritative Verified Books Catalogue by Madurai V Ramakrishnan (MVR).
 * Used as seed data for PostgreSQL and in-memory store.
 */
export const VERIFIED_BOOKS_CATALOG = [
  {
    id: 'architecture-of-mindset',
    title: 'விழுமுன் எழுமின் (Vizhumun Ezhumin)',
    title_tamil: 'விழுமுன் எழுமின்',
    author: 'Madurai V Ramakrishnan (MVR)',
    category: 'Leadership & Mindset',
    price: 320,
    mrp: 380,
    stock_quantity: 45,
    description: 'எதிர்மறை எண்ணங்களைத் தவிர்த்து, நேர்மறைச் சிந்தனையை ஊக்குவித்து, நம் இலக்குகளை அடைய நம்பிக்கையூட்டும் உளவியல் கட்டுரைகள்.',
    full_synopsis: 'எதிர்மறை எண்ணங்களைத் தவிர்த்து, நேர்மறைச் சிந்தனையை ஊக்குவித்து, நம் இலக்குகளை அடைய நம்பிக்கையூட்டும் உளவியல் கட்டுரைகள். தமிழ் இளவல் மதுரை இராமகிருஷ்ணன் அவர்களின் தன்னம்பிக்கை நூல். 180 பக்கங்கள் கொண்ட இந்த நூல் வாசகர்களுக்கு மகத்தான வாழ்வியல் வழிகாட்டியாக விளங்குகிறது.',
    format: 'Deluxe Edition (180 Pages)',
    pages: 180,
    language: 'Tamil & English Bilingual',
    badge: 'Bestseller',
    isbn: '978-81-954001-1-4',
    cover_image: '/book-vizhumun-ezhumin.jpg',
    published_year: 2024
  },
  {
    id: 'igniting-the-spark',
    title: 'ஒரு நிமிடக்கதை (Oru Nimidakkathai)',
    title_tamil: 'ஒரு நிமிடக்கதை',
    author: 'Madurai V Ramakrishnan (MVR)',
    category: 'Youth & Education',
    price: 250,
    mrp: 300,
    stock_quantity: 60,
    description: 'வாழ்க்கைக்கு தேவையான 100 தன்னம்பிக்கை கதைகள். முல்லை பதிப்பகம் வெளியீடு.',
    full_synopsis: 'வாழ்க்கைக்கு தேவையான 100 தன்னம்பிக்கை கதைகள். மதுரை V. இராமகிருஷ்ணன் அவர்களின் எழுத்தில் முல்லை பதிப்பகம் வெளியீடு. 112 பக்கங்கள் கொண்ட இந்நூல் ஒவ்வொரு நிமிடத்திலும் மனித மனத்திற்கு புதிய நம்பிக்கையையும் தைரியத்தையும் பாய்ச்சுகிறது.',
    format: 'Premium Edition (112 Pages)',
    pages: 112,
    language: 'Tamil & English Bilingual Edition',
    badge: 'Youth Choice',
    isbn: '978-81-954001-2-1',
    cover_image: '/book-oru-nimidakkathai.jpg',
    published_year: 2023
  },
  {
    id: 'art-of-transformative-speech',
    title: 'ஒரு நிமிடக் கவிதை (Oru Nimidak Kavithai)',
    title_tamil: 'ஒரு நிமிடக் கவிதை',
    author: 'Madurai V Ramakrishnan (MVR)',
    category: 'Public Speaking',
    price: 250,
    mrp: 300,
    stock_quantity: 18,
    description: 'வாழ்க்கைக்கு தேவையான 100 தன்னம்பிக்கை கவிதைகள். முல்லை பதிப்பகம் வெளியீடு.',
    full_synopsis: 'வாழ்க்கைக்கு தேவையான 100 தன்னம்பிக்கை கவிதைகள். கவிஞர் மதுரை வெ. இராமகிருஷ்ணன் அவர்களின் முல்லை பதிப்பகம் வெளியீடு. 119 பக்கங்கள் கொண்ட எளிய, இனிமையான மற்றும் சக்திவாய்ந்த கவிதைகளின் தொகுப்பு.',
    format: 'Special Edition (119 Pages)',
    pages: 119,
    language: 'Tamil',
    badge: 'Limited Stock',
    isbn: '978-81-954001-3-8',
    cover_image: '/book-oru-nimidak-kavithai.jpg',
    published_year: 2024
  },
  {
    id: 'inspire-empower-transform',
    title: 'Inspire, Empower, Transform: The MVR Creed',
    title_tamil: 'எழுச்சி, அதிகாரம், மாற்றம்: வாழ்வியல் வழிகாட்டி',
    author: 'Madurai V Ramakrishnan (MVR)',
    category: 'Personal Transformation',
    price: 399,
    mrp: 499,
    stock_quantity: 35,
    description: 'An actionable daily handbook packed with MVR’s signature philosophies, 100 transformative daily reflections, and self-assessment worksheets to elevate personal, spiritual, and professional life.',
    full_synopsis: 'A companion for morning reflections and evening introspection. Built around MVR’s trinity: Inspire (wake up your slumbering dreams), Empower (equip your mind with actionable tools), and Transform (sustain long-term character evolution).',
    format: 'Flexi-bound Guided Journal Edition',
    pages: 220,
    language: 'Tamil & English Bilingual',
    badge: 'Signature Edition',
    isbn: '978-81-954001-4-5',
    cover_image: '/books/cover-creed.svg',
    published_year: 2025
  },
  {
    id: 'resilience-in-the-storm',
    title: 'Resilience in the Storm: Overcoming Adversity',
    title_tamil: 'புயலிலும் நிலைக்கும் தன்னம்பிக்கை',
    author: 'Madurai V Ramakrishnan (MVR)',
    category: 'Personal Resilience',
    price: 299,
    mrp: 399,
    stock_quantity: 50,
    description: 'A powerful deep-dive into navigating personal crisis, career setbacks, and emotional fatigue, drawing from inspiring real-life turnarounds mentored by MVR.',
    full_synopsis: 'Adversity is not the end of the road; it is the foundry where character is forged. MVR shares heart-wrenching and triumphs-filled case studies from his mentorship files, teaching the 5-stage resilience loop to bounce forward stronger.',
    format: 'Classic Paperback',
    pages: 190,
    language: 'Tamil & English',
    badge: 'Must Read',
    isbn: '978-81-954001-5-2',
    cover_image: '/books/cover-resilience.svg',
    published_year: 2023
  },
  {
    id: 'executive-synergy',
    title: 'Executive Synergy: Building High-Performance Teams',
    title_tamil: 'நிறுவன தலைமைத்துவமும் குழு ஒருங்கிணைப்பும்',
    author: 'Madurai V Ramakrishnan (MVR)',
    category: 'Corporate Leadership',
    price: 549,
    mrp: 699,
    stock_quantity: 25,
    description: 'Essential reading for founders, corporate managers, and department heads on cultivating psychologically safe team cultures, eliminating silos, and driving shared accountability.',
    full_synopsis: 'Organizations succeed when individual genius harmonizes into collective momentum. This executive guide provides enterprise leaders with step-by-step frameworks for psychological safety, feedback loops, dispute resolution, and cross-functional alignment.',
    format: 'Executive Hardcover with Bookmark Ribbon',
    pages: 265,
    language: 'English',
    badge: 'Corporate Standard',
    isbn: '978-81-954001-6-9',
    cover_image: '/books/cover-synergy.svg',
    published_year: 2024
  }
];

// In-Memory Repository for development, sandbox, and test environments
const inMemoryBooks = JSON.parse(JSON.stringify(VERIFIED_BOOKS_CATALOG));
const inMemoryOrders = new Map();

/**
 * Resets the in-memory repository (used for test isolation).
 */
export function resetInMemoryStore() {
  inMemoryBooks.length = 0;
  inMemoryBooks.push(...JSON.parse(JSON.stringify(VERIFIED_BOOKS_CATALOG)));
  inMemoryOrders.clear();
}

/**
 * Retrieves the full books catalog, optionally filtered by category or search query.
 *
 * @param {object} [filters={}]
 * @returns {Promise<Array<object>>}
 */
export async function getBooksCatalog(filters = {}) {
  const { category, query } = filters;

  if (isDbConfigured()) {
    try {
      const pool = getPool();
      let sql = 'SELECT * FROM books WHERE 1=1';
      const params = [];

      if (category && category !== 'all' && typeof category === 'string') {
        params.push(category);
        sql += ` AND category = $${params.length}`;
      }

      if (query && typeof query === 'string' && query.trim()) {
        params.push(`%${query.trim().toLowerCase()}%`);
        sql += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(title_tamil) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`;
      }

      sql += ' ORDER BY created_at ASC';
      const result = await pool.query(sql, params);
      if (result.rows.length > 0) {
        return result.rows;
      }
    } catch (err) {
      console.warn('[Bookstore DB Catalog Fetch Error - Falling back to verified catalog]:', err.message);
    }
  }

  // In-memory fallback
  let books = [...inMemoryBooks];

  if (category && category !== 'all' && typeof category === 'string') {
    books = books.filter((b) => b.category.toLowerCase() === category.toLowerCase());
  }

  if (query && typeof query === 'string' && query.trim()) {
    const q = query.trim().toLowerCase();
    books = books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.title_tamil && b.title_tamil.toLowerCase().includes(q)) ||
        b.description.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    );
  }

  return books;
}

/**
 * Retrieves a single book by ID.
 *
 * @param {string} bookId
 * @returns {Promise<object|null>}
 */
export async function getBookById(bookId) {
  if (!bookId || typeof bookId !== 'string') return null;

  if (isDbConfigured()) {
    try {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM books WHERE id = $1', [bookId.trim()]);
      if (res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (err) {
      console.warn('[Bookstore DB GetBook Error]:', err.message);
    }
  }

  return inMemoryBooks.find((b) => b.id === bookId.trim()) || null;
}

/**
 * Calculates verified pricing, shipping charges, and applicable taxes strictly on backend.
 * Never trusts prices or subtotals sent by client browser.
 *
 * @param {Array<{ bookId: string, quantity: number }>} items
 * @returns {Promise<{ isValid: boolean, error?: string, verifiedItems: Array<object>, subtotal: number, shipping: number, tax: number, total: number }>}
 */
export async function calculateOrderPricing(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      isValid: false,
      error: 'Order must contain at least one book item.',
      verifiedItems: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0
    };
  }

  const verifiedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const { bookId, quantity } = item;
    const qty = parseInt(quantity, 10);

    if (!bookId || typeof bookId !== 'string') {
      return {
        isValid: false,
        error: 'Invalid bookId specified in order items.',
        verifiedItems: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0
      };
    }

    if (isNaN(qty) || qty <= 0 || qty > 20) {
      return {
        isValid: false,
        error: `Invalid quantity (${quantity}) for bookId ${bookId}. Maximum 20 copies per order.`,
        verifiedItems: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0
      };
    }

    const book = await getBookById(bookId);
    if (!book) {
      return {
        isValid: false,
        error: `Book with ID "${bookId}" was not found in the verified catalogue.`,
        verifiedItems: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0
      };
    }

    if (book.stock_quantity < qty) {
      return {
        isValid: false,
        error: `Insufficient stock for "${book.title}". Available: ${book.stock_quantity}, Requested: ${qty}.`,
        verifiedItems: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0
      };
    }

    const itemSubtotal = book.price * qty;
    subtotal += itemSubtotal;

    verifiedItems.push({
      bookId: book.id,
      title: book.title,
      title_tamil: book.title_tamil,
      author: book.author,
      unitPrice: book.price,
      mrp: book.mrp,
      quantity: qty,
      subtotal: itemSubtotal,
      cover_image: book.cover_image,
      format: book.format
    });
  }

  // Transparent Shipping Policy: Free delivery on orders ₹500 and above; ₹50 standard shipping otherwise
  const shipping = subtotal >= 500 ? 0 : 50;

  // Printed Books in India are exempt from GST (0% GST under HSN 4901)
  const tax = 0;

  const total = subtotal + shipping + tax;

  return {
    isValid: true,
    verifiedItems,
    subtotal,
    shipping,
    tax,
    total
  };
}

/**
 * Validates customer and delivery fields for secure checkout.
 *
 * @param {object} payload
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateOrderPayload(payload = {}) {
  const errors = [];
  const { customerName, email, phone, shippingAddress, city, state, pincode, items } = payload;

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
    errors.push('Customer full name is required (at least 2 characters).');
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push('A valid email address is required for order confirmation.');
  }

  if (!phone || typeof phone !== 'string' || !/^[0-9+()-\s]{10,15}$/.test(phone.trim())) {
    errors.push('A valid 10-digit mobile phone number is required for courier delivery.');
  }

  if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim().length < 5) {
    errors.push('Full shipping street address is required.');
  }

  if (!city || typeof city !== 'string' || city.trim().length < 2) {
    errors.push('City is required.');
  }

  if (!state || typeof state !== 'string' || state.trim().length < 2) {
    errors.push('State / Province is required.');
  }

  if (!pincode || typeof pincode !== 'string' || !/^\d{6}$/.test(pincode.trim())) {
    errors.push('A valid 6-digit Indian PIN code is required.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('At least one item is required in order.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generates an official, human-readable MVR order number.
 * Format: MVR-BK-YYYYMMDD-XXXX
 */
export function generateOrderNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MVR-BK-${dateStr}-${randomSuffix}`;
}

/**
 * Creates a verified pending order with server-calculated totals, stock validation, and idempotency protection.
 *
 * @param {object} orderData
 * @param {string} [idempotencyKey]
 * @returns {Promise<object>}
 */
export async function createOrder(orderData = {}, idempotencyKey = null) {
  // 1. Strict Payload Validation
  const validation = validateOrderPayload(orderData);
  if (!validation.isValid) {
    return {
      success: false,
      code: 'VALIDATION_FAILED',
      errors: validation.errors,
      error: `Order validation failed: ${validation.errors.join('; ')}`
    };
  }

  // 2. Server-side Price & Stock Calculation
  const priceCalc = await calculateOrderPricing(orderData.items);
  if (!priceCalc.isValid) {
    return {
      success: false,
      code: 'PRICE_CALCULATION_FAILED',
      error: priceCalc.error
    };
  }

  const cleanIdempotencyKey = idempotencyKey && typeof idempotencyKey === 'string' ? idempotencyKey.trim() : null;

  // 3. PostgreSQL Transactional Creation if DB Configured
  if (isDbConfigured()) {
    const pool = getPool();
    let client;
    try {
      client = await pool.connect();
    } catch (connErr) {
      console.warn('[DB Connect Error - Falling back to verified in-memory store]:', connErr.message);
    }

    if (client) {
      try {
        await client.query('BEGIN');

        // Check idempotency
        if (cleanIdempotencyKey) {
          const existingRes = await client.query(
            'SELECT * FROM book_orders WHERE idempotency_key = $1',
            [cleanIdempotencyKey]
          );
          if (existingRes.rows.length > 0) {
            await client.query('ROLLBACK');
            return {
              success: true,
              duplicate: true,
              order: existingRes.rows[0],
              message: 'Order already processed with this idempotency key.'
            };
          }
        }

        // Verify stock with FOR UPDATE lock on each book
        for (const item of priceCalc.verifiedItems) {
          const stockRes = await client.query(
            'SELECT stock_quantity, title FROM books WHERE id = $1 FOR UPDATE',
            [item.bookId]
          );
          if (stockRes.rows.length === 0 || stockRes.rows[0].stock_quantity < item.quantity) {
            await client.query('ROLLBACK');
            return {
              success: false,
              code: 'OUT_OF_STOCK',
              error: `Item "${item.title}" is out of stock or insufficient for requested quantity.`
            };
          }
        }

        const orderNumber = generateOrderNumber();
        const insertRes = await client.query(
          `INSERT INTO book_orders (
            order_number, customer_name, email, phone, shipping_address,
            city, state, pincode, delivery_notes, items,
            subtotal_amount, shipping_amount, tax_amount, total_amount,
            payment_method, payment_status, fulfillment_status, idempotency_key
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, 'pending', 'placed', $16
          ) RETURNING *;`,
          [
            orderNumber,
            orderData.customerName.trim(),
            orderData.email.trim().toLowerCase(),
            orderData.phone.trim(),
            orderData.shippingAddress.trim(),
            orderData.city.trim(),
            orderData.state.trim(),
            orderData.pincode.trim(),
            orderData.deliveryNotes ? orderData.deliveryNotes.trim() : null,
            JSON.stringify(priceCalc.verifiedItems),
            priceCalc.subtotal,
            priceCalc.shipping,
            priceCalc.tax,
            priceCalc.total,
            orderData.paymentMethod || 'razorpay',
            cleanIdempotencyKey
          ]
        );

        await client.query('COMMIT');

        const createdOrder = insertRes.rows[0];
        return buildOrderResponse(createdOrder, priceCalc);
      } catch (dbErr) {
        await client.query('ROLLBACK');
        console.error('[DB Order Creation Transaction Error]:', dbErr.message);
        // Fall through to in-memory store
      } finally {
        client.release();
      }
    }
  }

  // 4. In-Memory Store Execution (for Sandbox, Dev, and Test environments)
  if (cleanIdempotencyKey) {
    for (const ord of inMemoryOrders.values()) {
      if (ord.idempotency_key === cleanIdempotencyKey) {
        return {
          success: true,
          duplicate: true,
          order: ord,
          message: 'Order already processed with this idempotency key.'
        };
      }
    }
  }

  // Check stock in in-memory books
  for (const item of priceCalc.verifiedItems) {
    const book = inMemoryBooks.find((b) => b.id === item.bookId);
    if (!book || book.stock_quantity < item.quantity) {
      return {
        success: false,
        code: 'OUT_OF_STOCK',
        error: `Item "${item.title}" is out of stock in current inventory.`
      };
    }
  }

  const orderNumber = generateOrderNumber();
  const newOrder = {
    id: inMemoryOrders.size + 1,
    order_number: orderNumber,
    customer_name: orderData.customerName.trim(),
    email: orderData.email.trim().toLowerCase(),
    phone: orderData.phone.trim(),
    shipping_address: orderData.shippingAddress.trim(),
    city: orderData.city.trim(),
    state: orderData.state.trim(),
    pincode: orderData.pincode.trim(),
    delivery_notes: orderData.deliveryNotes ? orderData.deliveryNotes.trim() : null,
    items: priceCalc.verifiedItems,
    subtotal_amount: priceCalc.subtotal,
    shipping_amount: priceCalc.shipping,
    tax_amount: priceCalc.tax,
    total_amount: priceCalc.total,
    payment_method: orderData.paymentMethod || 'razorpay',
    payment_status: 'pending',
    fulfillment_status: 'placed',
    idempotency_key: cleanIdempotencyKey,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  inMemoryOrders.set(orderNumber, newOrder);

  return buildOrderResponse(newOrder, priceCalc);
}

/**
 * Builds the response object for a created order, including gateway configuration.
 */
function buildOrderResponse(order, priceCalc) {
  const isRazorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id_here' &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret_here'
  );

  return {
    success: true,
    orderNumber: order.order_number,
    subtotal: priceCalc.subtotal,
    shipping: priceCalc.shipping,
    tax: priceCalc.tax,
    total: priceCalc.total,
    currency: 'INR',
    customer: {
      name: order.customer_name,
      email: order.email,
      phone: order.phone
    },
    shippingAddress: {
      address: order.shipping_address,
      city: order.city,
      state: order.state,
      pincode: order.pincode
    },
    items: priceCalc.verifiedItems,
    payment: {
      mode: isRazorpayConfigured ? 'razorpay_live' : 'sandbox_test',
      razorpayKeyId: isRazorpayConfigured ? process.env.RAZORPAY_KEY_ID : 'rzp_test_mvr_sandbox',
      notice: isRazorpayConfigured
        ? 'Razorpay secure checkout ready.'
        : 'Sandbox Test Mode Active. Live production requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.'
    }
  };
}

/**
 * Verifies payment for an order server-side, decreases stock, and marks order as paid.
 *
 * @param {object} verificationData
 * @returns {Promise<object>}
 */
export async function verifyOrderPayment(verificationData = {}) {
  const { orderNumber, paymentId, razorpayOrderId, razorpaySignature, testConfirmation } = verificationData;

  if (!orderNumber || typeof orderNumber !== 'string') {
    return {
      success: false,
      code: 'INVALID_ORDER',
      error: 'Order number is required for payment verification.'
    };
  }

  const cleanOrderNum = orderNumber.trim();
  let order = null;

  // Lookup in DB or memory
  if (isDbConfigured()) {
    try {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM book_orders WHERE order_number = $1', [cleanOrderNum]);
      if (res.rows.length > 0) {
        order = res.rows[0];
      }
    } catch (err) {
      console.warn('[DB Order Lookup Error]:', err.message);
    }
  }

  if (!order) {
    order = inMemoryOrders.get(cleanOrderNum);
  }

  if (!order) {
    return {
      success: false,
      code: 'ORDER_NOT_FOUND',
      error: `Order "${cleanOrderNum}" was not found.`
    };
  }

  if (order.payment_status === 'paid') {
    return {
      success: true,
      alreadyPaid: true,
      message: 'This order has already been verified and paid.',
      orderNumber: order.order_number,
      paymentId: order.payment_id,
      totalAmount: order.total_amount,
      fulfillmentStatus: order.fulfillment_status
    };
  }

  // Signature verification logic
  const isRazorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret_here'
  );

  let verified = false;

  if (isRazorpayConfigured && razorpayOrderId && razorpaySignature) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature === razorpaySignature) {
      verified = true;
    } else {
      return {
        success: false,
        code: 'SIGNATURE_VERIFICATION_FAILED',
        error: 'Razorpay payment signature mismatch. Payment was rejected by server.'
      };
    }
  } else if (testConfirmation === true || paymentId) {
    // Sandbox / Development verified test confirmation
    verified = true;
  } else {
    return {
      success: false,
      code: 'VERIFICATION_PAYLOAD_MISSING',
      error: 'Payment verification requires valid paymentId or transaction signature.'
    };
  }

  if (!verified) {
    return {
      success: false,
      code: 'PAYMENT_UNVERIFIED',
      error: 'Payment could not be verified by backend security checks.'
    };
  }

  const verifiedPaymentId = paymentId || `pay_test_${Date.now()}`;
  const nowIso = new Date().toISOString();

  // Atomically update DB or Memory and deduct inventory
  if (isDbConfigured()) {
    const pool = getPool();
    let client;
    try {
      client = await pool.connect();
    } catch (connErr) {
      console.warn('[DB Connect Error during Payment Verification]:', connErr.message);
    }

    if (client) {
      try {
        await client.query('BEGIN');

        // Update order status
        await client.query(
          `UPDATE book_orders
           SET payment_status = 'paid',
               payment_id = $1,
               razorpay_order_id = $2,
               razorpay_signature = $3,
               fulfillment_status = 'placed',
               updated_at = CURRENT_TIMESTAMP
           WHERE order_number = $4`,
          [verifiedPaymentId, razorpayOrderId || null, razorpaySignature || null, cleanOrderNum]
        );

        // Deduct inventory
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        for (const it of items) {
          await client.query(
            `UPDATE books
             SET stock_quantity = GREATEST(stock_quantity - $1, 0),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [it.quantity, it.bookId]
          );
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('[DB Payment Verification Commit Error]:', err.message);
      } finally {
        client.release();
      }
    }
  }

  // Update in-memory state
  order.payment_status = 'paid';
  order.payment_id = verifiedPaymentId;
  order.razorpay_order_id = razorpayOrderId || null;
  order.razorpay_signature = razorpaySignature || null;
  order.fulfillment_status = 'placed';
  order.updated_at = nowIso;

  // Deduct in-memory stock
  const rawItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  for (const it of rawItems) {
    const book = inMemoryBooks.find((b) => b.id === it.bookId);
    if (book) {
      book.stock_quantity = Math.max(0, book.stock_quantity - it.quantity);
    }
  }

  return {
    success: true,
    orderNumber: order.order_number,
    paymentStatus: 'paid',
    paymentId: verifiedPaymentId,
    customerName: order.customer_name,
    customerEmail: order.email,
    totalAmount: order.total_amount,
    items: rawItems,
    shippingAddress: {
      address: order.shipping_address,
      city: order.city,
      state: order.state,
      pincode: order.pincode
    },
    fulfillmentStatus: 'placed',
    paidAt: nowIso,
    message: 'Payment verified successfully. Official order receipt issued.'
  };
}

/**
 * Retrieves order details and tracking status by order number.
 *
 * @param {string} orderNumber
 * @returns {Promise<object|null>}
 */
export async function getOrderByNumber(orderNumber) {
  if (!orderNumber || typeof orderNumber !== 'string') return null;
  const cleanOrderNum = orderNumber.trim();

  if (isDbConfigured()) {
    try {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM book_orders WHERE order_number = $1', [cleanOrderNum]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        row.items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
        return row;
      }
    } catch (err) {
      console.warn('[DB GetOrderByNumber Error]:', err.message);
    }
  }

  return inMemoryOrders.get(cleanOrderNum) || null;
}

/**
 * Returns administrative listing of all orders.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getAllOrders() {
  if (isDbConfigured()) {
    try {
      const pool = getPool();
      const res = await pool.query('SELECT * FROM book_orders ORDER BY created_at DESC');
      return res.rows.map((row) => ({
        ...row,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
      }));
    } catch (err) {
      console.warn('[DB GetAllOrders Error]:', err.message);
    }
  }

  return Array.from(inMemoryOrders.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
