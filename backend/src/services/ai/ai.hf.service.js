/**
 * Hugging Face Client Service
 * Communicates server-side with Hugging Face router chat completions API.
 * Features timeout protection, error handling, and structured generation.
 */

const config = require('../../config');

class AiHfService {
  constructor() {
    this.routerUrl = config.hfRouterUrl;
    this.defaultModel = config.hfModel;
    this.token = config.hfToken;
  }

  /**
   * Sends a chat completion request to Hugging Face.
   * @param {Array<{role: string, content: string}>} messages 
   * @param {object} options 
   * @returns {Promise<{success: boolean, text: string|null, error: string|null}>}
   */
  async chatCompletion(messages, options = {}) {
    const token = options.token || this.token;
    if (!token) {
      return {
        success: false,
        text: null,
        error: 'HUGGING_FACE_TOKEN_MISSING: HF_TOKEN is not configured in backend environment.'
      };
    }

    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || 800;
    const temperature = options.temperature !== undefined ? options.temperature : 0.2;
    const timeoutMs = options.timeoutMs || 15000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.routerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text();
        return {
          success: false,
          text: null,
          error: `Hugging Face API returned HTTP ${response.status}: ${errText}`
        };
      }

      const data = await response.json();
      const content = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : null;

      if (!content) {
        return {
          success: false,
          text: null,
          error: 'Empty response from Hugging Face model.'
        };
      }

      return {
        success: true,
        text: content.trim(),
        error: null
      };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        return {
          success: false,
          text: null,
          error: `Hugging Face request timed out after ${timeoutMs / 1000}s.`
        };
      }
      return {
        success: false,
        text: null,
        error: `Hugging Face request error: ${err.message}`
      };
    }
  }
}

module.exports = new AiHfService();
