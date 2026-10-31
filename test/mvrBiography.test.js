import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { setMockGeminiClient, resetMockGeminiClient } from '../src/services/geminiService.js';

test.beforeEach(() => {
  resetMockGeminiClient();
});

test.afterEach(() => {
  resetMockGeminiClient();
});

// 1. Who is MVR? (English)
test('MVR Biography: "Who is MVR?" returns verified personal profile in English', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Who is MVR?',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'personal_profile');
    assert.ok(data.reply.english.includes('Madurai V. Ramakrishnan'));
    assert.ok(data.reply.english.includes('motivational speaker'));
    assert.ok(data.reply.english.includes('life counselor'));
  } finally {
    server.close();
  }
});

// 2. MVR யார்? (Tamil)
test('MVR Biography: "MVR யார்?" returns verified personal profile in Tamil', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'MVR யார்?',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'personal_profile');
    assert.ok(data.reply.tamil.includes('மதுரை வெ. இராமகிருஷ்ணன்'));
    assert.ok(data.reply.tamil.includes('தன்னம்பிக்கைப் பேச்சாளர்'));
    assert.ok(data.reply.tamil.includes('வாழ்வியல் ஆலோசகர்'));
  } finally {
    server.close();
  }
});

// 3. What did MVR study? (English)
test('MVR Biography: "What did MVR study?" returns exact school and college credentials', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What did MVR study?',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'education');
    assert.ok(data.reply.english.includes('Muthu Thevar Mukkulathor Higher Secondary School'));
    assert.ok(data.reply.english.includes('BCA'));
    assert.ok(data.reply.english.includes('The Madura College'));
  } finally {
    server.close();
  }
});

// 4. MVR அவர்களின் கல்விப் பின்னணி என்ன? (Tamil)
test('MVR Biography: "MVR அவர்களின் கல்விப் பின்னணி என்ன?" returns school and college in Tamil', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'MVR அவர்களின் கல்விப் பின்னணி என்ன?',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'education');
    assert.ok(data.reply.tamil.includes('முத்து தேவர் முக்குலத்தோர்'));
    assert.ok(data.reply.tamil.includes('மதுரை கல்லூரி'));
    assert.ok(data.reply.tamil.includes('BCA'));
  } finally {
    server.close();
  }
});

// 5. Which books has he written? (English)
test('MVR Biography: "Which books has he written?" returns all 6 published book titles', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Which books has he written?',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'books');
    const text = data.reply.english;
    assert.ok(text.includes('Oru Nimidak Kadhai'));
    assert.ok(text.includes('Oru Nimidak Kavithai'));
    assert.ok(text.includes('Kaathirungal Kaadhalippom'));
    assert.ok(text.includes('Kadhaippoma'));
    assert.ok(text.includes('Vizhumun Ezhumin'));
  } finally {
    server.close();
  }
});

// 6. அவர் பெற்ற விருதுகள் என்ன? (Tamil)
test('MVR Biography: "அவர் பெற்ற விருதுகள் என்ன?" returns genuine awards list', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'அவர் பெற்ற விருதுகள் என்ன?',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'awards');
    const text = data.reply.tamil;
    assert.ok(text.includes('தமிழ்மாமணி'));
    assert.ok(text.includes('காமெடி கிங்'));
    assert.ok(text.includes('அசத்தல் மன்னன்'));
    assert.ok(text.includes('தமிழ் இளவல்'));
    assert.ok(text.includes('தமிழ்த் தென்றல்'));
    assert.ok(text.includes('60 நொடி அரசன்'));
    assert.ok(text.includes('இளைய பாரதி'));
    assert.ok(text.includes('தமிழ் நதி'));
    assert.ok(text.includes('தமிழ்க் கற்பகத்தரு'));
  } finally {
    server.close();
  }
});

// 7. Tell me about his social service (English)
test('MVR Biography: "Tell me about his social service" returns Eedhal Foundation and Temple Preservation', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me about his social service.',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'social_service');
    assert.ok(data.reply.english.includes('Eedhal Foundation'));
    assert.ok(data.reply.english.includes('sanitation workers'));
    assert.ok(data.reply.english.includes('ancient temples'));
  } finally {
    server.close();
  }
});

// 8. MVR pathi sollunga (Tanglish)
test('MVR Biography: "MVR pathi sollunga" processes Tanglish query naturally', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'MVR pathi sollunga.',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'personal_profile');
    assert.ok(data.reply.text.includes('Madurai') || data.reply.text.includes('மதுரை'));
  } finally {
    server.close();
  }
});

// 9. What are his major achievements? (English)
test('MVR Biography: "What are his major achievements?" returns 1,200+ stories, 500+ speeches, 100+ debate shows', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What are his major achievements?',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'achievements');
    const text = data.reply.english;
    assert.ok(text.includes('1,200'));
    assert.ok(text.includes('500'));
    assert.ok(text.includes('100'));
  } finally {
    server.close();
  }
});

// 10. Who should I contact for information not included in this biography?
test('MVR Biography: Unlisted contact inquiry returns official coordination desk details', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Who should I contact for information not included in this biography?',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'contact_unlisted');
    assert.ok(data.reply.english.includes('inquiry@inspireup.com'));
    assert.ok(data.reply.english.includes('+91 (0) 44 2000 0000'));
    assert.ok(data.reply.english.includes('#contact'));
  } finally {
    server.close();
  }
});

