import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { processAssistantChat, isGeminiConfigured } from '../services/aiOrchestrator.js';
import { ALLOWED_ACTIONS, ALLOWED_NAV_SECTIONS } from '../services/safeActions.js';
import {
  transcribeAudio,
  synthesizeSpeech,
  isCloudSpeechConfigured
} from '../services/cloudSpeechService.js';

export const assistantRouter = Router();

// Rate limiter for chat endpoint: 60 requests per 15 minutes per IP
export const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many assistant requests from this IP. Please try again after 15 minutes.'
  }
});

// Rate limiter for voice & tts endpoint: 30 requests per 15 minutes per IP
export const voiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many voice requests from this IP. Please try again after 15 minutes.'
  }
});

/**
 * GET /api/assistant/health
 * Reports assistant status and capability readiness.
 */
assistantRouter.get('/health', (req, res) => {
  const geminiConfigured = isGeminiConfigured();
  const cloudSpeechConfigured = isCloudSpeechConfigured();

  res.json({
    assistant: 'InspireUp Tamil Voice AI Assistant',
    status: 'initialized',
    languages: ['ta-IN (Tamil)', 'en-US (English)'],
    geminiConfigured,
    cloudSpeechConfigured,
    safeActions: ALLOWED_ACTIONS,
    voiceCapabilities: {
      stt: cloudSpeechConfigured
        ? 'Google Cloud Speech-to-Text (ta-IN / en-US) + Web Speech fallback'
        : 'Web Speech API (ta-IN) (Cloud STT not configured in .env)',
      tts: cloudSpeechConfigured
        ? 'Google Cloud Text-to-Speech (ta-IN Wavenet Neural) + Web Speech fallback'
        : 'Web Speech Synthesis (Cloud TTS not configured in .env)'
    }
  });
});

/**
 * GET /api/assistant/actions
 * Returns permitted action definitions and internal navigation boundaries.
 */
assistantRouter.get('/actions', (req, res) => {
  res.json({
    allowedActions: ALLOWED_ACTIONS,
    allowedNavigationSections: ALLOWED_NAV_SECTIONS,
    rules: [
      'Model-generated SQL execution is strictly prohibited.',
      'Shell command execution is strictly prohibited.',
      'External URL navigation is prohibited; only on-page sections allowed.',
      'No booking records will be created without explicit user confirmation in a dedicated booking flow.'
    ]
  });
});

/**
 * POST /api/assistant/chat
 * Main conversational endpoint with input validation and safe action dispatch.
 */
assistantRouter.post('/chat', chatLimiter, async (req, res) => {
  try {
    const { message, language, action, actionArgs, history, conversationHistory, includeAudio, bookingDraft } = req.body || {};

    // 1. Validate message parameter
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: "message" is required and must be a non-empty string.'
      });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: "message" cannot be blank.'
      });
    }

    if (trimmedMessage.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: "message" exceeds maximum allowed length of 1000 characters.'
      });
    }

    // 2. Validate explicit action if provided
    if (action && !ALLOWED_ACTIONS.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Action '${action}' is not permitted. Permitted actions: ${ALLOWED_ACTIONS.join(', ')}`
      });
    }

    const effectiveHistory = Array.isArray(history)
      ? history
      : (Array.isArray(conversationHistory) ? conversationHistory : []);

    const effectiveLanguage = language === 'en-US' ? 'en-US' : 'ta-IN';

    // 3. Process chat with multi-turn history and safe action
    const response = await processAssistantChat({
      message: trimmedMessage,
      language: effectiveLanguage,
      history: effectiveHistory,
      requestedAction: action,
      actionArgs: actionArgs && typeof actionArgs === 'object' ? actionArgs : {},
      bookingDraft: bookingDraft && typeof bookingDraft === 'object' ? bookingDraft : null
    });

    // 4. If client requested audio and Cloud TTS is available, synthesize speech
    if (includeAudio && response.success) {
      const textToSpeak = response.reply?.text || response.reply?.tanglish || response.reply?.tamil || response.reply?.english;
      if (textToSpeak && isCloudSpeechConfigured()) {
        const ttsResult = await synthesizeSpeech({
          text: textToSpeak,
          language: effectiveLanguage
        });
        if (ttsResult.success) {
          response.audio = {
            audioContent: ttsResult.audioContent,
            format: ttsResult.format,
            voiceName: ttsResult.voiceName
          };
        }
      }
    }

    return res.json(response);
  } catch (err) {
    console.error('[Assistant Chat Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while processing your request. Please try again later.'
    });
  }
});

/**
 * POST /api/assistant/voice
 * Voice transcription endpoint using Google Cloud Speech-to-Text.
 * Enforces payload limits (5MB) and verifies cloud provider configuration.
 */
assistantRouter.post('/voice', voiceLimiter, async (req, res) => {
  try {
    const { audio, format, language, processChat, history } = req.body || {};

    // 1. Strict Payload Validation
    if (!audio || typeof audio !== 'string' || !audio.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid voice request: "audio" payload (base64 encoded) is required.'
      });
    }

    // Size limit check: Max 5MB base64 audio payload
    const approxByteSize = (audio.length * 3) / 4;
    const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
    if (approxByteSize > MAX_AUDIO_BYTES) {
      return res.status(413).json({
        success: false,
        error: 'Audio payload exceeds maximum allowed size limit of 5MB.'
      });
    }

    const allowedFormats = ['audio/webm', 'audio/wav', 'audio/ogg', 'audio/mp3'];
    if (format && !allowedFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Unsupported audio format '${format}'. Allowed formats: ${allowedFormats.join(', ')}`
      });
    }

    // 2. Perform Transcription via Cloud Speech Service
    const sttResult = await transcribeAudio({
      audioBase64: audio,
      format: format || 'audio/webm',
      language: language || 'ta-IN'
    });

    if (!sttResult.success) {
      const statusCode = sttResult.configured === false ? 503 : (sttResult.configured === true ? 502 : 400);
      return res.status(statusCode).json(sttResult);
    }

    // 3. If processChat is requested and speech was detected, pipe directly to chat orchestrator
    if (processChat && sttResult.transcript) {
      const chatResponse = await processAssistantChat({
        message: sttResult.transcript,
        language: language || 'ta-IN',
        history: Array.isArray(history) ? history : []
      });

      return res.json({
        success: true,
        transcript: sttResult.transcript,
        chat: chatResponse
      });
    }

    return res.json(sttResult);
  } catch (err) {
    console.error('[Assistant Voice Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while processing voice input.'
    });
  }
});

/**
 * POST /api/assistant/tts
 * Speech synthesis endpoint using Google Cloud Text-to-Speech (Neural Tamil voices).
 */
assistantRouter.post('/tts', voiceLimiter, async (req, res) => {
  try {
    const { text, language, gender } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: "text" is required for speech synthesis.'
      });
    }

    const trimmedText = text.trim();
    if (trimmedText.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Text exceeds maximum length of 1000 characters for speech synthesis.'
      });
    }

    const ttsResult = await synthesizeSpeech({
      text: trimmedText,
      language: language || 'ta-IN',
      gender: gender || 'FEMALE'
    });

    if (!ttsResult.success) {
      const statusCode = ttsResult.configured === false ? 503 : (ttsResult.configured === true ? 502 : 400);
      return res.status(statusCode).json(ttsResult);
    }

    return res.json(ttsResult);
  } catch (err) {
    console.error('[Assistant TTS Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while synthesizing speech.'
    });
  }
});
