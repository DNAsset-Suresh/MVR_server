import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { setMockDbPool, resetMockDbPool } from '../src/config/db.js';
import { executeSafeAction } from '../src/services/safeActions.js';

test.beforeEach(() => {
  resetMockDbPool();
});

test.afterEach(() => {
  resetMockDbPool();
});

test('GET /api/availability returns transparent status without fake slots when DB is unconfigured', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/availability`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.dbConnected, false);
    assert.equal(data.availabilityVerified, false);
    assert.deepEqual(data.slots, []);
    assert.ok(data.message.includes('preview mode'));
  } finally {
    server.close();
  }
});

test('GET /api/availability rejects malformed date parameters with 400', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/availability?date=invalid-date-format`);
    assert.equal(res.status, 400);

    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('Expected YYYY-MM-DD'));
  } finally {
    server.close();
  }
});

test('GET /api/availability queries actual database records when DB is verified', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const mockSlots = [
    { id: 1, slot_date: '2026-11-20', slot_time: '09:30 AM - 12:30 PM', label: 'Morning Keynote', status: 'available' },
    { id: 2, slot_date: '2026-11-20', slot_time: '02:00 PM - 05:00 PM', label: 'Afternoon Workshop', status: 'available' }
  ];

  setMockDbPool({
    query: async (sql) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ table_name: 'services' }, { table_name: 'speaking_slots' }, { table_name: 'bookings' }] };
      }
      if (sql.includes('FROM speaking_slots')) {
        return { rows: mockSlots };
      }
      return { rows: [] };
    }
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/availability?date=2026-11-20`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.dbConnected, true);
    assert.equal(data.availabilityVerified, true);
    assert.equal(data.count, 2);
    assert.equal(data.slots[0].slot_time, '09:30 AM - 12:30 PM');
  } finally {
    server.close();
  }
});

test('POST /api/bookings rejects incomplete or invalid booking fields with 400', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceType: 'Corporate Workshops',
        eventDate: '2026-11-20',
        organizerName: '', // Invalid: empty
        email: 'invalid-email', // Invalid email
        phone: '123' // Too short
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.code, 'VALIDATION_FAILED');
    assert.ok(data.errors.length > 0);
  } finally {
    server.close();
  }
});

test('POST /api/bookings returns 503 when PostgreSQL is unconfigured', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceType: 'Corporate Workshops',
        eventDate: '2026-11-20',
        preferredSlot: 'Morning Keynote (09:30 AM - 12:30 PM)',
        eventFormat: 'In-Person Keynote',
        audienceSize: '100 - 500 Attendees',
        organizerName: 'Priya Sundaram',
        email: 'priya@apexcorp.com',
        phone: '+91 98765 43210',
        organization: 'Apex Corp',
        city: 'Chennai'
      })
    });

    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.code, 'DB_UNCONFIGURED');
    assert.ok(data.error.includes('PostgreSQL database is not configured'));
  } finally {
    server.close();
  }
});

test('POST /api/bookings creates booking and updates slot within a successful transaction', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const transactionLog = [];

  const mockClient = {
    query: async (sql, params) => {
      transactionLog.push({ sql: sql.trim().split('\n')[0], params });

      if (sql.includes('BEGIN')) return {};
      if (sql.includes('WHERE idempotency_key = $1')) return { rows: [] };
      if (sql.includes('created_at > NOW() - INTERVAL')) return { rows: [] };
      if (sql.includes('FOR UPDATE')) {
        return {
          rows: [{ id: 10, status: 'available', slot_date: '2026-11-20', slot_time: 'Morning Keynote (09:30 AM - 12:30 PM)' }]
        };
      }
      if (sql.includes('INSERT INTO bookings')) {
        return {
          rows: [{
            id: 101,
            reference_code: params[0],
            service_type: params[1],
            event_date: '2026-11-20',
            preferred_slot: params[3],
            organizer_name: params[6],
            email: params[7],
            organization: params[9],
            status: 'confirmed',
            created_at: new Date().toISOString()
          }]
        };
      }
      if (sql.includes('UPDATE speaking_slots')) return { rowCount: 1 };
      if (sql.includes('COMMIT')) return {};
      return { rows: [] };
    },
    release: () => transactionLog.push('RELEASE')
  };

  setMockDbPool({
    query: async (sql) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ table_name: 'services' }, { table_name: 'speaking_slots' }, { table_name: 'bookings' }] };
      }
      return { rows: [] };
    },
    connect: async () => mockClient
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'client-key-12345'
      },
      body: JSON.stringify({
        serviceType: 'Corporate Workshops',
        eventDate: '2026-11-20',
        preferredSlot: 'Morning Keynote (09:30 AM - 12:30 PM)',
        eventFormat: 'In-Person Keynote',
        audienceSize: '100 - 500 Attendees',
        organizerName: 'Karthik Raja',
        email: 'karthik@enterprises.com',
        phone: '+91 94440 12345',
        organization: 'Enterprises Ltd',
        city: 'Coimbatore',
        themeNotes: 'Leadership and culture transformation'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.confirmed, true);
    assert.ok(data.booking.reference_code.startsWith('INSP-2026-'));
    assert.equal(data.booking.status, 'confirmed');

    // Verify transaction sequence
    const queries = transactionLog.map((t) => (typeof t === 'string' ? t : t.sql));
    assert.ok(queries.includes('BEGIN'));
    assert.ok(queries.includes('COMMIT'));
    assert.ok(queries.includes('RELEASE'));
  } finally {
    server.close();
  }
});

test('POST /api/bookings rejects overlapping booking on already-booked slot with 409 Conflict', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const transactionLog = [];

  const mockClient = {
    query: async (sql) => {
      transactionLog.push(sql.trim().split('\n')[0]);
      if (sql.includes('BEGIN')) return {};
      if (sql.includes('FOR UPDATE')) {
        // Slot is already booked!
        return {
          rows: [{ id: 10, status: 'booked', slot_date: '2026-11-20', slot_time: 'Morning Keynote (09:30 AM - 12:30 PM)' }]
        };
      }
      if (sql.includes('ROLLBACK')) return {};
      return { rows: [] };
    },
    release: () => transactionLog.push('RELEASE')
  };

  setMockDbPool({
    query: async (sql) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ table_name: 'services' }, { table_name: 'speaking_slots' }, { table_name: 'bookings' }] };
      }
      return { rows: [] };
    },
    connect: async () => mockClient
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceType: 'Corporate Workshops',
        eventDate: '2026-11-20',
        preferredSlot: 'Morning Keynote (09:30 AM - 12:30 PM)',
        eventFormat: 'In-Person Keynote',
        audienceSize: '100 - 500 Attendees',
        organizerName: 'Shankar Raman',
        email: 'shankar@techcorp.in',
        phone: '+91 98840 54321',
        organization: 'TechCorp',
        city: 'Chennai'
      })
    });

    assert.equal(res.status, 409);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.code, 'SLOT_UNAVAILABLE');
    assert.ok(data.error.includes('already booked'));

    // Verify ROLLBACK was executed
    assert.ok(transactionLog.includes('ROLLBACK'));
    assert.ok(transactionLog.includes('RELEASE'));
  } finally {
    server.close();
  }
});

test('POST /api/bookings enforces duplicate-submission protection with idempotency key', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const existingBooking = {
    id: 99,
    reference_code: 'INSP-2026-DUPE1',
    service_type: 'Corporate Workshops',
    event_date: '2026-11-20',
    preferred_slot: 'Morning Keynote (09:30 AM - 12:30 PM)',
    status: 'confirmed',
    created_at: new Date().toISOString()
  };

  const mockClient = {
    query: async (sql) => {
      if (sql.includes('BEGIN')) return {};
      if (sql.includes('WHERE idempotency_key = $1')) {
        // Return existing booking
        return { rows: [existingBooking] };
      }
      if (sql.includes('ROLLBACK')) return {};
      return { rows: [] };
    },
    release: () => {}
  };

  setMockDbPool({
    query: async (sql) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ table_name: 'services' }, { table_name: 'speaking_slots' }, { table_name: 'bookings' }] };
      }
      return { rows: [] };
    },
    connect: async () => mockClient
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'existing-key-999'
      },
      body: JSON.stringify({
        serviceType: 'Corporate Workshops',
        eventDate: '2026-11-20',
        preferredSlot: 'Morning Keynote (09:30 AM - 12:30 PM)',
        eventFormat: 'In-Person Keynote',
        audienceSize: '100 - 500 Attendees',
        organizerName: 'Duplicate Tester',
        email: 'tester@test.com',
        phone: '+91 99999 88888',
        organization: 'Test Org',
        city: 'Chennai'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.duplicate, true);
    assert.equal(data.booking.reference_code, 'INSP-2026-DUPE1');
  } finally {
    server.close();
  }
});

test('POST /api/bookings rolls back transaction when database error occurs mid-flight', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  let rollbackCalled = false;

  const mockClient = {
    query: async (sql) => {
      if (sql.includes('BEGIN')) return {};
      if (sql.includes('FOR UPDATE')) {
        return { rows: [{ id: 10, status: 'available', slot_date: '2026-11-20', slot_time: 'Morning Keynote' }] };
      }
      if (sql.includes('INSERT INTO bookings')) {
        throw new Error('Database disk full / network partition exception');
      }
      if (sql.includes('ROLLBACK')) {
        rollbackCalled = true;
        return {};
      }
      return { rows: [] };
    },
    release: () => {}
  };

  setMockDbPool({
    query: async (sql) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ table_name: 'services' }, { table_name: 'speaking_slots' }, { table_name: 'bookings' }] };
      }
      return { rows: [] };
    },
    connect: async () => mockClient
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceType: 'Corporate Workshops',
        eventDate: '2026-11-20',
        preferredSlot: 'Morning Keynote',
        eventFormat: 'In-Person Keynote',
        audienceSize: '100 Attendees',
        organizerName: 'Crash Tester',
        email: 'crash@test.com',
        phone: '+91 98765 00000',
        organization: 'Crash Org',
        city: 'Madurai'
      })
    });

    assert.equal(res.status, 500);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.code, 'TRANSACTION_ROLLBACK');
    assert.equal(rollbackCalled, true);
  } finally {
    server.close();
  }
});

test('Assistant checkAvailability safe action queries real DB records when mock pool is provided', async () => {
  setMockDbPool({
    query: async (sql) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ table_name: 'services' }, { table_name: 'speaking_slots' }, { table_name: 'bookings' }] };
      }
      if (sql.includes('FROM speaking_slots')) {
        return {
          rows: [
            { id: 1, slot_date: '2026-11-20', slot_time: '09:30 AM - 12:30 PM', label: 'Morning Slot', status: 'available' }
          ]
        };
      }
      return { rows: [] };
    }
  });

  const result = await executeSafeAction('checkAvailability', { date: '2026-11-20' });
  assert.equal(result.success, true);
  assert.equal(result.dbConnected, true);
  assert.equal(result.availabilityVerified, true);
  assert.equal(result.count, 1);
  assert.equal(result.slots[0].slot_time, '09:30 AM - 12:30 PM');
});
