import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { resetInMemoryStore } from '../src/services/bookstoreService.js';

test('GET /api/books returns verified books catalog with stock and prices', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/books`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.books));
    assert.equal(data.books.length, 6);

    const firstBook = data.books[0];
    assert.ok(firstBook.id);
    assert.ok(firstBook.title);
    assert.equal(firstBook.author, 'Madurai V Ramakrishnan (MVR)');
    assert.ok(firstBook.price > 0);
    assert.ok(firstBook.stock_quantity > 0);
  } finally {
    server.close();
  }
});

test('GET /api/books?category=Leadership returns filtered books', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/books?category=Leadership`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.books));
  } finally {
    server.close();
  }
});

test('GET /api/books/:id returns specific book and 404 for unknown ID', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/books/architecture-of-mindset`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.book.id, 'architecture-of-mindset');
    assert.equal(data.book.price, 320);

    const notFoundRes = await fetch(`http://localhost:${port}/api/books/non-existent-book`);
    assert.equal(notFoundRes.status, 404);
  } finally {
    server.close();
  }
});

test('POST /api/orders/calculate validates items and recalculates totals strictly on backend', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/orders/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { bookId: 'architecture-of-mindset', quantity: 2 }, // 320 * 2 = 640
          { bookId: 'igniting-the-spark', quantity: 1 }        // 250 * 1 = 250
        ]
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.subtotal, 890);
    assert.equal(data.shipping, 0); // Free shipping over 500
    assert.equal(data.tax, 0);
    assert.equal(data.total, 890);
    assert.equal(data.verifiedItems.length, 2);
  } finally {
    server.close();
  }
});

test('POST /api/orders/calculate adds shipping fee when subtotal is under ₹500', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/orders/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { bookId: 'resilience-in-the-storm', quantity: 1 } // 299 * 1 = 299 (< 500)
        ]
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.subtotal, 299);
    assert.equal(data.shipping, 50); // ₹50 shipping
    assert.equal(data.total, 349);
  } finally {
    server.close();
  }
});

test('POST /api/orders/calculate rejects invalid quantities or unknown books', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/orders/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ bookId: 'architecture-of-mindset', quantity: -5 }]
      })
    });
    assert.equal(res.status, 400);

    const res2 = await fetch(`http://localhost:${port}/api/orders/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ bookId: 'unknown-book-xyz', quantity: 1 }]
      })
    });
    assert.equal(res2.status, 400);
  } finally {
    server.close();
  }
});

test('POST /api/orders/create validates customer fields and creates pending order with idempotency', async () => {
  resetInMemoryStore();
  const server = app.listen(0);
  const port = server.address().port;

  const validPayload = {
    customerName: 'Karthik Subramanian',
    email: 'karthik.sub@example.com',
    phone: '+91 98765 43210',
    shippingAddress: '42, Temple Road, Anna Nagar West',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600040',
    deliveryNotes: 'Please call before delivery',
    items: [
      { bookId: 'architecture-of-mindset', quantity: 1 } // 449
    ]
  };

  try {
    // 1. Missing required field -> 400
    const invalidRes = await fetch(`http://localhost:${port}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, customerName: '' })
    });
    assert.equal(invalidRes.status, 400);

    // 2. Valid creation -> 201
    const createRes = await fetch(`http://localhost:${port}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'idemp-test-order-001'
      },
      body: JSON.stringify(validPayload)
    });
    assert.equal(createRes.status, 201);
    const orderData = await createRes.json();
    assert.equal(orderData.success, true);
    assert.ok(orderData.orderNumber.startsWith('MVR-BK-'));
    assert.equal(orderData.total, 370); // 320 + 50 shipping
    assert.ok(orderData.payment.mode);

    // 3. Duplicate submission with same Idempotency-Key returns existing order
    const dupRes = await fetch(`http://localhost:${port}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'idemp-test-order-001'
      },
      body: JSON.stringify(validPayload)
    });
    assert.equal(dupRes.status, 200);
    const dupData = await dupRes.json();
    assert.equal(dupData.duplicate, true);

    // 4. Verify payment -> decreases stock and issues receipt
    const verifyRes = await fetch(`http://localhost:${port}/api/orders/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: orderData.orderNumber,
        testConfirmation: true,
        paymentId: 'pay_test_karthik_123'
      })
    });
    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.success, true);
    assert.equal(verifyData.paymentStatus, 'paid');
    assert.equal(verifyData.paymentId, 'pay_test_karthik_123');

    // 5. Look up order
    const lookupRes = await fetch(`http://localhost:${port}/api/orders/${orderData.orderNumber}`);
    assert.equal(lookupRes.status, 200);
    const lookupData = await lookupRes.json();
    assert.equal(lookupData.order.paymentStatus, 'paid');
    assert.equal(lookupData.order.orderNumber, orderData.orderNumber);
  } finally {
    server.close();
  }
});

test('Voice Command: "Open online book purchase" navigates to genuine #bookstore section', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Jarvis, open online book purchase',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'navigateToSection');
    assert.equal(data.action.targetSection, '#bookstore');
    assert.ok(data.reply.english.toLowerCase().includes('book'));
  } finally {
    server.close();
  }
});

test('Voice Command: "Show me the available books" lists authored masterworks', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me the available books',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'getBookCatalog');
    assert.ok(data.action.count >= 6);
  } finally {
    server.close();
  }
});

test('Voice Command: "Show my cart" navigates to bookstore and opens cart drawer', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Jarvis, show my cart',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'showCart');
    assert.equal(data.action.targetSection, '#bookstore');
  } finally {
    server.close();
  }
});

test('Voice Command: "Pay now" enforces safety notice without unauthorized transactions', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Jarvis, pay now for the books',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.safetyConfirmationRequired, true);
    assert.ok(data.reply.english.includes('direct confirmation'));
  } finally {
    server.close();
  }
});
