import { GoogleGenAI } from '@google/genai';
import { GEMINI_TOOLS, INSPIREUP_SYSTEM_INSTRUCTION } from './geminiTools.js';
import { executeSafeAction, ALLOWED_ACTIONS } from './safeActions.js';

let mockClient = null;

/**
 * Injects a mock client for deterministic unit testing without consuming API quota.
 */
export function setMockGeminiClient(client) {
  mockClient = client;
}

/**
 * Resets any active mock client back to null.
 */
export function resetMockGeminiClient() {
  mockClient = null;
}

/**
 * Returns active GoogleGenAI client instance or null if unconfigured.
 */
export function getGeminiClient() {
  if (mockClient) {
    return mockClient;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  // Genuine Google AI Studio Gemini API keys begin with 'AIza'
  if (
    !apiKey ||
    !apiKey.trim() ||
    apiKey === 'your_gemini_api_key_here' ||
    apiKey.startsWith('your_gemini_api_key_here') ||
    !apiKey.startsWith('AIza')
  ) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Validates and sanitizes multi-turn conversation history from the client.
 * Bounded by max turn count (8 turns) and character limits (1000 chars/turn).
 */
export function sanitizeConversationHistory(rawHistory = []) {
  if (!Array.isArray(rawHistory)) return [];

  const sanitized = [];
  // Restrict to the most recent 8 messages to avoid context explosion
  const boundedSlice = rawHistory.slice(-8);

  for (const item of boundedSlice) {
    if (!item || typeof item !== 'object') continue;

    // Determine normalized role (only 'user' and 'model' allowed)
    let role = 'user';
    if (item.role === 'model' || item.role === 'assistant' || item.sender === 'assistant') {
      role = 'model';
    }

    // Extract text content safely
    let text = '';
    if (typeof item.text === 'string') {
      text = item.text;
    } else if (typeof item.textTamil === 'string' || typeof item.textEnglish === 'string') {
      text = [item.textTamil, item.textEnglish].filter(Boolean).join(' ');
    } else if (Array.isArray(item.parts) && item.parts[0]?.text) {
      text = item.parts[0].text;
    }

    const cleanText = text.trim();
    if (!cleanText) continue;

    // Enforce character limit
    const boundedText = cleanText.slice(0, 1000);

    sanitized.push({
      role,
      parts: [{ text: boundedText }]
    });
  }

  return sanitized;
}

/**
 * Executes a conversational turn with Google Gemini AI.
 * Handles multi-turn memory, tool calling, and bilingual response generation.
 *
 * @param {object} params
 * @param {string} params.message - Current user query
 * @param {string} [params.language] - 'ta-IN' or 'en-US'
 * @param {Array} [params.history] - Prior conversational turns
 * @returns {Promise<object>} Result containing model text, tool results, and meta
 */
export async function runGeminiConversation({ message, language = 'ta-IN', history = [] }) {
  const ai = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!ai) {
    return {
      success: false,
      configured: false,
      error: 'Gemini API key is not configured in the backend environment. Please set GEMINI_API_KEY in .env.'
    };
  }

  // 1. Sanitize history and construct contents array
  const sanitizedHistory = sanitizeConversationHistory(history);
  const promptContext = language === 'ta-IN'
    ? `[Speech-to-Speech Mode: User spoken input in Tamil. Formulate verbal reply STRICTLY in natural spoken Tamil (தமிழ்)]: ${message}`
    : message;

  const contents = [
    ...sanitizedHistory,
    {
      role: 'user',
      parts: [
        {
          text: promptContext
        }
      ]
    }
  ];

  try {
    // 2. First call to Gemini with tools enabled
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: INSPIREUP_SYSTEM_INSTRUCTION,
        tools: GEMINI_TOOLS,
        temperature: 0.4,
        maxOutputTokens: 800
      }
    });

    let executedAction = null;
    let finalReply = '';

    // 3. Handle Function Calling if Gemini requested a tool execution
    const functionCalls = response.functionCalls || [];

    if (functionCalls.length > 0) {
      const call = functionCalls[0]; // Process the primary safe tool call
      const { name, args } = call;

      if (!ALLOWED_ACTIONS.includes(name)) {
        return {
          success: false,
          configured: true,
          error: `Model attempted to call an unauthorized action: '${name}'. Rejected by server.`
        };
      }

      // Execute safe action against server allow-list
      const actionResult = await executeSafeAction(name, args || {});
      executedAction = actionResult;

      // Construct second turn to let Gemini formulate the final user response
      const toolTurnContents = [
        ...contents,
        {
          role: 'model',
          parts: response.candidates?.[0]?.content?.parts || [{ text: '' }]
        },
        {
          role: 'tool',
          parts: [
            {
              functionResponse: {
                name,
                response: actionResult
              }
            }
          ]
        }
      ];

      const followUp = await ai.models.generateContent({
        model: modelName,
        contents: toolTurnContents,
        config: {
          systemInstruction: INSPIREUP_SYSTEM_INSTRUCTION,
          tools: GEMINI_TOOLS
        }
      });

      finalReply = followUp.text || '';
    } else {
      finalReply = response.text || '';
    }

    return {
      success: true,
      configured: true,
      reply: {
        text: finalReply,
        tamil: language === 'ta-IN' ? finalReply : '',
        english: language === 'en-US' ? finalReply : ''
      },
      action: executedAction,
      meta: {
        model: modelName,
        provider: 'google_gemini',
        language
      }
    };
  } catch (err) {
    console.error('[Gemini Service Exception]:', err.status || err.message);

    // Provide friendly error without leaking internal secrets
    const isRateLimited = err.status === 429 || (err.message && err.message.includes('429'));
    return {
      success: false,
      configured: true,
      error: isRateLimited
        ? 'Gemini API quota exceeded or rate limit reached. Please try again in a few moments.'
        : 'A communication error occurred with the AI model provider. Please try again or use on-page actions.',
      detailsSafe: err.status ? `Status: ${err.status}` : 'Provider unavailable'
    };
  }
}
