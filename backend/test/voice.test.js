import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import {
  setMockSpeechClient,
  setMockTtsClient,
  resetMockSpeechClients
} from '../src/services/cloudSpeechService.js';

test.beforeEach(() => {
  resetMockSpeechClients();
});

test.afterEach(() => {
  resetMockSpeechClients();
});

test('POST /api/assistant/voice transcribes Tamil audio via mocked Google Cloud STT without quota consumption', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  // Injected Mock Speech Client simulating Google Cloud Speech recognize()
  setMockSpeechClient({
    recognize: async (request) => {
      assert.equal(request.config.languageCode, 'ta-IN');
      assert.equal(request.config.encoding, 'WEBM_OPUS');
      assert.ok(request.audio.content);
      return [{
        results: [
          {
            alternatives: [
              {
                transcript: 'வணக்கம், உங்கள் அடுத்த மோட்டிவேஷனல் பேச்சு எப்போது?',
                confidence: 0.98
              }
            ]
          }
        ]
      }];
    }
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: 'dGVzdF9hdWRpb19kYXRh', // base64 encoded test chunk
        format: 'audio/webm',
        language: 'ta-IN'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.transcript, 'வணக்கம், உங்கள் அடுத்த மோட்டிவேஷனல் பேச்சு எப்போது?');
    assert.equal(data.language, 'ta-IN');
    assert.equal(data.provider, 'google_cloud_stt');
  } finally {
    server.close();
  }
});

test('POST /api/assistant/voice transcribes English audio via mocked Google Cloud STT', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  setMockSpeechClient({
    recognize: async (request) => {
      assert.equal(request.config.languageCode, 'en-US');
      return [{
        results: [
          {
            alternatives: [
              {
                transcript: 'What keynote sessions are available in November?',
                confidence: 0.96
              }
            ]
          }
        ]
      }];
    }
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: 'dGVzdF9lbmdsaXNoX2F1ZGlv',
        format: 'audio/webm',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.transcript, 'What keynote sessions are available in November?');
    assert.equal(data.language, 'en-US');
  } finally {
    server.close();
  }
});

test('POST /api/assistant/voice with processChat: true pipes directly into conversational orchestrator', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  setMockSpeechClient({
    recognize: async () => [{
      results: [
        {
          alternatives: [
            { transcript: 'Tell me about your services' }
          ]
        }
      ]
    }]
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: 'dGVzdF9jaGF0X3BpcGU=',
        format: 'audio/webm',
        language: 'en-US',
        processChat: true
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.transcript, 'Tell me about your services');
    assert.ok(data.chat);
    assert.equal(data.chat.success, true);
    assert.ok(data.chat.reply.english);
  } finally {
    server.close();
  }
});

test('POST /api/assistant/voice rejects unsupported audio formats with 400', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: 'dGVzdA==',
        format: 'audio/flac' // Unsupported
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('Unsupported audio format'));
  } finally {
    server.close();
  }
});

test('POST /api/assistant/voice rejects oversized payload (>5MB) with 413', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    // Generate simulated base64 payload representing ~5.2MB (> 5MB body limit)
    const oversizedBase64 = 'A'.repeat(5400000);
    const res = await fetch(`http://localhost:${port}/api/assistant/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: oversizedBase64,
        format: 'audio/webm'
      })
    });

    assert.equal(res.status, 413);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('exceeds maximum allowed size') || data.error.toLowerCase().includes('too large'));
  } finally {
    server.close();
  }
});

test('POST /api/assistant/voice handles provider failure with 502 Bad Gateway and sanitized error', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  // Mock a failing Speech Client
  setMockSpeechClient({
    recognize: async () => {
      const err = new Error('Upstream Google Cloud RPC connection timeout');
      err.code = 4; // DEADLINE_EXCEEDED
      throw err;
    }
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: 'dGVzdF9mYWlsdXJl',
        format: 'audio/webm'
      })
    });

    assert.equal(res.status, 502);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.configured, true);
    assert.ok(data.error.includes('Speech recognition failed with the provider'));
  } finally {
    server.close();
  }
});

test('POST /api/assistant/tts synthesizes Tamil neural speech via mocked Google Cloud TTS', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  // Simulated base64 audio response for 'ta-IN-Wavenet-A'
  const mockAudioBuffer = Buffer.from('mock_mp3_audio_stream_tamil');

  setMockTtsClient({
    synthesizeSpeech: async (request) => {
      assert.equal(request.voice.languageCode, 'ta-IN');
      assert.equal(request.voice.name, 'ta-IN-Wavenet-A');
      assert.equal(request.audioConfig.audioEncoding, 'MP3');
      return [{
        audioContent: mockAudioBuffer
      }];
    }
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'வணக்கம்! InspireUp-க்கு வரவேற்கிறோம்.',
        language: 'ta-IN',
        gender: 'FEMALE'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.format, 'audio/mp3');
    assert.equal(data.language, 'ta-IN');
    assert.equal(data.voiceName, 'ta-IN-Wavenet-A');
    assert.equal(data.audioContent, mockAudioBuffer.toString('base64'));
  } finally {
    server.close();
  }
});

test('POST /api/assistant/tts synthesizes English neural speech via mocked Google Cloud TTS', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const mockAudioBuffer = Buffer.from('mock_mp3_audio_stream_english');

  setMockTtsClient({
    synthesizeSpeech: async (request) => {
      assert.equal(request.voice.languageCode, 'en-IN');
      assert.equal(request.voice.name, 'en-IN-Wavenet-A');
      return [{
        audioContent: mockAudioBuffer
      }];
    }
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Welcome to InspireUp motivational speaking.',
        language: 'en-US'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.language, 'en-IN');
    assert.equal(data.voiceName, 'en-IN-Wavenet-A');
  } finally {
    server.close();
  }
});

test('POST /api/assistant/tts returns 503 with fallback flag when provider credentials are unconfigured', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  // Ensure no mock client or creds
  resetMockSpeechClients();

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world speech'
      })
    });

    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.configured, false);
    assert.equal(data.fallbackAvailable, true);
    assert.ok(data.error.includes('Google Cloud Text-to-Speech'));
  } finally {
    server.close();
  }
});

test('POST /api/assistant/tts rejects empty text or oversized text (>1000 chars) with 400', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    // 1. Empty text
    const resEmpty = await fetch(`http://localhost:${port}/api/assistant/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '   ' })
    });
    assert.equal(resEmpty.status, 400);

    // 2. Oversized text
    const resOversized = await fetch(`http://localhost:${port}/api/assistant/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'X'.repeat(1005) })
    });
    assert.equal(resOversized.status, 400);
  } finally {
    server.close();
  }
});

test('POST /api/assistant/tts handles provider failure with 502 and fallback flag', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  setMockTtsClient({
    synthesizeSpeech: async () => {
      throw new Error('TTS Quota Exceeded / Network Timeout');
    }
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Test speech failure'
      })
    });

    assert.equal(res.status, 502);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.configured, true);
    assert.equal(data.fallbackAvailable, true);
  } finally {
    server.close();
  }
});

test('POST /api/assistant/chat with includeAudio: true returns synthesized audio directly', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const mockAudioBuffer = Buffer.from('mock_direct_chat_audio_tamil');

  setMockTtsClient({
    synthesizeSpeech: async () => [{
      audioContent: mockAudioBuffer
    }]
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'வணக்கம்',
        language: 'ta-IN',
        includeAudio: true
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.audio);
    assert.equal(data.audio.format, 'audio/mp3');
    assert.equal(data.audio.audioContent, mockAudioBuffer.toString('base64'));
  } finally {
    server.close();
  }
});