// 11. Tanglish: "Avar enna books ezhuthirukkar?"
test('MVR Biography: Tanglish "Avar enna books ezhuthirukkar?" lists authored books', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Avar enna books ezhuthirukkar?',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'books');
    assert.ok(data.reply.text.includes('Oru Nimidak Kadhai') || data.reply.text.includes('ஒரு நிமிடக் கதை'));
  } finally {
    server.close();
  }
});

// 12. Tanglish: "Avarukku enna awards kidaichirukku?"
test('MVR Biography: Tanglish "Avarukku enna awards kidaichirukku?" lists awards', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Avarukku enna awards kidaichirukku?',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'awards');
    assert.ok(data.reply.text.includes('Tamil Maamani') || data.reply.text.includes('தமிழ்மாமணி'));
  } finally {
    server.close();
  }
});

// 13. Television appearances: "அவர் எந்தத் தொலைக்காட்சி நிகழ்ச்சிகளில் பங்கேற்றார்?"
test('MVR Biography: Television appearances return Vijay TV KPY, Sun TV APY, and Sun Network', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'அவர் எந்தத் தொலைக்காட்சி நிகழ்ச்சிகளில் பங்கேற்றார்?',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'television');
    assert.ok(data.reply.tamil.includes('கலக்கப் போவது யாரு'));
    assert.ok(data.reply.tamil.includes('அசத்தப் போவது யாரு'));
    assert.ok(data.reply.tamil.includes('சன் நெட்வொர்க்'));
  } finally {
    server.close();
  }
});

// 14. International speaking engagements
test('MVR Biography: International engagements returns Malaysia, Sri Lanka, London, Dubai', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me about his international speaking engagements.',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'international');
    assert.ok(data.reply.english.includes('Malaysia'));
    assert.ok(data.reply.english.includes('Sri Lanka'));
    assert.ok(data.reply.english.includes('London'));
    assert.ok(data.reply.english.includes('Dubai'));
  } finally {
    server.close();
  }
});

// 15. Film lyrics
test('MVR Biography: Film lyrics returns lyricist contribution for leading Tamil composers', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'திரைத்துறையில் அவர் பாடலாசிரியர் பங்களிப்பு என்ன?',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'film_lyrics');
    assert.ok(data.reply.tamil.includes('பாடலாசிரிய'));
    assert.ok(data.reply.tamil.includes('இசையமைப்பாளர்'));
  } finally {
    server.close();
  }
});

// 16. Temple preservation
test('MVR Biography: Temple preservation returns ancient temple restoration work', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'திருக்கோயில் பாதுகாப்பு பணிகள் பற்றி சொல்லுங்கள்.',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'temple_preservation');
    assert.ok(data.reply.tamil.includes('திருக்கோயில்களின் பாதுகாப்பு'));
  } finally {
    server.close();
  }
});

// 17. Unverified personal claims: Net worth or salary
test('MVR Biography: Unverified claims (salary/net worth) safely report missing from profile', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is his net worth and salary?',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.action.availableInProfile, false);
    assert.ok(data.reply.english.includes('not available in the supplied official profile'));
  } finally {
    server.close();
  }
});

// 18. Multi-turn follow-up conversation
test('MVR Biography: Multi-turn conversation preserves context across questions', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Which books has he written?',
        language: 'en-US',
        history: [
          { sender: 'user', text: 'Who is MVR?' },
          { sender: 'assistant', text: 'Madurai V. Ramakrishnan is a leading keynote speaker and author.' }
        ]
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.intent, 'mvr_biography');
    assert.equal(data.action.category, 'books');
    assert.ok(data.reply.english.includes('Oru Nimidak Kadhai'));
  } finally {
    server.close();
  }
});

// 19. Gemini Mock Function Calling: Model calls getMvrBiography tool
test('MVR Biography: Mocked Gemini AI calls getMvrBiography tool and synthesizes answer', async () => {
  let toolCallExecuted = false;

  const mockAi = {
    models: {
      generateContent: async ({ contents }) => {
        // First turn: Gemini decides to call getMvrBiography
        if (!toolCallExecuted) {
          toolCallExecuted = true;
          return {
            functionCalls: [
              {
                name: 'getMvrBiography',
                args: { query: 'What books has MVR written?', category: 'books' }
              }
            ],
            candidates: [{ content: { parts: [{ text: '' }] } }]
          };
        }

        // Second turn: After receiving tool response, Gemini summarizes
        return {
          text: 'According to the verified profile, Madurai V. Ramakrishnan has authored six masterworks including Oru Nimidak Kadhai (Parts 1 & 2), Oru Nimidak Kavithai, Kaathirungal Kaadhalippom, Kadhaippoma, and Vizhumun Ezhumin.',
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
        message: 'What books has MVR written?',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.meta.provider, 'google_gemini');
    assert.equal(data.action.action, 'getMvrBiography');
    assert.equal(data.action.category, 'books');
    assert.ok(data.reply.text.includes('Oru Nimidak Kadhai'));
  } finally {
    server.close();
  }
});
