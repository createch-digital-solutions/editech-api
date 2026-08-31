import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic Claude Client Wrapper (AI Tutoring & Conversational agent)
 */
export class AnthropicClientWrapper {
  private client: Anthropic | null = null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && !apiKey.includes('placeholder')) {
      this.client = new Anthropic({ apiKey });
    }
  }

  // TODO: Implement Claude conversational AI tutoring streaming in Phase 6
  async streamTutorResponse(messages: unknown[]): Promise<never> {
    if (!this.client) {
      throw new Error('Anthropic client is not configured or in stub mode.');
    }
    throw new Error(
      'Anthropic AI tutoring is not implemented yet. Scheduled for Phase 6.',
    );
  }
}

export const anthropicClient = new AnthropicClientWrapper();
