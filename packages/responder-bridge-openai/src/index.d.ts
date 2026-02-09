import { Provider } from "@hak2i/responder-bridge";

export interface OpenAIProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  retries?: number;
}

export class OpenAIProvider implements Provider {
  constructor(opts: OpenAIProviderOptions);
  generate(input: {
    model: string;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
  }): Promise<{ text: string }>;
}
