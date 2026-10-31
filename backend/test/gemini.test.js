import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { setMockGeminiClient, resetMockGeminiClient, sanitizeConversationHistory } from '../src/services/geminiService.js';

test.beforeEach(() => {
  resetMockGeminiClient();
});

test.afterEach(() => {
  resetMockGeminiClient();
});

test('Missing GEMINI_API_KEY falls back safely to local orchestrator without exposing secrets', async () => {
  resetMockGeminiClient();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What keynote sessions are available?' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.meta.geminiConfigured, false);
    assert.equal(data.meta.provider, 'safe_local_orchestrator');
  } finally {
    server.close();
  }
});

test('Mocked Gemini returns genuine Tamil response without consuming API quota', async () => {
  const mockAi = {
    models: {
      generateContent: async () => ({
        text: 'வணக்கம்! InspireUp தளத்திற்கு தங்களை அன்புடன் வரவேற்கிறோம். எங்கள் ஊக்கமளிக்கும் உரைகள் உங்கள் குழுவை நிச்சயம் மாற்றும்.',
        functionCalls: []
      })
    }
  };

  setMockGeminiClient(mockAi);
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'வணக்கம்',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.meta.provider, 'google_gemini');
    assert.ok(data.reply.text.includes('வணக்கம்! InspireUp'));
  } finally {
    server.close();
  }
});

test('Mocked Gemini returns genuine English response with multi-turn context', async () => {
  let receivedContents = null;

  const mockAi = {
    models: {
      generateContent: async ({ contents }) => {
        receivedContents = contents;
        return {
          text: 'We offer transformative Corporate Workshops and Youth Empowerment keynotes tailored to your goals.',
          functionCalls: []
        };
      }
    }
  };

  setMockGeminiClient(mockAi);
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me more about the leadership sessions',
        language: 'en-US',
        history: [
          { sender: 'user', text: 'Hi, I represent Apex Global.' },
          { sender: 'assistant', text: 'Welcome to InspireUp! How can I assist you today?' }
        ]
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.meta.provider, 'google_gemini');
    assert.ok(data.reply.text.includes('Corporate Workshops'));

    // Verify multi-turn history was bounded and passed into Gemini contents
    assert.ok(Array.isArray(receivedContents));
    assert.equal(receivedContents.length, 3); // 2 history items + 1 current message
    assert.equal(receivedContents[0].role, 'user');
    assert.equal(receivedContents[1].role, 'model');
    assert.equal(receivedContents[2].role, 'user');
  } finally {
    server.close();
  }
});

test('Mocked Gemini function calling executes safe getServices tool and summarizes results', async () => {
  let callCount = 0;

  const mockAi = {
    models: {
      generateContent: async () => {
        callCount++;
        if (callCount === 1) {
          // Turn 1: Model requests getServices tool
          return {
            functionCalls: [
              {
                name: 'getServices',
                args: { category: 'corporate' }
              }
            ],
            candidates: [{ content: { parts: [{ text: '' }] } }]
          };
        }
        // Turn 2: Model formulate final speech response from tool results
        return {
          text: 'InspireUp provides Corporate Workshops for executives to elevate leadership culture and ownership mindset.',
          functionCalls: []
        };
      }
    }
  };

  setMockGeminiClient(mockAi);
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What corporate programs do you offer?'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.meta.provider, 'google_gemini');
    assert.equal(data.action.action, 'getServices');
    assert.ok(data.action.services.length > 0);
    assert.ok(data.reply.text.includes('Corporate Workshops'));
    assert.equal(callCount, 2);
  } finally {
    server.close();
  }
});

test('Gemini function calling rejects unauthorized tool names attempted by model', async () => {
  const mockAi = {
    models: {
      generateContent: async () => ({
        functionCalls: [
          {
            name: 'unauthorizedAdminAction',
            args: { target: 'all' }
          }
        ]
      })
    }
  };

  setMockGeminiClient(mockAi);
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Trigger malicious tool' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('unauthorized action'));
  } finally {
    server.close();
  }
});

test('prepareBookingSummary via Gemini function calling never creates real database records', async () => {
  let callCount = 0;

  const mockAi = {
    models: {
      generateContent: async () => {
        callCount++;
        if (callCount === 1) {
          return {
            functionCalls: [
              {
                name: 'prepareBookingSummary',
                args: {
                  serviceType: 'Youth Motivation',
                  eventDate: '2026-11-14',
                  organizerName: 'Kavitha S',
                  email: 'kavitha@annauniv.edu',
                  phone: '+91 94444 12345',
                  organization: 'Anna University',
                  city: 'Chennai'
                }
              }
            ]
          };
        }
        return {
          text: 'I have prepared your booking summary preview for Anna University. Please review it on the page.',
          functionCalls: []
        };
      }
    }
  };

  setMockGeminiClient(mockAi);
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Book Youth Motivation for Anna University on Nov 14' })
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

test('Gemini provider error (429 Rate Limit) is handled cleanly without exposing secrets', async () => {
  const mockAi = {
    models: {
      generateContent: async () => {
        const error = new Error('Resource has been exhausted (e.g. check quota).');
        error.status = 429;
        throw error;
      }
    }
  };

  setMockGeminiClient(mockAi);
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello AI' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('quota exceeded') || data.error.includes('rate limit'));
    assert.equal(data.fallbackAvailable, true);
  } finally {
    server.close();
  }
});

test('sanitizeConversationHistory enforces maximum turn limits and discards invalid schemas', () => {
  const rawHistory = [
    { sender: 'user', text: 'Turn 1' },
    { sender: 'assistant', text: 'Turn 2' },
    { sender: 'user', text: 'Turn 3' },
    { sender: 'assistant', text: 'Turn 4' },
    { sender: 'user', text: 'Turn 5' },
    { sender: 'assistant', text: 'Turn 6' },
    { sender: 'user', text: 'Turn 7' },
    { sender: 'assistant', text: 'Turn 8' },
    { sender: 'user', text: 'Turn 9' },
    { sender: 'assistant', text: 'Turn 10' }
  ];

  const sanitized = sanitizeConversationHistory(rawHistory);
  // Maximum 8 bounded turns
  assert.equal(sanitized.length, 8);
  assert.equal(sanitized[sanitized.length - 1].parts[0].text, 'Turn 10');
  assert.equal(sanitized[sanitized.length - 1].role, 'model');

  // Discard empty or invalid
  const invalid = sanitizeConversationHistory([null, undefined, {}, { text: '   ' }]);
  assert.equal(invalid.length, 0);
});
