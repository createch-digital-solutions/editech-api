import OpenAI from 'openai';

/**
 * OpenAI Client Wrapper (Course generation & embeddings)
 */
export class OpenAiClientWrapper {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && !apiKey.includes('placeholder')) {
      this.client = new OpenAI({ apiKey });
    }
  }

  // TODO: Implement OpenAI course outline and lesson generation in Phase 6
  async generateCourseOutline(_prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client is not configured or in stub mode.');
    }
    throw new Error(
      'OpenAI course generation is not implemented yet. Scheduled for Phase 6.',
    );
  }
}

export const openAiClient = new OpenAiClientWrapper();
