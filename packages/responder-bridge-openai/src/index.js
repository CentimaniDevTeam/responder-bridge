const DEFAULT_BASE_URL = 'https://api.openai.com';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class OpenAIProvider {
  constructor(opts = {}) {
    this.apiKey = opts.apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = opts.baseUrl || process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL;
    this.timeoutMs = opts.timeoutMs || 30000;
    this.retries = opts.retries || 2;
  }

  async generate(input) {
    const url = this.baseUrl.replace(/\/$/, '') + '/v1/chat/completions';
    const body = {
      model: input.model,
      messages: input.messages,
      temperature: input.temperature
    };

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`OpenAI error: ${res.status} ${text}`);
        }
        const data = await res.json();
        const content = data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content
          : '';
        return { text: content || '' };
      } catch (err) {
        clearTimeout(timer);
        if (attempt === this.retries) throw err;
        await sleep(250 * (attempt + 1));
      }
    }
  }
}

module.exports = { OpenAIProvider };
