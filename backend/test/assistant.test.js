import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

test('POST /api/assistant/chat processes Tamil message and returns safe services', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'வணக்கம், உங்கள் சேவைகள் என்னென்ன?',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.reply.tamil);
    assert.ok(data.reply.english);
    assert.equal(data.intent, 'services');
    assert.ok(Array.isArray(data.action.services));
    assert.equal(data.action.services.length, 3);
  } finally {
    server.close();
  }
});

test('POST /api/assistant/chat processes Tanglish booking inquiry without creating a booking', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Enakku oru keynote session book pannanum',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'booking');
    assert.equal(data.action.action, 'navigateToSection');
    assert.equal(data.action.targetSection, '#booking');
    // Ensure no booking record was minted
    assert.equal(data.bookingCreated, undefined);
  } finally {
    server.close();
  }
});

test('POST /api/assistant/chat rejects empty or whitespace-only messages with 400', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ' })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('cannot be blank'));
  } finally {
    server.close();
  }
});

test('POST /api/assistant/chat rejects oversized messages (>1000 characters) with 400', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const oversizedMessage = 'A'.repeat(1005);
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: oversizedMessage })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('exceeds maximum allowed length'));
  } finally {
    server.close();
  }
});

test('POST /api/assistant/chat rejects unsupported or arbitrary actions', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Execute shell command',
        action: 'executeShellCommand'
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('is not permitted'));
  } finally {
    server.close();
  }
});

test('prepareBookingSummary validates arguments and NEVER creates database records', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Please prepare booking summary for my conference',
        action: 'prepareBookingSummary',
        actionArgs: {
          serviceType: 'Corporate Workshops',
          eventDate: '2026-11-20',
          organizerName: 'Praveen Raj',
          email: 'praveen@globaltech.com',
          phone: '+91 98765 43210',
          organization: 'GlobalTech Solutions',
          city: 'Chennai'
        }
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'prepareBookingSummary');
    assert.equal(data.action.bookingCreated, false);
    assert.equal(data.action.requiresExplicitConfirmation, true);
    assert.ok(data.action.disclaimer.includes('No database booking has been created'));
  } finally {
    server.close();
  }
});

test('Safe actions reject SQL injection patterns inside action arguments', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Check availability with injection',
        action: 'checkAvailability',
        actionArgs: {
          date: "2026-11-20'; DROP TABLE bookings; --"
        }
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.action.success, false);
    assert.ok(data.action.error.includes('SQL keywords or dangerous injection patterns detected'));
  } finally {
    server.close();
  }
});

test('navigateToSection prohibits arbitrary external URLs', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Navigate to external evil site',
        action: 'navigateToSection',
        actionArgs: {
          section: 'https://evil-phishing-site.com'
        }
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.action.success, false);
    assert.ok(data.action.error.includes('is not permitted'));
  } finally {
    server.close();
  }
});

test('GET /api/assistant/actions returns strict allow-list definitions', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/actions`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.allowedActions));
    assert.ok(data.allowedActions.includes('getServices'));
    assert.ok(data.allowedActions.includes('checkAvailability'));
    assert.ok(data.allowedActions.includes('prepareBookingSummary'));
    assert.ok(data.allowedActions.includes('getContactInfo'));
    assert.ok(data.allowedActions.includes('navigateToSection'));
    assert.ok(Array.isArray(data.allowedNavigationSections));
  } finally {
    server.close();
  }
});

test('POST /api/assistant/voice transparently reports when Cloud Speech provider is not configured', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: 'dGVzdF9hdWRpb19kYXRh',
        format: 'audio/webm',
        language: 'ta-IN'
      })
    });

    // Expect 503 Service Unavailable when provider credentials are not in environment
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.configured, false);
    assert.ok(data.error.includes('Cloud Speech provider is not configured'));
    assert.equal(data.fallbackAvailable, true);
  } finally {
    server.close();
  }
});

test('POST /api/assistant/chat includes standard RateLimit headers', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' })
    });

    assert.equal(res.status, 200);
    // express-rate-limit standard headers
    assert.ok(res.headers.has('ratelimit-limit') || res.headers.has('x-ratelimit-limit'));
  } finally {
    server.close();
  }
});

test('Missing GEMINI_API_KEY is handled transparently without exposing secrets', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Can I book a session?' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.meta.geminiConfigured, false);
    assert.equal(data.meta.provider, 'safe_local_orchestrator');
    assert.ok(data.meta.note.includes('Configure GEMINI_API_KEY in .env'));
  } finally {
    server.close();
  }
});

test('Voice Command: "Jarvis, open the home page" targets genuine #hero section', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Jarvis, open the home page',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'navigateToSection');
    assert.equal(data.action.targetSection, '#hero');
    assert.ok(data.reply.english.toLowerCase().includes('home page'));
  } finally {
    server.close();
  }
});

test('Voice Command: "Go to the booking page" opens genuine #booking section without creating records', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Go to the booking page',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'navigateToSection');
    assert.equal(data.action.targetSection, '#booking');
    assert.equal(data.bookingCreated, undefined);
  } finally {
    server.close();
  }
});

test('Voice Command: "Show me availability" opens genuine #availability section', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me availability',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'navigateToSection');
    assert.equal(data.action.targetSection, '#availability');
    assert.ok(data.reply.english.toLowerCase().includes('availability'));
  } finally {
    server.close();
  }
});

test('Voice Command: "Open the contact page" navigates to genuine #contact section', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Open the contact page',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'navigateToSection');
    assert.equal(data.action.targetSection, '#contact');
    assert.ok(data.reply.english.toLowerCase().includes('contact'));
  } finally {
    server.close();
  }
});

test('Voice Command: "Jarvis, open the media section" navigates to genuine #media section', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Jarvis, open the media section',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'navigateToSection');
    assert.equal(data.action.targetSection, '#media');
    assert.ok(data.reply.english.toLowerCase().includes('media'));
  } finally {
    server.close();
  }
});

test('Voice Command: "What does this page do?" returns grounded page explanation', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What does this page do?',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'getCurrentPageContent');
    assert.ok(Array.isArray(data.action.sections));
    assert.ok(data.action.sections.length >= 7);
    assert.ok(data.reply.english.includes('InspireUp'));
  } finally {
    server.close();
  }
});

test('Voice Command: "What is available on this website?" returns complete website overview', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is available on this website?',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'getWebsiteOverview');
    assert.ok(data.action.speaker.name);
    assert.ok(Array.isArray(data.action.sections));
    assert.ok(data.action.sections.length >= 7);
  } finally {
    server.close();
  }
});

test('Voice Command: Unknown page request does NOT navigate to invented route', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Open shopping cart',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.success, false);
    assert.ok(data.action.error.includes("does not exist"));
    assert.equal(data.action.targetSection, undefined);
  } finally {
    server.close();
  }
});

test('Voice Command: "Scroll to the bottom" triggers safe scroll action', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Scroll to the bottom',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'scrollPage');
    assert.equal(data.action.direction, 'bottom');
  } finally {
    server.close();
  }
});

test('Voice Command: "Go back to the previous section" triggers safe back scroll action', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Go back to the previous section',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'scrollPage');
    assert.equal(data.action.direction, 'previous');
  } finally {
    server.close();
  }
});

test('Voice Command: Tamil voice command "முகப்புப் பக்கத்தைத் திற" navigates to #hero', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'முகப்புப் பக்கத்தைத் திற',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.action, 'navigateToSection');
    assert.equal(data.action.targetSection, '#hero');
    assert.ok(data.reply.tamil.includes('முகப்பு'));
  } finally {
    server.close();
  }
});

