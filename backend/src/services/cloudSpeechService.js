import fs from 'node:fs';
import speech from '@google-cloud/speech';
import textToSpeech from '@google-cloud/text-to-speech';

const { SpeechClient } = speech;
const { TextToSpeechClient } = textToSpeech;

let mockSpeechClient = null;
let mockTtsClient = null;

/**
 * Injects mock clients for deterministic testing without credentials or API quota.
 */
export function setMockSpeechClient(client) {
  mockSpeechClient = client;
}

export function setMockTtsClient(client) {
  mockTtsClient = client;
}

export function resetMockSpeechClients() {
  mockSpeechClient = null;
  mockTtsClient = null;
}

/**
 * Checks if Google Cloud Speech credentials are configured.
 */
export function isCloudSpeechConfigured() {
  if (mockSpeechClient || mockTtsClient) return true;

  const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (
    !creds ||
    !creds.trim() ||
    creds === 'path/to/service-account.json' ||
    creds.includes('path\\to') ||
    creds.includes('path/to')
  ) {
    return false;
  }

  try {
    return fs.existsSync(creds);
  } catch {
    return false;
  }
}

/**
 * Returns SpeechClient or null if unconfigured.
 */
function getSpeechClient() {
  if (mockSpeechClient) return mockSpeechClient;
  if (!isCloudSpeechConfigured()) return null;

  try {
    return new SpeechClient();
  } catch (err) {
    console.error('[SpeechClient Init Error]:', err.message);
    return null;
  }
}

/**
 * Returns TextToSpeechClient or null if unconfigured.
 */
function getTtsClient() {
  if (mockTtsClient) return mockTtsClient;
  if (!isCloudSpeechConfigured()) return null;

  try {
    return new TextToSpeechClient();
  } catch (err) {
    console.error('[TtsClient Init Error]:', err.message);
    return null;
  }
}

/**
 * Transcribes audio via Google Cloud Speech-to-Text.
 *
 * @param {object} params
 * @param {string} params.audioBase64 - Base64 encoded audio
 * @param {string} [params.format] - 'audio/webm', 'audio/wav', 'audio/ogg', 'audio/mp3'
 * @param {string} [params.language] - 'ta-IN' or 'en-US'
 * @returns {Promise<object>}
 */
export async function transcribeAudio({ audioBase64, format = 'audio/webm', language = 'ta-IN' }) {
  if (!audioBase64 || typeof audioBase64 !== 'string' || !audioBase64.trim()) {
    return {
      success: false,
      error: 'Invalid audio payload: "audio" is required and must be a non-empty base64 string.'
    };
  }

  // Enforce 5MB limit
  const approxByteSize = (audioBase64.length * 3) / 4;
  const MAX_BYTES = 5 * 1024 * 1024;
  if (approxByteSize > MAX_BYTES) {
    return {
      success: false,
      error: 'Audio payload exceeds maximum allowed size of 5MB.'
    };
  }

  const client = getSpeechClient();
  if (!client) {
    return {
      success: false,
      configured: false,
      error: 'Google Cloud Speech provider is not configured on the server. Please configure GOOGLE_APPLICATION_CREDENTIALS in .env or use browser Web Speech API.',
      fallbackAvailable: true
    };
  }

  // Determine encoding
  const formatLower = (format || 'audio/webm').toLowerCase();
  let encoding = 'WEBM_OPUS';
  let sampleRateHertz = 48000;

  if (formatLower.includes('wav')) {
    encoding = 'LINEAR16';
    sampleRateHertz = 16000;
  } else if (formatLower.includes('ogg')) {
    encoding = 'OGG_OPUS';
    sampleRateHertz = 48000;
  } else if (formatLower.includes('mp3')) {
    encoding = 'MP3';
    sampleRateHertz = 16000;
  } else if (formatLower.includes('webm')) {
    encoding = 'WEBM_OPUS';
    sampleRateHertz = 48000;
  } else {
    return {
      success: false,
      error: `Unsupported audio format '${format}'. Supported: audio/webm, audio/wav, audio/ogg, audio/mp3.`
    };
  }

  const languageCode = language || 'ta-IN';

  const request = {
    audio: {
      content: audioBase64.replace(/^data:audio\/\w+;base64,/, '')
    },
    config: {
      encoding,
      sampleRateHertz,
      languageCode,
      enableAutomaticPunctuation: true,
      model: 'default'
    }
  };

  try {
    const [response] = await client.recognize(request);
    const transcript = (response.results || [])
      .map((result) => result.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join('\n')
      .trim();

    if (!transcript) {
      return {
        success: true,
        configured: true,
        transcript: '',
        message: 'No speech was recognized in the audio segment. Please speak clearly.'
      };
    }

    return {
      success: true,
      configured: true,
      transcript,
      language: languageCode,
      provider: 'google_cloud_stt'
    };
  } catch (err) {
    console.error('[Cloud STT Transcription Error]:', err.message);
    return {
      success: false,
      configured: true,
      error: 'Speech recognition failed with the provider. Please try again or use text input.',
      detailsSafe: err.code ? `Provider code: ${err.code}` : 'Provider error'
    };
  }
}

/**
 * Synthesizes text into high-quality Tamil or English neural audio via Google Cloud Text-to-Speech.
 *
 * @param {object} params
 * @param {string} params.text - Text to synthesize
 * @param {string} [params.language] - 'ta-IN' or 'en-US'
 * @param {string} [params.gender] - 'FEMALE' or 'MALE'
 * @returns {Promise<object>} Base64 encoded audio
 */
export async function synthesizeSpeech({ text, language = 'ta-IN', gender = 'FEMALE' }) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      success: false,
      error: 'Invalid text payload: "text" is required for speech synthesis.'
    };
  }

  const trimmedText = text.trim();
  if (trimmedText.length > 1000) {
    return {
      success: false,
      error: 'Text exceeds maximum length of 1000 characters for speech synthesis.'
    };
  }

  const client = getTtsClient();
  if (!client) {
    return {
      success: false,
      configured: false,
      error: 'Google Cloud Text-to-Speech is not configured on the server. Please configure GOOGLE_APPLICATION_CREDENTIALS in .env or use browser Web Speech Synthesis.',
      fallbackAvailable: true
    };
  }

  const isTamil = language === 'ta-IN';
  const languageCode = isTamil ? 'ta-IN' : 'en-IN';
  // Use Neural Wavenet voices if available, falling back gracefully
  const voiceName = isTamil ? 'ta-IN-Wavenet-A' : 'en-IN-Wavenet-A';

  const request = {
    input: { text: trimmedText },
    voice: {
      languageCode,
      name: voiceName,
      ssmlGender: gender === 'MALE' ? 'MALE' : 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.95,
      pitch: 0.0
    }
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    if (!response || !response.audioContent) {
      return {
        success: false,
        configured: true,
        error: 'Failed to receive synthesized audio content from provider.'
      };
    }

    const audioBase64 = Buffer.isBuffer(response.audioContent)
      ? response.audioContent.toString('base64')
      : Buffer.from(response.audioContent).toString('base64');

    return {
      success: true,
      configured: true,
      audioContent: audioBase64,
      format: 'audio/mp3',
      language: languageCode,
      voiceName,
      provider: 'google_cloud_tts'
    };
  } catch (err) {
    console.error('[Cloud TTS Synthesis Error]:', err.message);
    return {
      success: false,
      configured: true,
      error: 'Speech synthesis failed with the provider. Falling back to visual text response.',
      fallbackAvailable: true,
      detailsSafe: err.code ? `Provider code: ${err.code}` : 'Provider error'
    };
  }
}
