import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { setMockDbPool, resetMockDbPool } from '../src/config/db.js';

describe('MVR Jarvis Dynamic Date Voice Booking Workflow', () => {
  // 1. Valid date later this month
  it('1. User asks for a valid date later this month', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Can you check availability for October 31, 2026?',
          language: 'en-US'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.intent, 'availability');
      assert.match(data.reply.english, /available/i);
      assert.equal(data.action.date, '2026-10-31');
    } finally {
      server.close();
    }
  });

  // 2. Date next month
  it('2. User asks to book a date next month (December 5, 2026)', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Can you book MVR for December 5, 2026?',
          language: 'en-US'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.intent, 'voice_booking');
      assert.equal(data.bookingDraft.eventDate, '2026-12-05');
      assert.ok(data.reply.english.includes('December 5, 2026') || data.reply.english.includes('2026-12-05') || data.reply.english.includes('city'));
    } finally {
      server.close();
    }
  });

  // 3. Date in a different year
  it('3. User schedules an event in a different year (March 3, 2027)', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I want to schedule an event on 3 March 2027.',
          language: 'en-US'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.intent, 'voice_booking');
      assert.equal(data.bookingDraft.eventDate, '2027-03-03');
    } finally {
      server.close();
    }
  });

  // 4. Date expressed in Tamil
  it('4. User speaks date in Tamil: "நவம்பர் 11-ஆம் தேதி நிகழ்ச்சிக்கு booking செய்யுங்கள்"', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'நவம்பர் 11-ஆம் தேதி நிகழ்ச்சிக்கு booking செய்யுங்கள்.',
          language: 'ta-IN'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.intent, 'voice_booking');
      assert.equal(data.bookingDraft.eventDate, '2026-11-11');
      assert.ok(data.reply.tamil);
    } finally {
      server.close();
    }
  });

  // 5. Date expressed in English
  it('5. User speaks date in English: "Book the speaker for November 11."', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Book the speaker for November 11.',
          language: 'en-US'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.intent, 'voice_booking');
      assert.equal(data.bookingDraft.eventDate, '2026-11-11');
    } finally {
      server.close();
    }
  });

  // 6. Mixed Tamil-English date request
  it('6. User speaks mixed Tamil-English date: "Jarvis, November 15 date book பண்ணுங்க"', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Jarvis, November 15 date book பண்ணுங்க.',
          language: 'ta-IN'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.intent, 'voice_booking');
      assert.equal(data.bookingDraft.eventDate, '2026-11-15');
    } finally {
      server.close();
    }
  });

  // 7. Relative date: tomorrow with time & slot
  it('7. User speaks relative date: "Book the speaker tomorrow at 6 PM."', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Book the speaker tomorrow at 6 PM.',
          language: 'en-US'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.intent, 'voice_booking');
      assert.ok(data.bookingDraft.eventDate);
      assert.equal(data.bookingDraft.preferredSlot, 'Second Slot');
    } finally {
      server.close();
    }
  });

  // 8. Weekday: next Friday
  it('8. User speaks weekday: "Check availability for next Friday."', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Check availability for next Friday.',
          language: 'en-US'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.intent, 'availability');
      assert.ok(data.action.date);
    } finally {
      server.close();
    }
  });

  // 9. Ambiguous numeric date: "05/06"
  it('9. Ambiguous numeric date "05/06" triggers clarification question without guessing', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Check availability for 05/06',
          language: 'en-US'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.intent, 'availability_clarification');
      assert.match(data.reply.english, /ambiguous/i);
    } finally {
      server.close();
    }
  });

  // 10. Invalid calendar date: February 30
  it('10. Invalid date (February 30) is rejected deterministically', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Book the speaker for February 30, 2027',
          language: 'en-US'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.match(data.reply.english, /not a valid calendar date/i);
    } finally {
      server.close();
    }
  });

  // 11. Past date
  it('11. Past date (2025-01-01) is rejected with guidance for upcoming date', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Book the speaker on 2025-01-01',
          language: 'en-US'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.match(data.reply.english, /past/i);
    } finally {
      server.close();
    }
  });

  // 12. Date outside permitted booking horizon (> 2 years)
  it('12. Date outside permitted booking horizon (>2 years) is rejected', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Book the speaker on 2030-01-01',
          language: 'en-US'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.match(data.reply.english, /2-year window/i);
    } finally {
      server.close();
    }
  });

  // 13. Unavailable date (all slots booked)
  it('13. Unavailable date reports booked status and offers alternatives', async () => {
    setMockDbPool({
      query: async (sql) => {
        if (sql.includes('information_schema.tables')) {
          return { rows: [{ table_name: 'services' }, { table_name: 'speaking_slots' }, { table_name: 'bookings' }] };
        }
        if (sql.includes('FROM speaking_slots')) {
          return {
            rows: [
              { id: '1', slot_date: '2026-11-20', slot_time: '10:00:00', label: 'First Slot', status: 'Booked' },
              { id: '2', slot_date: '2026-11-20', slot_time: '14:00:00', label: 'Second Slot', status: 'Booked' }
            ]
          };
        }
        return { rows: [] };
      }
    });

    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Check availability for November 20, 2026',
          language: 'en-US'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.match(data.reply.english, /fully booked|already booked/i);
    } finally {
      server.close();
      resetMockDbPool();
    }
  });

  // 14. Multi-turn booking: User changes date before confirmation
  it('14. User changes date during multi-turn booking before confirmation', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      // Step 1: Start booking for Nov 11
      const res1 = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Book the speaker for November 11.',
          language: 'en-US'
        })
      });
      const data1 = await res1.json();
      assert.equal(data1.bookingDraft.eventDate, '2026-11-11');

      // Step 2: User says "Actually change the date to December 12"
      const res2 = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Actually change the date to December 12.',
          language: 'en-US',
          bookingDraft: data1.bookingDraft
        })
      });
      const data2 = await res2.json();
      assert.equal(data2.bookingDraft.eventDate, '2026-12-12');
      assert.match(data2.reply.english, /December 12|city/i);
    } finally {
      server.close();
    }
  });

  // 15. Complete multi-turn booking with explicit confirmation gate
  it('15. Multi-turn booking collects missing details, presents summary, and enforces confirmation gate', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      // Turn 1: Start booking for a date
      const r1 = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Book Corporate Workshops for December 18, 2026',
          language: 'en-US'
        })
      });
      const d1 = await r1.json();
      assert.equal(d1.bookingDraft.eventDate, '2026-12-18');
      assert.equal(d1.bookingDraft.serviceType, 'Corporate Workshops');

      // Turn 2: Provide city
      const r2 = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'The event is in Chennai.',
          language: 'en-US',
          bookingDraft: d1.bookingDraft
        })
      });
      const d2 = await r2.json();
      assert.equal(d2.bookingDraft.city, 'Chennai');

      // Turn 3: Provide coordinator name and phone
      const r3 = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'My name is Ramesh Kumar, contact phone 9876543210',
          language: 'en-US',
          bookingDraft: d2.bookingDraft
        })
      });
      const d3 = await r3.json();
      assert.equal(d3.bookingDraft.organizerName, 'Ramesh Kumar');
      assert.equal(d3.bookingDraft.phone, '9876543210');
      // All fields collected! Summary must be presented and awaitingConfirmation must be true
      assert.equal(d3.bookingDraft.awaitingConfirmation, true);
      assert.match(d3.reply.english, /summary/i);
      assert.match(d3.reply.english, /confirm/i);

      setMockDbPool({
        query: async (sql) => {
          if (sql.includes('information_schema.tables')) {
            return { rows: [{ table_name: 'services' }, { table_name: 'speaking_slots' }, { table_name: 'bookings' }] };
          }
          if (sql.includes('FROM speaking_slots')) {
            return { rows: [{ id: 1, slot_date: '2026-12-18', slot_time: 'First Slot', status: 'available' }] };
          }
          return { rows: [] };
        },
        connect: async () => ({
          query: async (sql, params) => {
            if (sql.includes('BEGIN')) return {};
            if (sql.includes('WHERE idempotency_key = $1')) return { rows: [] };
            if (sql.includes('created_at > NOW() - INTERVAL')) return { rows: [] };
            if (sql.includes('FOR UPDATE')) {
              return { rows: [{ id: 10, status: 'available', slot_date: '2026-12-18', slot_time: 'First Slot' }] };
            }
            if (sql.includes('INSERT INTO bookings')) {
              return {
                rows: [{
                  id: 101,
                  reference_code: params[0],
                  status: 'confirmed'
                }]
              };
            }
            if (sql.includes('UPDATE speaking_slots')) return { rowCount: 1 };
            if (sql.includes('COMMIT')) return {};
            return { rows: [] };
          },
          release: () => {}
        })
      });

      // Turn 4: User explicitly confirms ("Yes, confirm")
      const r4 = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Yes, please confirm the booking.',
          language: 'en-US',
          bookingDraft: {
            ...d3.bookingDraft,
            email: 'ramesh@example.com',
            organization: 'Chennai Tech Forum'
          }
        })
      });
      const d4 = await r4.json();
      assert.equal(d4.success, true);
      assert.equal(d4.action.type, 'bookingConfirmed');
      assert.ok(d4.referenceCode);
      assert.match(d4.referenceCode, /^(?:MVR-BK-|INSP-)/);
      assert.match(d4.reply.english, new RegExp(d4.referenceCode));
    } finally {
      resetMockDbPool();
      server.close();
    }
  });

  // 16. Cancellation of booking draft
  it('16. User explicitly cancels booking draft when summary is presented', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const draft = {
        serviceType: 'Corporate Workshops',
        eventDate: '2026-11-25',
        displayDate: 'Wednesday, November 25, 2026',
        preferredSlot: 'First Slot',
        city: 'Chennai',
        organizerName: 'Priya',
        phone: '9840123456',
        awaitingConfirmation: true
      };

      const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'No, cancel it.',
          language: 'en-US',
          bookingDraft: draft
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.action.type, 'bookingCancelled');
      assert.equal(data.bookingDraft, null);
      assert.match(data.reply.english, /cancelled/i);
    } finally {
      server.close();
    }
  });
});
